import cv2

print("🔍 IriUn webcam test...")

# Farklı backend'ler dene
backends = [
    (cv2.CAP_DSHOW, "DirectShow"),
    (cv2.CAP_MSMF, "Media Foundation"),
    (cv2.CAP_V4L2, "Video4Linux2"),
    (0, "Default")
]

for backend_id, backend_name in backends:
    print(f"\n📹 {backend_name} backend test...")

    for camera_idx in range(5):  # 0-4 index'leri dene
        try:
            cap = cv2.VideoCapture(camera_idx, backend_id)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    h, w = frame.shape[:2]
                    print(f"✅ Index {camera_idx}: {w}x{h} - {backend_name}")

                    # 5 frame test et
                    for i in range(5):
                        ret, frame = cap.read()
                        if ret:
                            print(f"   Frame {i+1}: OK")
                        else:
                            print(f"   Frame {i+1}: FAIL")

                    cap.release()
                    print(f"🎯 ÇALIŞAN KAMERA: Index {camera_idx}, Backend {backend_name}")
                    break
                else:
                    cap.release()
            else:
                cap.release()
        except Exception as e:
            print(f"❌ Index {camera_idx} hata: {e}")
    else:
        continue
    break
else:
    print("❌ Hiçbir kamera bulunamadı")