import os
import io
import re
import json
import time
import base64
import urllib.request
import urllib.error
import threading
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

DOWNLOAD_STATE = {
    "is_downloading": False,
    "model_name": "",
    "progress": 0,
    "status": "idle",
    "downloaded_mb": 0.0,
    "total_mb": 0.0,
    "speed_mbps": 0.0,
    "error": None
}

FILTER_PROFILES = {
    "moody_teal_orange":   "Moody Teal & Orange",
    "warm_vintage":        "Warm Vintage Glow",
    "cool_cyber":          "Cool Cyber Blue",
    "vivid_pop":           "Vivid Bright Pop",
    "cinematic_contrast":  "Cinematic Contrast",
    "black_and_white":     "Black & White",
    "golden_hour":         "Golden Hour",
    "faded_film":          "Faded Film",
    "neutral":             "Natural Color Grade",
}

def pil_to_b64(img: Image.Image, fmt="JPEG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def build_slot_contact_sheet(slot_frames: list) -> Image.Image:
    thumb_w, thumb_h = 160, 90
    label_h = 18
    cols = 3
    rows = len(slot_frames)
    sheet_w = thumb_w * cols
    sheet_h = (thumb_h + label_h) * rows

    sheet = Image.new("RGB", (sheet_w, sheet_h), (15, 15, 20))
    draw = ImageDraw.Draw(sheet)

    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    for row_idx, slot_info in enumerate(slot_frames):
        slot_id = slot_info["slot_id"]
        frames = slot_info["frames"]
        y_base = row_idx * (thumb_h + label_h)

        draw.rectangle([0, y_base, sheet_w, y_base + label_h], fill=(30, 30, 45))
        if font:
            draw.text((4, y_base + 2), f"Slot {slot_id}", fill=(180, 160, 255), font=font)

        for col_idx, frame_img in enumerate(frames[:cols]):
            x = col_idx * thumb_w
            y = y_base + label_h
            try:
                thumb = frame_img.copy()
                thumb.thumbnail((thumb_w, thumb_h))
                bg = Image.new("RGB", (thumb_w, thumb_h), (10, 10, 15))
                offset_x = (thumb_w - thumb.width) // 2
                offset_y = (thumb_h - thumb.height) // 2
                bg.paste(thumb, (offset_x, offset_y))
                sheet.paste(bg, (x, y))
            except Exception:
                pass

    return sheet

def check_vision_model_status() -> dict:
    ollama_running = False
    installed_models = []
    active_model = None

    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/tags", headers={"User-Agent": "Ashtavadhani/1.0"})
        with urllib.request.urlopen(req, timeout=1.5) as res:
            if res.status == 200:
                ollama_running = True
                data = json.loads(res.read().decode("utf-8"))
                for m in data.get("models", []):
                    name = m.get("name", "")
                    installed_models.append(name)
                    for v_key in ["moondream", "qwen", "llava", "bakllava", "llama3.2-vision", "minicpm-v"]:
                        if v_key in name.lower() and not active_model:
                            active_model = name
    except Exception:
        ollama_running = False

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    if active_model:
        provider = "local_ollama"
        label = f"Local PC GPU ({active_model})"
        ready = True
    elif gemini_key:
        provider = "gemini_cloud"
        label = "Cloud Gemini API"
        ready = True
    else:
        provider = "heuristic"
        label = "Smart Frame Hash (Offline Heuristic)"
        ready = True

    return {
        "ready": ready,
        "active_provider": provider,
        "provider_label": label,
        "ollama_running": ollama_running,
        "active_model": active_model,
        "installed_models": installed_models,
        "has_gemini_key": bool(gemini_key),
        "download_state": DOWNLOAD_STATE
    }

def trigger_ollama_pull(model_name: str = "moondream"):
    global DOWNLOAD_STATE
    if DOWNLOAD_STATE["is_downloading"]:
        return {"status": "already_downloading"}

    def _pull_worker():
        global DOWNLOAD_STATE
        DOWNLOAD_STATE["is_downloading"] = True
        DOWNLOAD_STATE["model_name"] = model_name
        DOWNLOAD_STATE["status"] = "downloading"
        DOWNLOAD_STATE["progress"] = 0
        DOWNLOAD_STATE["error"] = None

        try:
            url = f"{OLLAMA_HOST}/api/pull"
            payload = json.dumps({"name": model_name, "stream": True}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

            with urllib.request.urlopen(req, timeout=3600) as response:
                for line in response:
                    if line:
                        chunk = json.loads(line.decode("utf-8"))
                        status_msg = chunk.get("status", "")
                        completed = chunk.get("completed", 0)
                        total = chunk.get("total", 0)

                        if total > 0:
                            pct = int((completed / total) * 100)
                            DOWNLOAD_STATE["progress"] = pct
                            DOWNLOAD_STATE["downloaded_mb"] = round(completed / (1024 * 1024), 1)
                            DOWNLOAD_STATE["total_mb"] = round(total / (1024 * 1024), 1)
                            DOWNLOAD_STATE["status"] = f"{status_msg} ({pct}%)"
                        else:
                            DOWNLOAD_STATE["status"] = status_msg

            DOWNLOAD_STATE["status"] = "complete"
            DOWNLOAD_STATE["progress"] = 100
        except Exception as e:
            DOWNLOAD_STATE["status"] = "error"
            DOWNLOAD_STATE["error"] = str(e)
        finally:
            DOWNLOAD_STATE["is_downloading"] = False

    t = threading.Thread(target=_pull_worker, daemon=True)
    t.start()
    return {"status": "started", "model": model_name}

def parse_vision_response(raw_text: str, total_slots: int) -> dict:
    raw = raw_text.strip()
    # Try direct JSON match
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if json_match:
        try:
            parsed = json.loads(json_match.group(0))
            if "slots" in parsed:
                return parsed
        except Exception:
            pass

    # Fallback regex parsing
    slots_map = {}
    for i in range(1, total_slots + 1):
        pat = rf"(?:Slot\s*{i}|slot_{i}|\"{i}\")\s*[:=\-]\s*\"?(photo|video)\"?"
        m = re.search(pat, raw, re.IGNORECASE)
        if m:
            slots_map[str(i)] = m.group(1).lower()
        else:
            slots_map[str(i)] = "photo"

    color_profile = "neutral"
    for k in FILTER_PROFILES.keys():
        if k in raw.lower() or FILTER_PROFILES[k].lower() in raw.lower():
            color_profile = k
            break

    return {
        "slots": slots_map,
        "color_profile": color_profile,
        "filter_label": FILTER_PROFILES.get(color_profile, "Natural Color Grade"),
        "filter_description": "Extracted via local vision AI"
    }

def analyze_slots_with_ollama(slot_frames: list, model_name: str) -> dict:
    contact_sheet = build_slot_contact_sheet(slot_frames)
    sheet_b64 = pil_to_b64(contact_sheet)
    total_slots = len(slot_frames)
    slot_list = ", ".join(str(s["slot_id"]) for s in slot_frames)

    prompt = (
        f"Analyze these video template slots ({slot_list}).\n"
        "For each slot, is it a 'photo' (still image, portrait) or 'video' (moving clip)?\n"
        "Return ONLY a JSON object: {\"slots\": {\"1\": \"photo\", \"2\": \"video\"}, \"color_profile\": \"moody_teal_orange\"}"
    )

    url = f"{OLLAMA_HOST}/api/generate"
    payload = json.dumps({
        "model": model_name,
        "prompt": prompt,
        "images": [sheet_b64],
        "stream": False,
        "options": {
            "temperature": 0.0,
            "num_predict": 256
        }
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as res:
        resp_data = json.loads(res.read().decode("utf-8"))
        raw_response = resp_data.get("response", "").strip()

    return parse_vision_response(raw_response, total_slots)