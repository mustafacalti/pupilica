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
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from datetime import datetime

# Flask app setup
app = Flask(__name__)
CORS(app)  # React uygulamasından gelen isteklere izin ver

# Global değişkenler
current_emotion_data = {
    "emotion": "neutral",
    "confidence": 0.0,
    "timestamp": datetime.now().isoformat(),
    "lookingAtScreen": False,
    "faceDetected": False
}

camera_active = False
cap = None

# AI Model setup
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🤖 Using device: {device}")

try:
    model_name = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_name).to(device)
    processor = CLIPProcessor.from_pretrained(model_name)
    print("✅ CLIP model loaded successfully")
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    model = None
    processor = None

# Emotion definitions for children
emotion_labels_dict = {
    "happy": "a child with a wide smile and bright eyes, looking happy",
    "sad": "a child with teary eyes and a downturned mouth, looking sad",
    "confused": "a child tilting their head slightly, with eyebrows raised unevenly, looking confused",
    "focused": "a child with concentrated expression, focused eyes, paying attention",
    "surprised": "a child with wide open eyes and mouth, showing surprise",
    "frustrated": "a child with tightly pressed lips and furrowed eyebrows, showing frustration",
    "neutral": "a child with relaxed facial muscles and a calm expression, looking neutral",
    "tired": "a child with drooping eyelids, yawning or looking sleepy"
}

emotion_prompts = list(emotion_labels_dict.values())
emotion_names = list(emotion_labels_dict.keys())

# MediaPipe setup for gaze detection
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

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
            text=emotion_prompts,
            images=pil_image,
            return_tensors="pt",
            padding=True
        ).to(device)

        with torch.no_grad():
            outputs = model(**inputs)

        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)

        best_prob, best_idx = torch.max(probs, 1)
        predicted_emotion = emotion_names[best_idx.item()]
        confidence = best_prob.item()

        # Gaze detection
        looking_at_screen = detect_gaze(frame)

        # Global data güncelle
        current_emotion_data = {
            "emotion": predicted_emotion,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat(),
            "lookingAtScreen": looking_at_screen,
            "faceDetected": True
        }

        print(f"😊 [EMOTION] {predicted_emotion} ({confidence:.1%}) - Looking: {looking_at_screen}")

    except Exception as e:
        print(f"❌ [EMOTION] Analysis error: {e}")
        current_emotion_data["faceDetected"] = False

def detect_gaze(frame):
    """Gaze direction detection"""
    try:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return False

        h, w, _ = frame.shape

        for face_landmarks in results.multi_face_landmarks:
            # Iris landmarks
            left_iris = [468, 469, 470, 471]
            right_iris = [473, 474, 475, 476]

            # Iris center coordinates
            lx = int(sum([face_landmarks.landmark[i].x for i in left_iris]) / len(left_iris) * w)
            rx = int(sum([face_landmarks.landmark[i].x for i in right_iris]) / len(right_iris) * w)

            gaze_x = (lx + rx) // 2

            # Ekran merkezine bakıyor mu?
            if w * 0.35 < gaze_x < w * 0.65:  # %35-65 arası ekran merkezi
                return True
            else:
                return False

    except Exception as e:
        print(f"❌ [GAZE] Detection error: {e}")
        return False

    return False

def camera_loop():
    """Kamera loop'u - ayrı thread'de çalışır"""
    global cap, camera_active, current_emotion_data

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

# API Endpoints

@app.route('/health', methods=['GET'])
def health_check():
    """Server sağlık kontrolü"""
    return jsonify({
        "status": "healthy",
        "camera_active": camera_active,
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/start_camera', methods=['POST'])
def start_camera():
    """Kamera ve emotion detection başlat"""
    global camera_active

    if camera_active:
        return jsonify({"error": "Camera already active"}), 400

    try:
        # Kamera thread'ini başlat
        camera_thread = threading.Thread(target=camera_loop)
        camera_thread.daemon = True
        camera_thread.start()

        return jsonify({
            "success": True,
            "message": "Camera started successfully"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    """Kamera ve emotion detection durdur"""
    global camera_active

    camera_active = False

    return jsonify({
        "success": True,
        "message": "Camera stopped"
    })

@app.route('/emotion_data', methods=['GET'])
def get_emotion_data():
    """Güncel emotion data döndür"""
    return jsonify(current_emotion_data)

@app.route('/emotion_stream', methods=['GET'])
def emotion_stream():
    """SSE stream için emotion data"""
    def generate():
        while camera_active:
            yield f"data: {json.dumps(current_emotion_data)}\n\n"
            time.sleep(1)  # 1 saniyede bir güncelle

    return app.response_class(generate(), mimetype='text/plain')

if __name__ == '__main__':
    print("🚀 Emotion Detection Server başlatılıyor...")
    print("📡 Port: 5000")
    print("🌐 CORS enabled for React app")
    print("📹 Camera endpoint: POST /start_camera")
    print("😊 Emotion endpoint: GET /emotion_data")
    print("🏥 Health check: GET /health")

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)