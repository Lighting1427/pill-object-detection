# Pill Object Detection

โปรเจกต์ตรวจจับและนับเม็ดยาในภาพด้วย Ultralytics YOLO พร้อม REST API ที่สร้างด้วย FastAPI

ระบบจะโหลดโมเดลหนึ่งไฟล์เมื่อเริ่มทำงาน รับภาพผ่าน `POST /predict` และส่งผลลัพธ์เป็น JSON ซึ่งประกอบด้วยจำนวนเม็ดยา ค่า confidence และพิกัด bounding box

## ความสามารถ

- ตรวจสอบสถานะบริการผ่าน `GET /health`
- รับไฟล์ภาพผ่าน `POST /predict`
- ตรวจสอบชนิดไฟล์และปฏิเสธข้อมูลที่ไม่ใช่ภาพ
- ส่งคืนจำนวนเม็ดยา ค่า confidence และพิกัด `x1`, `y1`, `x2`, `y2`
- ปรับโมเดล, confidence threshold, image size และจำนวน detection สูงสุดผ่าน `.env`
- รันได้ทั้งแบบ local และ Docker

## โครงสร้างโปรเจกต์

```text
pill-object-detection/
├── app/
│   ├── __init__.py
│   └── main.py                 # FastAPI application และ YOLO inference
├── pill-model/
│   ├── best_1024.pt
│   └── best_960.pt
├── pill-dataset-clean/         # Dataset รูปแบบ YOLO
│   ├── images/train/
│   ├── images/val/
│   ├── labels/train/
│   ├── labels/val/
│   └── data.yaml
├── eda.ipynb                   # สำรวจข้อมูล
├── prepare_dataset.ipynb       # เตรียม dataset
├── evaluate.ipynb              # ประเมินโมเดล
├── train_yolo.py               # สคริปต์ฝึกโมเดล
├── inference.py                # ตัวอย่าง inference แบบ command line
├── .env.example
├── requirements.txt
├── Dockerfile
└── compose.yaml
```

## การติดตั้ง

แนะนำให้ใช้ Python 3.11 และรันคำสั่งจากโฟลเดอร์หลักของโปรเจกต์

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## การตั้งค่า Environment

คัดลอกไฟล์ตัวอย่างเป็น `.env`:

```powershell
Copy-Item .env.example .env
```

ค่าที่รองรับ:

```dotenv
MODEL_PATH=pill-model/best_1024.pt
CONF_THRESHOLD=0.25
IMAGE_SIZE=960
MAX_DET=500
```

| ตัวแปร | ความหมาย | ค่าเริ่มต้น |
|---|---|---|
| `MODEL_PATH` | ตำแหน่งไฟล์โมเดล โดยใช้ path จาก project root หรือ absolute path | `pill-model/best_1024.pt` |
| `CONF_THRESHOLD` | ค่า confidence ต่ำสุดของ detection | `0.25` |
| `IMAGE_SIZE` | ขนาดภาพที่ส่งเข้าโมเดล | `960` |
| `MAX_DET` | จำนวน detection สูงสุดต่อภาพ | `500` |

## รัน API แบบ Local

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

เมื่อเริ่มทำงานสำเร็จ:

- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

โมเดลจะถูกโหลดตอนเริ่มโปรแกรม หาก `MODEL_PATH` ไม่ถูกต้อง API จะเปิดไม่สำเร็จ

## API Endpoints

| Method | Endpoint | รายละเอียด |
|---|---|---|
| `GET` | `/health` | ตรวจสอบสถานะ API และโมเดลที่กำลังใช้งาน |
| `POST` | `/predict` | อัปโหลดภาพด้วย multipart form field ชื่อ `file` |
| `GET` | `/docs` | Swagger UI |

ตัวอย่างเรียกตรวจจับภาพด้วย PowerShell:

```powershell
curl.exe -X POST http://127.0.0.1:8000/predict -F "file=@C:\path\to\image.jpg"
```

ตัวอย่าง response:

```json
{
  "filename": "image.jpg",
  "width": 1920,
  "height": 1080,
  "pill_count": 1,
  "detections": [
    {
      "class_name": "pill",
      "confidence": 0.9123,
      "bbox": {
        "x1": 120.5,
        "y1": 80.25,
        "x2": 260.75,
        "y2": 220.5
      }
    }
  ]
}
```

## รันด้วย Docker

สร้าง `.env` ก่อน แล้วรันด้วย Docker CLI:

```powershell
docker build -t pill-object-detection .
docker run --rm --name pill-api -p 8000:8000 --env-file .env pill-object-detection
```

หรือใช้ Docker Compose:

```powershell
docker compose up --build
```

หยุดและลบ container ที่สร้างโดย Compose:

```powershell
docker compose down
```

ไฟล์ `.env` ไม่ถูก copy เข้า Docker image ตัวแปรจะถูกส่งผ่าน `--env-file` หรือ `compose.yaml`

## Dataset และการประเมินโมเดล

ไฟล์ `pill-dataset-clean/data.yaml` ใช้ค่าดังนี้เมื่อรันจาก project root:

```yaml
path: pill-dataset-clean
train: images/train
val: images/val

names:
  0: pill
```

Notebook ที่เกี่ยวข้อง:

- `eda.ipynb` สำหรับสำรวจ dataset
- `prepare_dataset.ipynb` สำหรับเตรียมข้อมูล
- `evaluate.ipynb` สำหรับประเมินโมเดลด้วย `model.val(...)`

`train_yolo.py` มีตัวแปร `DATA_YAML_PATH` สำหรับกำหนดตำแหน่ง `data.yaml` ก่อนเริ่มฝึกโมเดล

## หมายเหตุ

- API ปัจจุบันไม่มี frontend และไม่มี endpoint ที่ขึ้นต้นด้วย `/api`
- API โหลดครั้งละหนึ่งโมเดลตาม `MODEL_PATH`
- ผลการตรวจจับเป็นเครื่องมือช่วยวิเคราะห์ภาพ ไม่ควรใช้แทนการยืนยันชนิดยาหรือคำแนะนำจากบุคลากรทางการแพทย์
