from collections import deque
import base64
import threading
import time

import cv2
import numpy as np
from flask import Flask, jsonify, request
from ultralytics import YOLO

app = Flask(__name__)

model = YOLO("yolov8n.pt")

FREEZE_TIMEOUT_SEC = 5.0
BROWSER_COUNT_WINDOW = 5

PROFILES = {
    "default": {
        "conf": 0.35,
        "iou": 0.45,
        "max_distance_px": 60,
        "track_ttl_sec": 1.8,
        "min_hits_to_confirm": 2,
        "min_box_area": 700,
    },
    # Camera mounted at teacher side/front center facing students.
    "front_center": {
        "conf": 0.35,
        "iou": 0.45,
        "max_distance_px": 80,
        "track_ttl_sec": 2.4,
        "min_hits_to_confirm": 2,
        "min_box_area": 600,
    },
}

runtime_cfg = dict(PROFILES["front_center"])
runtime_profile = "front_center"

state_lock = threading.Lock()
worker_thread = None
stop_event = threading.Event()

state = {
    "running": False,
    "error": None,
    "count": 0,
    "instant_count": 0,
    "fps": 0.0,
    "source": None,
    "started_at": None,
    "profile": runtime_profile,
}

tracks = {}
next_track_id = 0
browser_count_history = deque(maxlen=BROWSER_COUNT_WINDOW)


def _set_state(**updates):
    with state_lock:
        state.update(updates)


def _get_state_snapshot():
    with state_lock:
        return dict(state)


def _parse_source(url_or_index):
    if url_or_index is None:
        return None
    text = str(url_or_index).strip()
    if text == "":
        return None
    if text.isdigit():
        return int(text)
    return text


def _decode_image(data_url):
    if not data_url:
        return None

    payload = str(data_url)
    if "," in payload:
        payload = payload.split(",", 1)[1]

    try:
        raw = base64.b64decode(payload)
    except Exception:
        return None

    frame = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    return frame


def _centroid(box):
    x1, y1, x2, y2 = box
    return np.array([(x1 + x2) / 2.0, (y1 + y2) / 2.0], dtype=np.float32)


def _frame_signature(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (32, 18), interpolation=cv2.INTER_AREA)
    return small


def _reset_tracking_state():
    global tracks, next_track_id
    tracks = {}
    next_track_id = 0


def _reset_browser_state():
    browser_count_history.clear()


def _associate_detections(detections, now_ts):
    global tracks, next_track_id

    if not detections:
        return

    unmatched_track_ids = set(tracks.keys())

    for det in detections:
        c = _centroid(det)
        best_id = None
        best_dist = None

        for tid in list(unmatched_track_ids):
            dist = float(np.linalg.norm(c - tracks[tid]["centroid"]))
            if dist <= runtime_cfg["max_distance_px"] and (best_dist is None or dist < best_dist):
                best_dist = dist
                best_id = tid

        if best_id is not None:
            track = tracks[best_id]
            track["centroid"] = c
            track["last_seen"] = now_ts
            track["hits"] += 1
            unmatched_track_ids.remove(best_id)
        else:
            tracks[next_track_id] = {
                "centroid": c,
                "last_seen": now_ts,
                "hits": 1,
            }
            next_track_id += 1


def _prune_tracks(now_ts):
    expired = []
    for tid, track in tracks.items():
        if now_ts - track["last_seen"] > runtime_cfg["track_ttl_sec"]:
            expired.append(tid)
    for tid in expired:
        del tracks[tid]


def _compute_counts():
    instant_count = len(tracks)
    confirmed_count = sum(
        1 for t in tracks.values() if t["hits"] >= runtime_cfg["min_hits_to_confirm"]
    )
    return instant_count, confirmed_count


def _compute_browser_count(instant_count):
    browser_count_history.append(int(instant_count))
    window = sorted(browser_count_history)
    midpoint = len(window) // 2
    if len(window) % 2 == 1:
        return int(window[midpoint])
    return int(round((window[midpoint - 1] + window[midpoint]) / 2.0))


def _detect_people(frame):
    frame = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)

    results = model(
        frame,
        conf=runtime_cfg["conf"],
        iou=runtime_cfg["iou"],
        classes=[0],
        verbose=False,
    )

    detections = []
    for r in results:
        if r.boxes is None:
            continue
        boxes = r.boxes.xyxy.cpu().numpy()
        for box in boxes:
            x1, y1, x2, y2 = box
            area = max(0.0, (x2 - x1) * (y2 - y1))
            if area >= runtime_cfg["min_box_area"]:
                detections.append(box.astype(np.int32))

    return frame, detections


def _apply_profile(profile_name):
    global runtime_cfg, runtime_profile

    name = (profile_name or "front_center").strip().lower().replace("-", "_")
    if name not in PROFILES:
        name = "front_center"

    runtime_cfg = dict(PROFILES[name])
    runtime_profile = name


def process_stream(source):
    _reset_tracking_state()
    stop_event.clear()

    cap = cv2.VideoCapture(source)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        _set_state(
            running=False,
            error="Unable to open camera stream.",
            count=0,
            instant_count=0,
            fps=0.0,
        )
        return

    _set_state(error=None)

    last_sig = None
    last_change_ts = time.time()

    frame_window = deque(maxlen=20)
    count_window = deque(maxlen=5)

    try:
        while not stop_event.is_set():
            t0 = time.time()
            ok, frame = cap.read()
            if not ok or frame is None:
                _set_state(error="Camera disconnected or stream unavailable.")
                break

            sig = _frame_signature(frame)
            if last_sig is not None:
                delta = float(np.mean(cv2.absdiff(sig, last_sig)))
                if delta < 1.0:
                    if time.time() - last_change_ts > FREEZE_TIMEOUT_SEC:
                        _set_state(error="Camera stream appears frozen.")
                        break
                else:
                    last_change_ts = time.time()
            else:
                last_change_ts = time.time()
            last_sig = sig

            frame, detections = _detect_people(frame)

            now_ts = time.time()
            _associate_detections(detections, now_ts)
            _prune_tracks(now_ts)
            instant_count, confirmed_count = _compute_counts()

            count_window.append(confirmed_count)
            stable_count = int(round(sum(count_window) / len(count_window))) if count_window else 0

            frame_time = max(time.time() - t0, 1e-6)
            frame_window.append(1.0 / frame_time)
            avg_fps = float(sum(frame_window) / len(frame_window)) if frame_window else 0.0

            _set_state(
                count=stable_count,
                instant_count=instant_count,
                fps=round(avg_fps, 2),
                error=None,
            )
    finally:
        cap.release()
        _set_state(running=False)


@app.route("/health", methods=["GET"])
def health():
    snapshot = _get_state_snapshot()
    return jsonify({
        "ok": True,
        "model": "yolov8n.pt",
        "running": snapshot["running"],
    })


@app.route("/start", methods=["POST"])
def start():
    global worker_thread

    payload = request.json or {}
    source = payload.get("source", "device_camera")
    profile = payload.get("profile", "front_center")
    source_type = payload.get("sourceType", "stream")

    snapshot = _get_state_snapshot()
    if snapshot["running"]:
        return jsonify({"message": "Already running"}), 200

    _apply_profile(profile)
    _reset_browser_state()

    _set_state(
        running=True,
        error=None,
        count=0,
        instant_count=0,
        fps=0.0,
        source=str(source),
        started_at=int(time.time()),
        profile=runtime_profile,
    )

    if source_type == "browser":
        return jsonify({
            "message": "AI counting started",
            "source": str(source),
            "profile": runtime_profile,
            "mode": "browser",
        })

    worker_thread = threading.Thread(target=process_stream, args=(source,), daemon=True)
    worker_thread.start()

    return jsonify({
        "message": "AI counting started",
        "source": str(source),
        "profile": runtime_profile,
        "mode": "stream",
    })


@app.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    payload = request.json or {}
    profile = payload.get("profile", "front_center")
    source = payload.get("source", "device_camera")
    image = payload.get("image")

    frame = _decode_image(image)
    if frame is None:
        _set_state(running=False, error="Invalid camera frame.")
        return jsonify({"error": "Invalid camera frame"}), 400

    _apply_profile(profile)
    if not browser_count_history:
        _reset_browser_state()
    started_at = int(time.time())
    _set_state(
        running=True,
        error=None,
        source=str(source),
        started_at=started_at,
        profile=runtime_profile,
    )

    t0 = time.time()
    _, detections = _detect_people(frame)
    instant_count = len(detections)
    count = _compute_browser_count(instant_count)
    frame_time = max(time.time() - t0, 1e-6)
    fps = round(1.0 / frame_time, 2)

    _set_state(
        running=True,
        error=None,
        count=count,
        instant_count=instant_count,
        fps=fps,
        source=str(source),
        profile=runtime_profile,
    )

    return jsonify(_get_state_snapshot())


@app.route("/count", methods=["GET"])
def count():
    snapshot = _get_state_snapshot()
    return jsonify(snapshot)


@app.route("/stop", methods=["POST"])
def stop():
    stop_event.set()
    _reset_browser_state()
    _set_state(running=False)
    return jsonify({"message": "AI stopped"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000)
