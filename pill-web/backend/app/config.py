from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
WEB_DIR = BACKEND_DIR.parent
PROJECT_ROOT = WEB_DIR.parent
load_dotenv(BACKEND_DIR / ".env")

os.environ.setdefault("YOLO_CONFIG_DIR", str(BACKEND_DIR / ".config"))
os.environ.setdefault("MPLCONFIGDIR", str(BACKEND_DIR / ".matplotlib"))
os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")


@dataclass(frozen=True)
class ModelProfile:
    id: str
    label: str
    description: str
    imgsz: int


MODEL_PROFILES = {
    "best_1024.pt": ModelProfile(
        id="best_1024.pt",
        label="Best 1024",
        description="รายละเอียดสูง เหมาะกับเม็ดยาขนาดเล็ก",
        imgsz=1024,
    ),
    "best_960.pt": ModelProfile(
        id="best_960.pt",
        label="Best 960",
        description="โมเดลขนาดใหญ่กว่า เน้นความแม่นยำ",
        imgsz=960,
    ),
}


@dataclass(frozen=True)
class Settings:
    model_dir: Path = Path(os.getenv("PILL_MODEL_DIR", PROJECT_ROOT / "pill-model")).resolve()
    max_upload_bytes: int = 25 * 1024 * 1024
    max_image_pixels: int = 60_000_000
    compare_value: str = "__compare__"
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "PILL_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    )


settings = Settings()
