from __future__ import annotations

import threading

import numpy as np
from ultralytics import YOLO

from app.config import MODEL_PROFILES, settings
from app.schemas import ModelInfo


class ModelRegistry:
    """Loads every configured checkpoint before the API starts accepting requests."""

    def __init__(self) -> None:
        self._models: dict[str, YOLO] = {}
        self._load_lock = threading.Lock()

    def available(self) -> list[ModelInfo]:
        models: list[ModelInfo] = []
        for filename, profile in MODEL_PROFILES.items():
            path = settings.model_dir / filename
            if path.is_file():
                models.append(
                    ModelInfo(
                        id=profile.id,
                        label=profile.label,
                        description=profile.description,
                        imgsz=profile.imgsz,
                        size_mb=round(path.stat().st_size / 2**20, 1),
                        loaded=filename in self._models,
                    )
                )
        return models

    def preload_all(self, warmup: bool = True) -> None:
        missing = [filename for filename in MODEL_PROFILES if not (settings.model_dir / filename).is_file()]
        if missing:
            raise FileNotFoundError(
                f"Missing configured model files in {settings.model_dir}: {', '.join(missing)}"
            )

        with self._load_lock:
            for filename in MODEL_PROFILES:
                if filename not in self._models:
                    print(f"Loading model: {filename}", flush=True)
                    self._models[filename] = YOLO(str(settings.model_dir / filename))

            if warmup:
                for filename, profile in MODEL_PROFILES.items():
                    print(f"Warming up model: {filename} at imgsz={profile.imgsz}", flush=True)
                    self._models[filename].predict(
                        source=np.zeros((profile.imgsz, profile.imgsz, 3), dtype=np.uint8),
                        imgsz=profile.imgsz,
                        verbose=False,
                    )
        print(f"All {len(self._models)} models are loaded and ready.", flush=True)

    def get(self, filename: str) -> YOLO:
        if filename not in MODEL_PROFILES:
            raise ValueError(f"Unknown model: {filename}")
        if filename not in self._models:
            raise RuntimeError(f"Model was not preloaded: {filename}")
        return self._models[filename]

    @property
    def loaded_count(self) -> int:
        return len(self._models)


model_registry = ModelRegistry()
