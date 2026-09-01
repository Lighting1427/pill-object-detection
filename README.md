# PillVision

PillVision คือเว็บสำหรับตรวจจับและนับเม็ดยาในภาพด้วยโมเดล Ultralytics YOLO โดยแยก frontend และ backend ออกจากกัน เพื่อให้แก้ไข ทดสอบ และนำไป deploy แยกส่วนได้ง่าย

## ความสามารถ

- อัปโหลดหรือ drag-and-drop ภาพ JPG, PNG, WEBP และ BMP
- เลือกใช้ `best_1024.pt` หรือ `best_960.pt`
- เปรียบเทียบผลจากทั้งสองโมเดลในภาพเดียว
- ปรับ Confidence, IoU และจำนวน detection สูงสุด
- แสดง bounding boxes, จำนวนวัตถุ และเวลา inference
- ดาวน์โหลดภาพผลลัพธ์และรายการ detection เป็น CSV
- preload และ warm-up โมเดลทั้งหมดระหว่างเปิด backend แล้วเก็บไว้ในหน่วยความจำ

## Annotation display

ภาพผลลัพธ์จะแสดงเฉพาะกรอบตรวจจับและหมายเลขลำดับเล็ก ๆ เพื่อไม่ให้ชื่อคลาสหรือค่า confidence บังเม็ดยา รายละเอียด `class`, `confidence` และ bounding box ให้ดูจากตารางผลลัพธ์ด้านล่าง และหมายเลขบนภาพจะอ้างอิงกับคอลัมน์ `#` ในตาราง

## Technology stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | FastAPI, Pydantic, Uvicorn |
| AI inference | Ultralytics YOLO, PyTorch, OpenCV, Pillow |
| API | REST, multipart form data |

## โครงสร้างโปรเจกต์

```text
steel_surface_detection/
├── pill-model/
│   ├── best_1024.pt
│   └── best_960.pt
├── .venv-web/
└── pill-web/
    ├── frontend/
    │   ├── src/
    │   │   ├── components/       # React UI components
    │   │   ├── services/api.ts   # จุดเชื่อมต่อ backend API
    │   │   ├── App.tsx           # Application state และ workflow
    │   │   ├── types.ts          # TypeScript interfaces
    │   │   └── styles.css        # รูปแบบหน้าจอ
    │   ├── .env.example
    │   ├── package.json
    │   └── vite.config.ts
    └── backend/
        ├── app/
        │   ├── routers/          # API endpoints
        │   ├── services/         # Model registry และ inference
        │   ├── config.py         # Path และ environment configuration
        │   ├── schemas.py        # API response schemas
        │   └── main.py           # FastAPI application
        ├── .env.example
        └── requirements.txt
```

## ความต้องการของระบบ

- Python 3.10 ขึ้นไป โดยโปรเจกต์นี้ใช้ `.venv-web`
- Node.js 20 ขึ้นไป
- โมเดลอย่างน้อยหนึ่งไฟล์ในโฟลเดอร์ `pill-model`
- RAM เพียงพอสำหรับโหลดโมเดล; NVIDIA GPU เป็นตัวเลือก ไม่จำเป็นสำหรับการใช้งาน

ตำแหน่งโมเดลเริ่มต้น:

```text
C:\Learn\steel_surface_detection\pill-model\best_1024.pt
C:\Learn\steel_surface_detection\pill-model\best_960.pt
```

## เริ่มใช้งานใน workspace นี้

ต้องเปิด backend และ frontend คนละ terminal โดย **เปิด backend ให้พร้อมก่อน** แล้วจึงเปิด frontend

> ใช้ `.venv-web` เท่านั้นสำหรับเว็บ ไม่ใช้ `.venv` เดิม เพราะ environment เดิมไม่มี dependencies ของ FastAPI upload ครบ

### 1. เปิด backend

จาก `C:\Learn\steel_surface_detection` เปิด virtual environment แล้วเข้าโฟลเดอร์ backend:

```powershell
.\.venv-web\Scripts\Activate.ps1
Set-Location .\pill-web\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

เมื่อพร้อมแล้วจะเห็นข้อความลักษณะนี้:

```text
Loading model: best_1024.pt
Loading model: best_960.pt
Warming up model: best_1024.pt at imgsz=1024
Warming up model: best_960.pt at imgsz=960
All 2 models are loaded and ready.
Uvicorn running on http://0.0.0.0:8000
```

backend จะยังไม่รับ request จนกว่าโมเดลทั้งสองจะโหลดและ warm-up เสร็จ ทำให้เมื่อเลือกโมเดลบนหน้าเว็บไม่ต้องรอโหลด checkpoint เพิ่ม

ตรวจสอบสถานะได้ที่:

- API health: http://localhost:8000/api/health
- API documentation: http://localhost:8000/docs

### 2. เปิด frontend

หลังเห็น `All 2 models are loaded and ready.` ให้เปิด PowerShell อีกหน้าต่าง แล้วรันจาก workspace root:

```powershell
Set-Location .\pill-web\frontend
npm run dev
```

หาก PowerShell บล็อกไฟล์ `npm.ps1` ให้ใช้ `npm.cmd run dev` แทน

จากนั้นเปิดเว็บ:

```text
http://localhost:5173
```

### 3. ปิดระบบ

กด `Ctrl+C` ใน terminal ของ frontend และ backend ทั้งสองหน้าต่าง

## วิธีใช้งานหน้าเว็บ

1. เปิด `http://localhost:5173`
2. ลากภาพลงในพื้นที่อัปโหลด หรือคลิกเพื่อเลือกไฟล์
3. เลือกโมเดล:
   - **Best 1024** — ใช้ input size 1024
   - **Best 960** — ใช้ input size 960
   - **เปรียบเทียบทั้งสองโมเดล** — รันทั้งสองโมเดลต่อเนื่อง
4. ปรับค่าการตรวจจับหากจำเป็น:
   - **Confidence** — ค่าต่ำตรวจพบมากขึ้น แต่อาจมี false positive เพิ่มขึ้น
   - **IoU** — ควบคุมการรวมกล่องที่ทับซ้อนกัน
   - **จำนวนสูงสุด** — จำกัดจำนวน detection ต่อภาพ
5. กด **เริ่มตรวจจับ**
6. ตรวจผลลัพธ์ จำนวนวัตถุ และเวลา inference
7. ดาวน์โหลดภาพที่ตีกรอบแล้วหรือไฟล์ CSV ได้จากหน้าผลลัพธ์

ค่าเริ่มต้นที่แนะนำ:

```text
Confidence: 0.25
IoU:        0.70
Max det:    500
```

## ติดตั้งบนเครื่องใหม่

รันคำสั่งจาก workspace root

### Backend

```powershell
python -m venv .venv-web
.\.venv-web\Scripts\python.exe -m pip install --upgrade pip
.\.venv-web\Scripts\python.exe -m pip install -r .\pill-web\backend\requirements.txt
```

### Frontend

```powershell
Set-Location .\pill-web\frontend
npm install
```

จากนั้นกลับไป workspace root และเปิดบริการตามหัวข้อ “เริ่มใช้งานใน workspace นี้”

## คำสั่งลัด (ทางเลือก)

ไฟล์ `.ps1` เป็นเพียง wrapper ของคำสั่งด้านบน หากต้องการใช้คำสั่งลัดสามารถเปิดจาก workspace root ได้ดังนี้:

```powershell
# Terminal 1
.\pill-web\backend\run_backend.ps1

# Terminal 2
.\pill-web\frontend\run_frontend.ps1
```

สำหรับการพัฒนา แนะนำให้ใช้ `python -m uvicorn ... --reload` และ `npm run dev` โดยตรง เพราะเห็นคำสั่งและแก้ option ได้ชัดเจนกว่า

## Environment configuration

### Backend

คัดลอก `backend/.env.example` เป็น `backend/.env` เมื่อต้องเปลี่ยนค่า:

```dotenv
PILL_MODEL_DIR=C:\Learn\steel_surface_detection\pill-model
PILL_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

| ตัวแปร | ความหมาย |
|---|---|
| `PILL_MODEL_DIR` | โฟลเดอร์ที่เก็บไฟล์ `.pt` |
| `PILL_CORS_ORIGINS` | Frontend origins ที่ backend อนุญาตให้เรียก API |

### Frontend

ระหว่าง development ไม่ต้องสร้าง `.env` เพราะ Vite proxy จะส่ง `/api` ไป `http://127.0.0.1:8000` ให้อัตโนมัติ

สำหรับ production ให้สร้าง `frontend/.env.production`:

```dotenv
VITE_API_BASE_URL=https://your-api.example.com
```

## API endpoints

| Method | Endpoint | การใช้งาน |
|---|---|---|
| `GET` | `/api/health` | ตรวจสถานะ backend และจำนวนโมเดล |
| `GET` | `/api/models` | อ่านรายการโมเดลที่พร้อมใช้งาน |
| `POST` | `/api/predict` | อัปโหลดภาพเพื่อรัน inference |
| `GET` | `/docs` | Swagger UI สำหรับทดลอง API |

ฟิลด์ของ `POST /api/predict`:

| ฟิลด์ | ชนิด | ตัวอย่าง |
|---|---|---|
| `file` | Image file | `sample.jpg` |
| `model` | String | `best_1024.pt`, `best_960.pt` หรือ `__compare__` |
| `confidence` | Float | `0.25` |
| `iou` | Float | `0.70` |
| `max_det` | Integer | `500` |

ตัวอย่างเรียก API ด้วย Python:

```python
import requests

with open("sample.jpg", "rb") as image_file:
    response = requests.post(
        "http://localhost:8000/api/predict",
        files={"file": ("sample.jpg", image_file, "image/jpeg")},
        data={
            "model": "best_1024.pt",
            "confidence": 0.25,
            "iou": 0.70,
            "max_det": 500,
        },
        timeout=300,
    )

response.raise_for_status()
print(response.json())
```

## การแก้ไขระบบ

- แก้ UI หรือ layout: `frontend/src/components/` และ `frontend/src/styles.css`
- แก้ URL หรือรูปแบบเรียก API: `frontend/src/services/api.ts`
- เพิ่มหรือเปลี่ยนโมเดล: `backend/app/config.py`
- แก้ขั้นตอน inference: `backend/app/services/inference.py`
- เพิ่ม endpoint: `backend/app/routers/`
- แก้ request/response schema: `backend/app/schemas.py`

หลังแก้ frontend ให้ตรวจ production build:

```powershell
Set-Location .\pill-web\frontend
npm.cmd run build
```

ไฟล์ที่ build แล้วจะอยู่ใน `frontend/dist`

## Troubleshooting

### หน้าเว็บแสดง “ระบบยังไม่พร้อม”

- ตรวจว่า backend เปิดอยู่ที่ port 8000
- เปิด http://localhost:8000/api/health
- ตรวจว่า `frontend/vite.config.ts` proxy ไปที่ backend ถูกต้อง

### Backend แจ้งว่าไม่พบโมเดล

- ตรวจว่าไฟล์ `.pt` อยู่ใน `pill-model`
- ตรวจค่า `PILL_MODEL_DIR` ใน `backend/.env`
- ชื่อโมเดลต้องตรงกับที่กำหนดใน `backend/app/config.py`

### Browser แจ้ง CORS error

- เพิ่ม URL ของ frontend ใน `PILL_CORS_ORIGINS`
- ปิดและเปิด backend ใหม่หลังแก้ `.env`

### Port ถูกใช้งานอยู่

ตรวจ process ที่ใช้ port:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173,8000
```

ปิดบริการเดิมด้วย `Ctrl+C` หรือเปลี่ยน port ใน `vite.config.ts` และคำสั่ง `uvicorn`

### Backend ใช้เวลาสักครู่ก่อนเปิด port 8000

เป็นพฤติกรรมปกติ เพราะ backend preload และ warm-up โมเดลทั้งสองก่อนประกาศว่าระบบพร้อม รอจนเห็น `All 2 models are loaded and ready.` และ `Application startup complete.` ก่อนเปิด frontend

### Vite แสดง `ECONNREFUSED 127.0.0.1:8000`

- backend ยังไม่เปิด, ยัง warm-up ไม่เสร็จ หรือ startup ล้มเหลว
- ตรวจ terminal backend และแก้ error ก่อน
- ตรวจว่าใช้ `.venv-web` ไม่ใช่ `.venv`
- ตรวจ dependency ด้วย `.\.venv-web\Scripts\python.exe -m pip show python-multipart`
- frontend จะลองเชื่อมต่อใหม่อัตโนมัติระหว่างที่ backend กำลังเริ่มทำงาน

### ต้องการตรวจว่า PyTorch พบ GPU หรือไม่

```powershell
.\.venv-web\Scripts\python.exe -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

## หมายเหตุด้านข้อมูล

- ระบบไม่บันทึกภาพที่อัปโหลดลง disk โดยอัตโนมัติ
- ภาพจะถูกอ่านเข้าสู่หน่วยความจำเพื่อ inference และส่งผลลัพธ์กลับเป็น response
- ไม่ควรใช้ผลตรวจจับนี้แทนการตรวจสอบทางการแพทย์หรือการยืนยันชนิดยาโดยผู้เชี่ยวชาญ
