from ultralytics import YOLO

model = YOLO("yolo26s.pt")

model.train(
    data="/watcharapong/pill_dataset/pill-dataset/data.yaml",
    epochs=200,
    imgsz=960,
    batch=8,
    patience=30,
    max_det=500,
    project="runs/detect",
    name="pill_yolo26s_960",
)
