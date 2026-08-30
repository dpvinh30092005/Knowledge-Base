"""
Admin-triggered FLM sync.

Crawls syllabi (CLOs + materials + sessions) and, when a curriculum id is given,
the curriculum (subject -> semester), using a cookie the admin supplies at call
time. The course CLOs are mapped to the catalog skill names the backend sends, and
everything is merged into the same overlay shape the backend seeds from a file.

Runs in a background thread so the caller can poll progress. The cookie lives only
in this process's memory for the duration of the job and is never logged or persisted.
"""
import logging
import threading
import uuid
from typing import Optional

from app.scrapers.flm import parsers as P
from app.scrapers.flm.client import FlmAuthError, FlmClient
from app.scrapers.flm.flm_to_coverage import build_coverage, build_overlay
from app.scrapers.flm.scraper import discover_curriculum, scrape_syllabus

log = logging.getLogger("flm.sync")

# In-memory job store. Fine for a single-instance admin tool; jobs are short-lived
# and polled once. Never store the cookie here.
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


def start_job(cookie: str, curid: Optional[str], prefixes: Optional[str],
              catalog: list[str], career: Optional[str]) -> str:
    job_id = uuid.uuid4().hex
    with _LOCK:
        _JOBS[job_id] = {
            "state": "pending", "phase": "queued", "done": 0, "total": 0,
            "message": "Queued", "overlay": None, "error": None,
        }
    threading.Thread(
        target=_run,
        args=(job_id, cookie, curid, prefixes, catalog, career),
        daemon=True,
    ).start()
    return job_id


def _discover_codes(client: FlmClient, curid: Optional[str], prefixes: Optional[str]):
    """Subject set for the sync: the curriculum's combos + electives (primary), with
    prefix-autocomplete kept only as an optional legacy fallback.

    Returns (ordered_codes, curriculum_dict). Codes are de-duplicated case-insensitively;
    the curriculum dict is keyed by UPPER code and carries name/semester/credits.
    """
    curriculum: dict[str, dict] = {}
    code_map: dict[str, str] = {}  # UPPER -> spelling (FLM codes are already upper)
    if curid:
        curriculum = discover_curriculum(client, curid)
        for code in curriculum:
            code_map.setdefault(code.upper(), code)
    if prefixes:
        for prefix in [p.strip() for p in prefixes.split(",") if p.strip()]:
            for code in client.subject_codes(prefix):
                code = (code or "").strip()
                if code:
                    code_map.setdefault(code.upper(), code)
    ordered = [code_map[k] for k in sorted(code_map)]
    return ordered, curriculum


def _run(job_id, cookie, curid, prefixes, catalog, career) -> None:
    try:
        _update(job_id, state="running", phase="discovering", message="Discovering subjects…")
        client = FlmClient(cookie=cookie)

        codes, curriculum = _discover_codes(client, curid, prefixes)
        total = len(codes)
        _update(job_id, total=total, phase="scraping",
                message=f"Found {total} subjects. Scraping…")
        if total == 0:
            _update(job_id, state="error", phase="done",
                    error="No subjects found for the given curriculum id / prefixes.")
            return

        subjects = []
        for i, code in enumerate(codes):
            _update(job_id, done=i, message=f"Scraping {code} ({i + 1}/{total})…")
            try:
                syllabus = scrape_syllabus(client, code, curid)
                try:
                    prereqs = P.parse_prerequisites(client.search_prerequisites(code))
                except FlmAuthError:
                    raise
                except Exception as exc:  # noqa: BLE001 - prereqs are optional edges
                    log.warning("  %-12s prereq skipped: %s", code, exc)
                    prereqs = []
                subjects.append({"code": code, "syllabus": syllabus, "prerequisites": prereqs})
            except FlmAuthError:
                raise
            except Exception as exc:  # noqa: BLE001 - keep crawling other subjects
                log.warning("  %-12s failed: %s", code, exc)

        _update(job_id, done=total, phase="mapping", message="Mapping course outcomes to skills…")
        flm = {"subjects": subjects}
        catalog_dicts = [
            {"name": n, "category": "", "careers": [], "importance": ""}
            for n in catalog if isinstance(n, str) and n.strip()
        ]
        coverage = build_coverage(flm, catalog_dicts, None)
        overlay = build_overlay(flm, coverage, curriculum)

        _update(job_id, state="done", phase="done", done=total,
                message=f"Scraped {len(subjects)} subjects.", overlay=overlay)
    except FlmAuthError as exc:
        _update(job_id, state="error", phase="done",
                error=f"FLM rejected the cookie (expired or invalid): {exc}")
    except Exception as exc:  # noqa: BLE001 - surface the failure to the poller
        log.exception("FLM sync job %s failed", job_id)
        _update(job_id, state="error", phase="done", error=str(exc))
