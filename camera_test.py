import cv2

# Basit kamera testi
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Kamera açılamadı")
    exit()

print("✅ Kamera açıldı. ESC'ye basarak çık.")
print("Yüzünü kameraya göster!")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Görüntüyü göster
    cv2.imshow('Kamera Test', frame)

    # ESC tuşu ile çık
    if cv2.waitKey(1) & 0xFF == 27:  # ESC key
        break

cap.release()
cv2.destroyAllWindows()
print("Kamera kapatıldı.")