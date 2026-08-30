"""
FLM sync endpoints, called by the backend's admin FLM-sync feature.

The admin supplies an FLM session cookie at call time; it is forwarded straight
into the background job and never logged or persisted. The heavy lifting (crawl +
skill mapping) runs in a thread; poll GET /sync/{job_id} for progress and, once
done, the overlay the backend imports.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.security import verify_api_key
from app.scrapers.flm import sync_job

router = APIRouter(prefix="/api/v1/flm", tags=["flm"], dependencies=[Depends(verify_api_key)])


class FlmSyncRequest(BaseModel):
    cookie: str
    curid: Optional[str] = None
    prefixes: Optional[str] = None
    # Catalog skill names the CLOs are mapped against (the backend owns the catalog).
    catalog: list[str] = []
    career: Optional[str] = None


@router.post("/sync", status_code=202, summary="Start an FLM sync job")
def start_flm_sync(req: FlmSyncRequest):
    if not req.cookie or not req.cookie.strip():
        raise HTTPException(status_code=400, detail="A cookie is required.")
    if not (req.curid or req.prefixes):
        raise HTTPException(status_code=400, detail="Provide a curriculum id and/or subject prefixes.")
    job_id = sync_job.start_job(req.cookie, req.curid, req.prefixes, req.catalog, req.career)
    return {"jobId": job_id}


@router.get("/sync/{job_id}", summary="Poll an FLM sync job")
def get_flm_sync(job_id: str):
    job = sync_job.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job id.")
    return {
        "jobId": job_id,
        "state": job["state"],
        "phase": job["phase"],
        "done": job["done"],
        "total": job["total"],
        "message": job["message"],
        "error": job["error"],
        # Only the terminal "done" state carries the (large) overlay payload.
        "overlay": job["overlay"] if job["state"] == "done" else None,
    }
