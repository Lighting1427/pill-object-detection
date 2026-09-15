from pathlib import Path 
from ultralytics import YOLO

PROJECT_ROOT = Path.cwd()
DATA_YAML_PATH = PROJECT_ROOT / "pill-data-set-clean" / "data.yaml"

if not DATA_YAML_PATH.exists():
    raise FileNotFoundError(f"ไม่พบไฟล์: {DATA_YAML_PATH.resolve()}")

model = YOLO("yolo26s.pt")


model.train(
    data=str(DATA_YAML_PATH),
    epochs=200,
    imgsz=960,
    batch=8,
    patience=30,
    max_det=500,
    project="runs/detect",
    name="pill_yolo26s_960",
)
