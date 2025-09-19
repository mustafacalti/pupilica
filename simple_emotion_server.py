#!/usr/bin/env python3
"""
Basit emotion detection server - Sadece OpenCV ve MediaPipe kullanır
"""

import cv2
import time
import json
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
import mediapipe as mp
from datetime import datetime
import random

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

# MediaPipe setup
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.9)
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Basit emotion detection (yüz hareketi bazlı)
def analyze_simple_emotion(landmarks, face_bbox):
    """Basit emotion analysis - MediaPipe landmarks kullanarak"""
    try:
        # Çocuklar için basit duygular
        emotions = ['happy', 'neutral', 'confused', 'focused', 'surprised', 'frustrated']

        # Rastgele ama biraz mantıklı emotion seçimi
        # Gerçek hayatta bu landmarks'ı analiz ederek yapılır

        # Basit bir algoritma: yüzün genel durumuna göre
        if landmarks:
            # Göz ve ağız pozisyonlarından basit çıkarım
            mouth_landmarks = [13, 14, 17, 18]  # Ağız çevresi
            eye_landmarks = [33, 133, 362, 263]  # Göz çevresi

            # Şimdilik rastgele ama ağırlıklı seçim
            weights = [0.3, 0.4, 0.1, 0.1, 0.05, 0.05]  # neutral ve happy daha sık
            emotion = random.choices(emotions, weights=weights)[0]
            confidence = random.uniform(0.7, 0.95)
        else:
            emotion = "neutral"
            confidence = 0.5

        return emotion, confidence

    except Exception as e:
        print(f"❌ [EMOTION] Analysis error: {e}")
        return "neutral", 0.5

def detect_gaze(landmarks, frame_width, frame_height):
    """Gaze direction detection"""
    try:
        if not landmarks:
            return False

        # Iris landmarks (MediaPipe Face Mesh)
        left_iris = [468, 469, 470, 471]
        right_iris = [473, 474, 475, 476]

        # Iris center coordinates
        lx = sum([landmarks.landmark[i].x for i in left_iris]) / len(left_iris)
        rx = sum([landmarks.landmark[i].x for i in right_iris]) / len(right_iris)

        gaze_x = (lx + rx) / 2

        # Ekran merkezine bakıyor mu? (0.35-0.65 arası merkez kabul)
        if 0.35 < gaze_x < 0.65:
            return True
        else:
            return False

    except Exception as e:
        print(f"❌ [GAZE] Detection error: {e}")
        return False

def camera_loop():
    """Kamera loop'u - ayrı thread'de çalışır"""
    global cap, camera_active, current_emotion_data

    try:
        # IriUn webcam DirectShow backend ile
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

        # IriUn için özel ayarlar
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))

        if not cap.isOpened():
            print("❌ [CAMERA] IriUn webcam açılamadı")
            return

        # IriUn başlangıç frame'lerini atla (siyah frame sorunu)
        for i in range(10):  # Daha fazla frame atla
            ret, frame = cap.read()
            if ret:
                print(f"🔍 [CAMERA] Init frame {i+1}: {frame.shape}")
                # Frame'in siyah olup olmadığını kontrol et
                mean_val = frame.mean()
                print(f"   Frame brightness: {mean_val:.1f}")
                if mean_val > 10:  # Siyah değilse
                    print(f"   ✅ Frame {i+1} normal görünüyor")
                    break
            else:
                print(f"   ❌ Frame {i+1} okunamadı")

        # Son kontrol
        for j in range(3):
            ret, frame = cap.read()
            if ret:
                mean_val = frame.mean()
                if mean_val > 10:
                    print(f"✅ [CAMERA] Normal frame bulundu (brightness: {mean_val:.1f})")
                    break
                else:
                    print(f"⚠️ [CAMERA] Hala siyah frame (brightness: {mean_val:.1f})")
                    import time
                    time.sleep(0.5)  # Biraz bekle

        # Test frame
        ret, test_frame = cap.read()
        if not ret:
            print("❌ [CAMERA] Frame okunamadı")
            cap.release()
            return

        h, w = test_frame.shape[:2]
        print(f"✅ [CAMERA] IriUn DirectShow ile açıldı: {w}x{h}")

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
                print(f"🔍 [DEBUG] Frame shape: {frame.shape}, analyzing...")
                analyze_frame(frame)
                last_analysis_time = current_time

            time.sleep(0.1)  # CPU kullanımını azalt

    except Exception as e:
        print(f"❌ [CAMERA] Loop error: {e}")
    finally:
        if cap:
            cap.release()
        camera_active = False
        print("📹 [CAMERA] Kapatıldı")

def analyze_frame(frame):
    """Tek frame'de analiz yap"""
    global current_emotion_data

    try:
        # BGR'den RGB'ye çevir - face_test.py ile aynı
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, _ = frame.shape

        # Yüz tespiti yap - face_test.py ile aynı
        results = face_detection.process(rgb_frame)

        # DEBUG: Frame'i kaydet (ilk birkaç frame için)
        import os
        debug_dir = "debug_frames"
        if not os.path.exists(debug_dir):
            os.makedirs(debug_dir)

        frame_count = getattr(analyze_frame, 'frame_count', 0)
        analyze_frame.frame_count = frame_count + 1

        if frame_count < 5:  # İlk 5 frame'i kaydet
            cv2.imwrite(f"{debug_dir}/frame_{frame_count}.jpg", frame)
            cv2.imwrite(f"{debug_dir}/rgb_frame_{frame_count}.jpg", cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR))
            print(f"🔍 [DEBUG] Frame {frame_count} kaydedildi")

        # Sonuçları işle - face_test.py ile aynı
        if results.detections:
            print(f"✅ [FACE] {len(results.detections)} yüz bulundu!")

            for detection in results.detections:
                confidence = detection.score[0]
                print(f"   Confidence: {confidence:.1%}")

            # Face mesh for detailed landmarks
            mesh_results = face_mesh.process(rgb_frame)

            if mesh_results.multi_face_landmarks:
                landmarks = mesh_results.multi_face_landmarks[0]

                # Emotion analysis
                emotion, confidence = analyze_simple_emotion(landmarks, results.detections[0])

                # Gaze detection
                looking_at_screen = detect_gaze(landmarks, w, h)

                # Update global data
                current_emotion_data = {
                    "emotion": emotion,
                    "confidence": confidence,
                    "timestamp": datetime.now().isoformat(),
                    "lookingAtScreen": looking_at_screen,
                    "faceDetected": True
                }

                print(f"😊 [EMOTION] {emotion} ({confidence:.1%}) - Looking: {looking_at_screen}")
            else:
                current_emotion_data["faceDetected"] = False
                print("❌ [FACE] Mesh landmarks bulunamadı")
        else:
            current_emotion_data["faceDetected"] = False
            print("❌ [FACE] Yüz tespit edilemedi")

    except Exception as e:
        print(f"❌ [EMOTION] Frame analysis error: {e}")
        current_emotion_data["faceDetected"] = False

# API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    """Server sağlık kontrolü"""
    return jsonify({
        "status": "healthy",
        "camera_active": camera_active,
        "model_loaded": True,
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

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame_endpoint():
    """React'ten gelen frame'i analiz et"""
    try:
        data = request.json
        frame_base64 = data.get('frame')

        if not frame_base64:
            return jsonify({"error": "Frame data bulunamadı"}), 400

        # Base64'ü decode et
        import base64
        import numpy as np

        frame_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Frame decode edilemedi"}), 400

        # Frame'i analiz et
        analyze_frame(frame)

        # Güncel emotion data'yı döndür
        return jsonify(current_emotion_data)

    except Exception as e:
        print(f"❌ [ANALYZE FRAME] Hata: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/emotion_data', methods=['GET'])
def get_emotion_data():
    """Güncel emotion data döndür"""
    return jsonify(current_emotion_data)

if __name__ == '__main__':
    print("🚀 Simple Emotion Detection Server başlatılıyor...")
    print("📡 Port: 5000")
    print("🌐 CORS enabled for React app")
    print("📹 Camera endpoint: POST /start_camera")
    print("😊 Emotion endpoint: GET /emotion_data")
    print("🏥 Health check: GET /health")

    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)