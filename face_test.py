#!/usr/bin/env python3
"""
Basit yüz tespiti testi
Gerçek zamanlı kameradan yüz tespit eder
"""

import cv2
import mediapipe as mp
import time

# MediaPipe setup
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.9)

# IriUn webcam DirectShow backend ile
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# IriUn için özel ayarlar
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))

print("📹 IriUn DirectShow ile kamera açılıyor...")

# Birkaç frame atla (IriUn başlangıçta siyah frame verebilir)
for i in range(5):
    ret, frame = cap.read()
    if ret:
        print(f"🔍 Frame {i+1}: {frame.shape}")
    else:
        print(f"❌ Frame {i+1}: Okunamadı")

if cap is None or not cap.isOpened():
    print("❌ Hiçbir kamera bulunamadı!")
    exit()

print("✅ Kamera açıldı")
print("📹 Kameraya yüzünü göster")
print("🚪 ESC tuşu ile çık")
print("=" * 50)

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Frame okunamadı")
        break

    frame_count += 1

    # BGR'den RGB'ye çevir
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Yüz tespiti yap
    results = face_detection.process(rgb_frame)

    # Sonuçları işle
    if results.detections:
        print(f"✅ Frame {frame_count}: {len(results.detections)} yüz bulundu!")

        for detection in results.detections:
            confidence = detection.score[0]
            print(f"   Confidence: {confidence:.1%}")

            # Yüzü çiz
            mp_drawing.draw_detection(frame, detection)
    else:
        print(f"❌ Frame {frame_count}: Yüz bulunamadı")

    # Görüntüyü göster
    cv2.imshow('Yüz Tespiti Test', frame)

    # ESC tuşu ile çık
    if cv2.waitKey(1) & 0xFF == 27:  # ESC
        break

# Temizlik
cap.release()
cv2.destroyAllWindows()
print("\n🔚 Test tamamlandı")