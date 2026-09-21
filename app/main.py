from io import BytesIO 
import os 
from pathlib import Path
import numpy as np 
from PIL import Image 
from fastapi import(
    FastAPI,
    File,
    UploadFile,
    HTTPException,
)

from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from ultralytics import YOLO 
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")

MODEL_PATH = os.getenv("MODEL_PATH", "pill-model/best_1024.pt")
MODEL_PATH = str(
    Path(MODEL_PATH)
    if Path(MODEL_PATH).is_absolute()
    else PROJECT_ROOT / MODEL_PATH
)

CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.25"))
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "960"))
MAX_DET = int(os.getenv("MAX_DET", "500"))

model = YOLO(MODEL_PATH)

app = FastAPI(
    title=("Pill Detection API"),
    version="1.0.0",
)

# Static files & UI template setup
APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
TEMPLATES_DIR = APP_DIR / "templates"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
def index():
    html_file = TEMPLATES_DIR / "index.html"
    if html_file.exists():
        return HTMLResponse(content=html_file.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Pill Detection API</h1><p>UI template not found.</p>")

# Health endpoint
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_PATH,
    }

#Predict endpoint 
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # ตรวจสอบเบื้องต้นว่าไฟล์ที่อัปโหลดเข้ามาเป็นไฟล์รูปภาพหรือไม่
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image",
        )

    # อ่านข้อมูลไบนารีและโหลดเป็นภาพด้วย PIL พร้อมแปลงโหมดสีเป็น RGB
    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file or corrupted data",
        )

    # ส่งภาพเข้าโมเดล YOLO เพื่อทำนายตำแหน่งและจำนวนเม็ดยา
    results = model.predict(
        source=np.array(image),  # แปลงภาพ PIL เป็น NumPy Array สำหรับ YOLO
        imgsz=IMAGE_SIZE,  # ขนาดภาพที่ใช้ประมวลผล
        conf=CONF_THRESHOLD,  # เกณฑ์ค่าความมั่นใจขั้นต่ำ
        max_det=MAX_DET,  # จำกัดจำนวนวัตถุสูงสุดที่ตรวจจับต่อภาพ
        verbose=False,  # ปิดการพิมพ์ log สรุปใน console
    )

    result = results[0]
    detections = []

    # วนลูปสกัดข้อมูลพิกัด (Bounding Box) และความมั่นใจของแต่ละเม็ดยา
    for box in result.boxes:
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].cpu().tolist()

        detections.append(
            {
                "class_name": "pill",
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                },
            }
        )

    # ส่งผลลัพธ์กลับในรูปแบบ JSON Response
    return {
        "filename": file.filename,
        "width": image.width,
        "height": image.height,
        "pill_count": len(detections),  # จำนวนเม็ดยาทั้งหมดที่ตรวจพบ
        "detections": detections,  # รายการพิกัดและค่าความมั่นใจ
    }
