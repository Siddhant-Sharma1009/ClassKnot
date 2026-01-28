from flask import Flask, request, jsonify
import cv2
import threading
import time
import numpy as np
from ultralytics import YOLO
import hashlib

app = Flask(__name__)

model = YOLO("yolov8n.pt")

latest_count = 0
is_running = False
camera_error = None

tracked_ids = {}
next_id = 0

MAX_DISTANCE = 50
FREEZE_TIMEOUT = 5   # seconds without frame change

def centroid(box):
    x1, y1, x2, y2 = box
    return ((x1 + x2) // 2, (y1 + y2) // 2)

def frame_hash(frame):
    return hashlib.md5(frame.tobytes()).hexdigest()

def process_stream(video_url):
    global latest_count, is_running, tracked_ids, next_id, camera_error

    cap = cv2.VideoCapture(0 if video_url == "0" else video_url)

    if not cap.isOpened():
        camera_error = "Unable to open camera. Please open IP camera."
        is_running = False
        return

    tracked_ids = {}
    next_id = 0
    camera_error = None

    last_hash = None
    last_change_time = time.time()

    while is_running:
        ret, frame = cap.read()

        if not ret or frame is None:
            camera_error = "Camera disconnected. Please open IP camera."
            break

        frame = cv2.resize(frame, (640, 480))

        # 🔴 FREEZE DETECTION (KEY FIX)
        current_hash = frame_hash(frame)
        if last_hash == current_hash:
            if time.time() - last_change_time > FREEZE_TIMEOUT:
                camera_error = "Camera stream frozen. Please open IP camera."
                break
        else:
            last_hash = current_hash
            last_change_time = time.time()

        results = model(frame, conf=0.5, classes=[0], verbose=False)

        detections = []
        for r in results:
            for box in r.boxes.xyxy.cpu().numpy():
                detections.append(box.astype(int))

        new_tracked = {}

        for box in detections:
            c = centroid(box)
            matched = False

            for tid, prev_c in tracked_ids.items():
                dist = np.linalg.norm(np.array(c) - np.array(prev_c))
                if dist < MAX_DISTANCE:
                    new_tracked[tid] = c
                    matched = True
                    break

            if not matched:
                new_tracked[next_id] = c
                next_id += 1

        tracked_ids = new_tracked
        latest_count = len(tracked_ids)

        time.sleep(1)

    cap.release()
    is_running = False

@app.route("/start", methods=["POST"])
def start():
    global is_running, camera_error

    url = request.json.get("url")
    if not url:
        return jsonify({"error": "Camera URL required"}), 400

    if is_running:
        return jsonify({"message": "Already running"}), 200

    camera_error = None
    is_running = True

    thread = threading.Thread(target=process_stream, args=(url,))
    thread.daemon = True
    thread.start()

    return jsonify({"message": "AI counting started"})

@app.route("/count", methods=["GET"])
def count():
    return jsonify({
        "count": latest_count,
        "running": is_running,
        "error": camera_error
    })

@app.route("/stop", methods=["POST"])
def stop():
    global is_running
    is_running = False
    return jsonify({"message": "AI stopped"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000)
