from __future__ import annotations

from fastapi import APIRouter

from app.config import MODEL_PROFILES, settings
from app.services.model_registry import model_registry


router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict:
    models = model_registry.available()
    return {
        "status": "ready" if model_registry.loaded_count == len(MODEL_PROFILES) else "loading",
        "model_directory": str(settings.model_dir),
        "models_available": len(models),
        "models_loaded": model_registry.loaded_count,
    }


@router.get("/models")
def list_models() -> dict:
    models = model_registry.available()
    return {
        "models": [model.model_dump() for model in models],
        "compare_available": len(models) > 1,
    }
