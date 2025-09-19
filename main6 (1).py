import cv2
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import mediapipe as mp
import time
import atexit
import numpy as np
import requests
import json
import random

device = "cuda" if torch.cuda.is_available() else "cpu"

model_name = "openai/clip-vit-base-patch32"
model = CLIPModel.from_pretrained(model_name).to(device)
processor = CLIPProcessor.from_pretrained(model_name)

emotion_labels_dict = {
    "a happy child": "a child with a wide smile and bright eyes, looking happy",
    "a sad child": "a child with teary eyes and a downturned mouth, looking sad",
    "a bored child": "a child with a bored expression, half-closed eyes, drooping eyelids, yawning or resting their chin on their hand",
    "a confused child": "a child tilting their head slightly, with eyebrows raised unevenly, looking confused",
    "a surprised child": "a child with wide open eyes and mouth, showing surprise",
    "an angry child": "a child with tightly pressed lips and furrowed eyebrows, showing anger",
    "a neutral child": "a child with relaxed facial muscles and a calm expression, looking neutral"
}

emotion_prompts = list(emotion_labels_dict.values())
display_labels = list(emotion_labels_dict.keys())

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Hata: Webcam başlatılamadı.")
    exit()

cv2.namedWindow("Emotion Detection", cv2.WND_PROP_FULLSCREEN)
cv2.setWindowProperty("Emotion Detection", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

emotion_stats = {label: {"time": 0.0, "looked": 0, "total": 0} for label in display_labels}
start_time = time.time()
last_time = start_time

def exit_handler():
    print("\n📋 Program Kapanıyor. Sonuçlar:")
    total_time = time.time() - start_time
    for label, stats in emotion_stats.items():
        if stats["time"] > 0:
            perc = (stats["time"] / total_time) * 100
            mins, secs = divmod(int(stats["time"]), 60)
            look_perc = (stats["looked"] / stats["total"]) * 100 if stats["total"] > 0 else 0
            clean_label = label.replace("a ", "").replace("an ", "")
            print(f"{clean_label}: %{perc:.1f} - {mins}m{secs}s - Looked:%{look_perc:.1f}")

atexit.register(exit_handler)

def get_color_name(h, s, v):
    if v < 40:
        return "Black"
    elif s < 40:
        if v > 200:
            return "White"
        else:
            return "Gray"
    else:
        if h < 10 or h >= 170:
            return "Red"
        elif h < 25:
            return "Orange"
        elif h < 35:
            return "Yellow"
        elif h < 85:
            return "Green"
        elif h < 125:
            return "Blue"
        elif h < 170:
            return "Purple"
        else:
            return "Unknown"

while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.time()
    elapsed = current_time - last_time
    last_time = current_time

    pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    inputs = processor(
        text=emotion_prompts,
        images=pil_image,
        return_tensors="pt",
        padding=True
    ).to(device)

    with torch.no_grad():
        outputs_clip = model(**inputs)

    logits_per_image = outputs_clip.logits_per_image
    probs = logits_per_image.softmax(dim=1)

    best_prob, best_idx = torch.max(probs, 1)
    predicted_label = display_labels[best_idx.item()]

    gaze_status = "UNKNOWN"
    looking = False

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    h, w, _ = frame.shape
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            left_iris = [468, 469, 470, 471]
            right_iris = [473, 474, 475, 476]

            lx = int(sum([face_landmarks.landmark[i].x for i in left_iris]) / len(left_iris) * w)
            rx = int(sum([face_landmarks.landmark[i].x for i in right_iris]) / len(right_iris) * w)

            gaze_x = (lx + rx) // 2

            if w * 0.4 < gaze_x < w * 0.6:
                gaze_status = "LOOKING AT SCREEN"
                looking = True
                color = (0, 255, 0)
            else:
                gaze_status = "NOT LOOKING AT SCREEN"
                looking = False
                color = (0, 0, 255)
            break
    else:
        color = (0, 255, 255)
        gaze_status = "NO FACE DETECTED"

    if predicted_label in emotion_stats:
        emotion_stats[predicted_label]["time"] += elapsed
        emotion_stats[predicted_label]["total"] += 1
        if looking:
            emotion_stats[predicted_label]["looked"] += 1

    frame = cv2.resize(frame, (int(w * 1.3), int(h * 1.3)))
    h, w, _ = frame.shape
    canvas = 255 * np.ones((h + 200, w + 400, 3), dtype=np.uint8)
    canvas[0:h, 0:w] = frame

    # Ortadaki kare
    cx, cy = w // 2, h // 2
    size = 50  
    x1, y1 = cx - size, cy - size
    x2, y2 = cx + size, cy + size

    # Renk analizi frame üzerinden
    roi = frame[y1:y2, x1:x2]
    hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    h_med = int(np.median(hsv_roi[:, :, 0]))
    s_med = int(np.median(hsv_roi[:, :, 1]))
    v_med = int(np.median(hsv_roi[:, :, 2]))
    color_name = get_color_name(h_med, s_med, v_med)

    # Kareyi canvas üzerine çiz
    cv2.rectangle(canvas, (x1, y1), (x2, y2), (0, 255, 255), 3)

    # Bilgiler
    cv2.putText(canvas, f"Emotion: {predicted_label}", (w + 20, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)
    cv2.putText(canvas, f"Gaze: {gaze_status}", (w + 20, 130),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)
    cv2.putText(canvas, f"Object Color: {color_name}", (w + 20, 180),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2, cv2.LINE_AA)

    total_time = time.time() - start_time
    y_offset = h + 40
    for label, stats in emotion_stats.items():
        if stats["time"] > 0:
            perc = (stats["time"] / total_time) * 100
            mins, secs = divmod(int(stats["time"]), 60)
            look_perc = (stats["looked"] / stats["total"]) * 100 if stats["total"] > 0 else 0
            stat_text = f"{label}: %{perc:.1f} / {mins}m{secs}s - Looked: %{look_perc:.1f}"
            cv2.putText(canvas, stat_text, (20, y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (80, 80, 80), 1, cv2.LINE_AA)
            y_offset += 25

    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(canvas, f"Time: {timestamp}", (20, h + 160),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (50, 50, 50), 2)

    cv2.imshow("Emotion Detection", canvas)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
