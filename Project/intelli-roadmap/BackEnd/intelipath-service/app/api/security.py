from fastapi import Header, HTTPException

from app.config.config import settings


async def verify_api_key(x_api_key: str = Header(default="")) -> None:
    if not settings.service_api_key:
        raise HTTPException(status_code=500, detail="Service API key is not configured.")
    if x_api_key != settings.service_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")
