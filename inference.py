from ultralytics import YOLO
import json

MODEL_PATH = "pill-model/best_1024.pt"

IMAGE_PATH = "test.jpg"

model = YOLO(MODEL_PATH)

results = model.predict(
    source=IMAGE_PATH,  #
    imgsz=960,  
    conf=0.25,  
    max_det=500,  
    verbose=False,  
)

# ดึงผลลัพธ์ของรูปแรกออกมา (เนื่องจากส่งไปรูปเดียว results จึงมี index 0)
result = results[0]

detections = []

# วนลูปอ่านข้อมูลของแต่ละ Bounding Box ที่โมเดลตรวจจับได้
for box in result.boxes:
    # ดึงค่าความมั่นใจ (Confidence score) แปลงจาก PyTorch Tensor เป็น float
    confidence = float(box.conf[0])

    # ดึงพิกัดกล่องแบบพิกเซล [x1, y1, x2, y2]
    # .cpu() คือย้ายข้อมูลจาก GPU มา CPU และ .tolist() คือแปลง Tensor เป็น Python list
    # (หมายเหตุ: ในโค้ดต้นฉบับต้องมีวงเล็บหลัง cpu -> .cpu().tolist())
    x1, y1, x2, y2 = box.xyxy[0].cpu().tolist()

    # บันทึกข้อมูลของแต่ละเม็ดยาลงในลิสต์
    detections.append(
        {
            "class_name": "pill",
            "confidence": round(confidence, 4),  # ปัดเศษทศนิยม 4 ตำแหน่ง
            "bbox": {
                "x1": round(x1, 2),  # พิกัดมุมซ้ายบนแกน X
                "y1": round(y1, 2),  # พิกัดมุมซ้ายบนแกน Y
                "x2": round(x2, 2),  # พิกัดมุมขวาล่างแกน X
                "y2": round(y2, 2),  # พิกัดมุมขวาล่างแกน Y
            },
        }
    )

# 1. แสดงจำนวนรวม
print(f"\nตรวจพบเม็ดยาทั้งหมด: {len(detections)} เม็ด")

# 2. จัดรูปแบบ JSON ให้อ่านง่าย (ดูเฉพาะ 3 เม็ดแรกเป็นตัวอย่าง)
print("\nตัวอย่างข้อมูล 3 เม็ดแรก:")
print(json.dumps(detections[:3], indent=2))

# 3. บันทึกรูปภาพที่วาดกรอบสี่เหลี่ยมลงเครื่องเพื่อเปิดตรวจด้วยตา
result.save("result_detected.jpg")
print("\nบันทึกภาพผลลัพธ์พร้อมตีกรอบไว้ที่: result_detected.jpg")