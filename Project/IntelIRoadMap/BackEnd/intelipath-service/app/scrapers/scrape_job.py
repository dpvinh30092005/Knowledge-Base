"""
Background job-board scrapes.

A scrape is long: every posting costs a detail-page fetch plus an LLM enrichment call,
so 200 postings run for roughly twenty minutes. Held open as a single request that only
answers at the end, the caller's read timeout expires first and the whole transfer is
discarded even though the work completed and the rows are already in this service's
database. Running it here and handing back a job id lets the backend poll cheaply and
collect the result whenever it is ready.

Mirrors app/scrapers/flm/sync_job.py: same in-memory store, same state vocabulary.
"""
import logging
import threading
import uuid
from typing import Callable, Optional

from app.db.database import SessionLocal
from app.scrapers.engines.curl_engine import BlockedIpException

log = logging.getLogger("scraper.job")

# In-memory job store. Fine for a single instance: jobs are short-lived and polled by
# one caller. A restart loses them, which is why the backend treats a missing job as a
# failed run rather than waiting forever.
_JOBS: dict[str, dict] = {}
_LOCK = threading.Lock()


def _update(job_id: str, **changes) -> None:
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is not None:
            job.update(changes)


def get_job(job_id: str) -> Optional[dict]:
    with _LOCK:
        job = _JOBS.get(job_id)
        return dict(job) if job is not None else None


def start_job(source: str, limit: int, parser: Callable, collect: Callable) -> str:
    """Queue a scrape and return its id.

    `parser(limiter, db)` performs the scrape; `collect(db)` runs the AI processing and
    builds the response payload. Both are injected so this module stays independent of
    which board is being scraped.
    """
    job_id = uuid.uuid4().hex
    with _LOCK:
        _JOBS[job_id] = {
            "source": source, "limit": limit,
            "state": "pending", "phase": "queued",
            "message": "Queued", "result": None, "error": None,
        }
    threading.Thread(
        target=_run,
        args=(job_id, source, limit, parser, collect),
        daemon=True,
    ).start()
    return job_id


def _run(job_id: str, source: str, limit: int, parser: Callable, collect: Callable) -> None:
    # The request-scoped session is long gone by the time this thread runs, so the job
    # owns one for its whole life and closes it at the end.
    db = SessionLocal()
    try:
        _update(job_id, state="running", phase="scraping",
                message=f"Scraping up to {limit} posting(s) from {source}…")
        parser(limiter=limit, db=db)

        _update(job_id, phase="processing", message="Summarising the scraped postings…")
        result = collect(db)

        _update(job_id, state="done", phase="done", result=result,
                message=(
                    f"Scraped {source}: "
                    f"{len(result.get('recruitment_posts', []))} post(s) ready to import."
                ))
    except BlockedIpException as exc:
        log.warning("Scrape job %s blocked by %s: %s", job_id, source, exc)
        _update(job_id, state="error", phase="done", error=(
            f"{source} blocked the scraper's IP (Cloudflare challenge). Set SCRAPER_PROXY "
            f"to a residential / Cloudflare-solving proxy and retry. Blocked URL: {exc}"
        ))
    except Exception as exc:  # noqa: BLE001 - surface the failure to the poller
        log.exception("Scrape job %s failed", job_id)
        _update(job_id, state="error", phase="done", error=str(exc))
    finally:
        db.close()
