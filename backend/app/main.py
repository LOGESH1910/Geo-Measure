"""FastAPI Application Entry Point for GeoMeasure Pro."""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api.routes import files, health

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("geomeasure_pro")

# Create database tables automatically if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas verified/created successfully.")
except Exception as e:
    logger.warning(f"Database table verification deferred: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Professional geospatial file analysis API for KML and Shapefile processing, projection, and planar measurements.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Vite dev server and production origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal geospatial server error occurred.",
            "type": exc.__class__.__name__
        }
    )

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
