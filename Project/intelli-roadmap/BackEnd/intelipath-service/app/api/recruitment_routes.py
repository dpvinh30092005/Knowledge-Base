from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.security import verify_api_key
from app.config.config import settings
from app.scrapers.parsers.topcv_parser import parse_topcv_jobs
from app.scrapers.parsers.itviec_parser import parse_itviec_jobs
from app.scrapers.engines.curl_engine import BlockedIpException
from app.scrapers.processor import process_unprocessed_data
from app.scrapers import scrape_job
from app.db.database import get_db, engine
from app.db.models import Base, ProcessedCompany, ProcessedRecruitment, RecruitmentPost

# Ensure tables exist for local testing
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/api/v1/scraper", tags=["scraper"], dependencies=[Depends(verify_api_key)])


def _blocked_detail(source: str, exc: BlockedIpException) -> str:
    return (
        f"{source} blocked the scraper's IP (Cloudflare challenge). Set SCRAPER_PROXY "
        f"to a residential / Cloudflare-solving proxy and retry. Blocked URL: {exc}"
    )


def _process_and_collect(db: Session) -> dict:
    """AI-summarize any unprocessed raw rows, then return the processed records.

    Shared by every source scraper — the raw tables and the processed output are
    source-agnostic, so the response shape is identical regardless of which board
    was scraped.
    """
    process_unprocessed_data(db=db)

    processed_companies = db.query(ProcessedCompany).all()
    processed_recruitments = db.query(ProcessedRecruitment).all()
    recruitment_posts = db.query(RecruitmentPost).all()

    def to_dict(obj):
        d = {k: v for k, v in obj.__dict__.items() if not k.startswith('_')}
        if 'post_id' in d and hasattr(d['post_id'], '__str__'):
            d['post_id'] = str(d['post_id'])
        if 'expire_at' in d and hasattr(d['expire_at'], '__str__'):
            d['expire_at'] = str(d['expire_at'])
        if 'application_deadline' in d and hasattr(d['application_deadline'], '__str__'):
            d['application_deadline'] = str(d['application_deadline'])
        if 'posted_date' in d and d['posted_date'] is not None:
            d['posted_date'] = str(d['posted_date'])
        return d

    return {
        "processed_companies": [to_dict(c) for c in processed_companies],
        "processed_recruitments": [to_dict(r) for r in processed_recruitments],
        "recruitment_posts": [to_dict(p) for p in recruitment_posts],
    }


def _validate_limit(limit: int) -> None:
    if limit <= 0:
        raise HTTPException(status_code=400, detail="'limit' must be a positive integer.")
    if limit > settings.max_scrape_limit:
        raise HTTPException(status_code=400, detail=f"'limit' must not exceed {settings.max_scrape_limit}.")


@router.get(
    "/scrape/topcv/{limit}",
    status_code=200,
    summary="Start TopCV Scraper",
    description=f"Triggers the web scraper for TopCV. `limit` must be a positive integer, capped at {settings.max_scrape_limit} job posts per request."
)
def start_topcv_scrape(limit: int, db: Session = Depends(get_db)):
    _validate_limit(limit)

    # TopCV sits behind Cloudflare, so a direct (proxy-less) request from a
    # datacenter/residential IP is often challenged. Turn that into a clear 502
    # instead of a 500 stack trace so the caller knows to set SCRAPER_PROXY.
    try:
        parse_topcv_jobs(limiter=limit, db=db)
    except BlockedIpException as exc:
        raise HTTPException(status_code=502, detail=_blocked_detail("TopCV", exc)) from exc

    return _process_and_collect(db)


@router.get(
    "/scrape/itviec/{limit}",
    status_code=200,
    summary="Start ITviec Scraper",
    description=f"Triggers the web scraper for ITviec (IT-focused VN job board, parsed from schema.org JSON-LD). `limit` must be a positive integer, capped at {settings.max_scrape_limit} job posts per request."
)
def start_itviec_scrape(limit: int, db: Session = Depends(get_db)):
    _validate_limit(limit)

    try:
        parse_itviec_jobs(limiter=limit, db=db)
    except BlockedIpException as exc:
        raise HTTPException(status_code=502, detail=_blocked_detail("ITviec", exc)) from exc

    return _process_and_collect(db)


_PARSERS = {"topcv": parse_topcv_jobs, "itviec": parse_itviec_jobs}


@router.post(
    "/jobs/{source}/{limit}",
    status_code=202,
    summary="Start a scrape in the background",
    description=(
        "Queues a scrape and returns a job id to poll. Prefer this over the synchronous "
        "`/scrape/...` routes for anything but a small limit: a large scrape runs for many "
        "minutes and a single blocking request loses the whole result when the caller's read "
        "timeout expires first."
    ),
)
def start_scrape_job(source: str, limit: int):
    parser = _PARSERS.get(source.strip().lower())
    if parser is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown source '{source}'. Use one of: {', '.join(sorted(_PARSERS))}.",
        )
    _validate_limit(limit)
    job_id = scrape_job.start_job(source.strip().lower(), limit, parser, _process_and_collect)
    return {"jobId": job_id}


@router.get("/jobs/{job_id}", summary="Poll a scrape job")
def get_scrape_job(job_id: str):
    job = scrape_job.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job id.")
    return {
        "jobId": job_id,
        "source": job["source"],
        "state": job["state"],
        "phase": job["phase"],
        "message": job["message"],
        "error": job["error"],
        # Only the terminal "done" state carries the (large) scraped payload.
        "result": job["result"] if job["state"] == "done" else None,
    }
