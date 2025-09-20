#!/usr/bin/env python3
"""
Gerçek zamanlı emotion detection server
Web uygulaması ile iletişim kurar
"""

import cv2
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import mediapipe as mp
import time
import json
import threading
from threading import Lock
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from datetime import datetime

# Flask app setup
app = Flask(__name__)
CORS(app)  # React uygulamasından gelen isteklere izin ver

# ----- Global durum -----
state_lock = Lock()  # paylaşılan state için kilit

current_emotion_data = {
    "emotion": "neutral",
    "confidence": 0.0,
    "timestamp": datetime.now().isoformat(),
    "lookingAtScreen": False,
    "faceDetected": False
}

camera_active = False
cap = None

# ----- AI Model setup -----
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🤖 Using device: {device}")

try:
    model_name = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_name).to(device)
    model.eval()  # eval moduna al
    processor = CLIPProcessor.from_pretrained(model_name)
    print("✅ CLIP model loaded successfully")
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    model = None
    processor = None
emotion_prompt_bank = {
    "happy": [
        "a photo of a happy child",
        "a kid smiling with bright eyes",
        "a child's face showing joy",
        "a cheerful child"
    ],
    "sad": [
        # sad'i daha 'bariz' hale getir
        "a photo of a sad child with tears",
        "a kid crying with teary eyes and a downturned mouth",
        "a child's face showing visible sadness and tears",
        "a gloomy child with watery eyes"
    ],
    "neutral": [
        # nötrü güçlendir
        "a photo of a neutral child",
        "a kid with a relaxed, calm face",
        "a child's face showing no strong emotion",
        "an expressionless child with relaxed muscles",
        "a calm portrait of a child with no smile and no frown"
    ],
    "surprised": [
        "a photo of a surprised child",
        "a kid with wide open eyes and mouth",
        "a child's face showing surprise",
        "astonished child"
    ],
    "frustrated": [
        "a photo of an angry child",
        "a frustrated kid with furrowed brows",
        "a child's face showing anger",
        "irritated child"
    ],
    "confused": [
        "a photo of a confused child",
        "a kid tilting head with uneven eyebrows",
        "a child's face showing confusion",
        "puzzled child"
    ],
    "tired": [
        "a photo of a tired child",
        "a sleepy kid with drooping eyelids",
        "a child's face showing fatigue",
        "yawning child"
    ],
    "focused": [
        "a photo of a focused child",
        "a kid concentrating, attentive face",
        "a child's face showing focus",
        "an engaged child paying attention"
    ],
    "no_person": [
        "a photo without any person",
        "an object only, no human face",
        "a landscape with no people"
    ]
}

# Bütün promptları düz listeye açıyoruz
all_texts = []
class_slices = {}
for cls, prompts in emotion_prompt_bank.items():
    start = len(all_texts)
    all_texts.extend(prompts)
    end = len(all_texts)
    class_slices[cls] = (start, end)

# ----- MediaPipe setup for gaze detection -----
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def detect_gaze(frame):
    """Gaze direction detection -> (lookingAtScreen: bool, faceDetected: bool)"""
    try:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return False, False  # yüz yok

        h, w, _ = frame.shape

        for face_landmarks in results.multi_face_landmarks:
            # Iris landmarks
            left_iris = [468, 469, 470, 471]
            right_iris = [473, 474, 475, 476]

            # Iris center coordinates
            lx = int(sum(face_landmarks.landmark[i].x for i in left_iris) / len(left_iris) * w)
            rx = int(sum(face_landmarks.landmark[i].x for i in right_iris) / len(right_iris) * w)

            gaze_x = (lx + rx) // 2

            # Ekran merkezine bakıyor mu? (%35-65 arası)
            looking = (w * 0.35 < gaze_x < w * 0.65)
            return looking, True

    except Exception as e:
        print(f"❌ [GAZE] Detection error: {e}")
        return False, False

    return False, False

def analyze_emotion(frame):
    """Tek frame'de emotion analysis yap"""
    global current_emotion_data

    if model is None or processor is None:
        return

    try:
        # PIL image'a çevir
        pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        # CLIP ile emotion detection
        inputs = processor(
            text=all_texts,
            images=pil_image,
            return_tensors="pt",
            padding=True
        ).to(device)

        with torch.no_grad():
            outputs = model(**inputs)

        logits = outputs.logits_per_image[0]  # shape: [num_prompts]

        # Her sınıf için ortalama logit
        class_logits = []
        class_names = []
        for cls, (start, end) in class_slices.items():
            class_names.append(cls)
            class_logits.append(logits[start:end].mean())

        class_logits = torch.stack(class_logits)
        probs = torch.softmax(class_logits, dim=0)

        # En yüksek olasılığı seç
        best_idx = int(torch.argmax(probs).item())
        predicted_emotion = class_names[best_idx]
        confidence = float(probs[best_idx].item())

        # "no_person" varsa yüz tespiti için filtre
        if "no_person" in class_names:
            no_person_idx = class_names.index("no_person")
            if probs[no_person_idx] > 0.35:  # eşik: deneyerek ayarlayın
                predicted_emotion = "neutral"
                face_detected = False
            else:
                looking_at_screen, face_detected = detect_gaze(frame)
        else:
            looking_at_screen, face_detected = detect_gaze(frame)

        # Global data güncelle
        with state_lock:
            current_emotion_data = {
                "emotion": predicted_emotion,
                "confidence": confidence,
                "timestamp": datetime.now().isoformat(),
                "lookingAtScreen": looking_at_screen,
                "faceDetected": face_detected
            }

        print(f"😊 [EMOTION] {predicted_emotion} ({confidence:.1%}) - "
              f"Looking: {looking_at_screen} - Face: {face_detected}")

    except Exception as e:
        print(f"❌ [EMOTION] Analysis error: {e}")
        with state_lock:
            current_emotion_data["faceDetected"] = False

def camera_loop():
    """Kamera loop'u - ayrı thread'de çalışır"""
    global cap, camera_active

    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ [CAMERA] Webcam açılamadı")
            return

        print("📹 [CAMERA] Webcam başlatıldı")
        camera_active = True

        last_analysis_time = 0
        analysis_interval = 3.0  # 3 saniyede bir analiz

        while camera_active:
            ret, frame = cap.read()
            if not ret:
                break

            current_time = time.time()

            # 3 saniyede bir emotion analysis
            if current_time - last_analysis_time >= analysis_interval:
                analyze_emotion(frame)
                last_analysis_time = current_time

            time.sleep(0.1)  # CPU kullanımını azalt

    except Exception as e:
        print(f"❌ [CAMERA] Loop error: {e}")
    finally:
        if cap:
            cap.release()
        camera_active = False
        print("📹 [CAMERA] Kapatıldı")

# ----- API Endpoints -----

@app.route('/health', methods=['GET'])
def health_check():
    with state_lock:
        model_loaded = (model is not None)
    return jsonify({
        "status": "healthy",
        "camera_active": camera_active,
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/start_camera', methods=['POST'])
def start_camera():
    global camera_active

    if camera_active:
        return jsonify({"error": "Camera already active"}), 400

    try:
        camera_thread = threading.Thread(target=camera_loop, name="camera_loop_thread", daemon=True)
        camera_thread.start()

        return jsonify({"success": True, "message": "Camera started successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global camera_active
    camera_active = False
    return jsonify({"success": True, "message": "Camera stopped"})

@app.route('/emotion_data', methods=['GET'])
def get_emotion_data():
    with state_lock:
        data = dict(current_emotion_data)
    return jsonify(data)

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame_endpoint():
    try:
        data = request.json or {}
        frame_base64 = data.get('frame')

        if not frame_base64:
            return jsonify({"error": "Frame data bulunamadı"}), 400

        # Base64 decode
        import base64
        frame_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Frame decode edilemedi"}), 400

        analyze_emotion(frame)

        with state_lock:
            resp = dict(current_emotion_data)
        return jsonify(resp)

    except Exception as e:
        print(f"❌ [ANALYZE FRAME] Hata: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/emotion_stream', methods=['GET'])
def emotion_stream():
    def generate():
        while camera_active:
            with state_lock:
                payload = json.dumps(current_emotion_data)
            yield f"data: {payload}\n\n"
            time.sleep(1)
    return app.response_class(generate(), mimetype='text/plain')

if __name__ == '__main__':
    try:
        import numpy, mediapipe, cv2 as _cv2
        print(f"[VERSIONS] numpy: {numpy.__version__} | opencv: {_cv2.__version__} | mediapipe: {mediapipe.__version__}")
    except Exception:
        pass

    print("🚀 Emotion Detection Server başlatılıyor...")
    print("📡 Port: 5000")
    print("🌐 CORS enabled for React app")
    print("📹 Camera endpoint: POST /start_camera")
    print("😊 Emotion endpoint: GET /emotion_data")
    print("🏥 Health check: GET /health")

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
