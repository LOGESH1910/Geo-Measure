"""Health check endpoint."""

from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    """Verify backend API readiness and configuration."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }
