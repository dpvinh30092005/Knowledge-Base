from contextlib import asynccontextmanager
import logging

import uvicorn
from fastapi import FastAPI
from fastmcp.utilities.lifespan import combine_lifespans

from app.api import flm_routes, recruitment_routes
from app.api.endpoints import extraction
from app.mcp_server import mcp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application started.")
    yield
    logger.info("Application stopped.")


mcp_app = mcp.http_app(path="/")

app = FastAPI(
    title="Intelipath AI Service",
    description="Document extraction and job scraping APIs for Intelipath.",
    version="1.0.0",
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
)

app.include_router(extraction.router, prefix="/api", tags=["extraction"])
app.include_router(recruitment_routes.router)
app.include_router(flm_routes.router)
app.mount("/mcp", mcp_app)


@app.get("/")
async def root():
    return {"message": "Intelipath AI Service API is running. Use /docs for Swagger UI."}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
