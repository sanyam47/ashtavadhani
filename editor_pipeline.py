import os
import time
import json
import wave
import numpy as np
from moviepy import ImageClip, concatenate_videoclips, AudioFileClip, ColorClip, VideoFileClip, AudioClip
from moviepy.audio.AudioClip import CompositeAudioClip

def ensure_audio(clip, duration):
    """
    If the clip does not have an audio track (e.g. ImageClip or ColorClip),
    it generates a silent stereo audio track of the specified duration.
    This prevents MoviePy concatenation crashes when mixing video and image clips.
    """
    if getattr(clip, "audio", None) is not None:
        return clip
    try:
        def make_silence(t):
            if hasattr(t, "__len__"):
                return np.zeros((len(t), 2))
            return np.zeros(2)
        silent_audio = AudioClip(make_silence, duration=duration, fps=44100)
        return clip.with_audio(silent_audio)
    except Exception as e:
        print(f"Failed to generate silence for clip: {e}")
        return clip

def process_clip_to_format(clip, target_w, target_h, duration=None):
    is_image = "ImageClip" in str(type(clip)) or "ColorClip" in str(type(clip))
    if is_image:
        if duration is None:
            duration = 3.0
        clip = clip.resized(height=target_h)
        cw, ch = clip.size
        if cw < target_w:
            clip = clip.resized(width=target_w)
        cw, ch = clip.size
        x1 = (cw - target_w) / 2
        clip = clip.cropped(x1=x1, y1=0, x2=x1+target_w, y2=target_h)
        clip = clip.with_duration(duration)
        clip = ensure_audio(clip, duration)
        return clip
    else:
        clip = clip.resized(height=target_h)
        cw, ch = clip.size
        if cw < target_w:
            clip = clip.resized(width=target_w)
        cw, ch = clip.size
        x1 = (cw - target_w) / 2
        clip = clip.cropped(x1=x1, y1=0, x2=x1+target_w, y2=target_h)
        if duration is not None:
            clip = clip.subclipped(0, min(duration, clip.duration))
        return clip


def transcribe_with_whisper(wav_path: str) -> list:
    """
    Transcribes audio using faster-whisper (local AI, no API key, handles Hinglish).
    Returns a list of caption dicts with start, end, text.
    """
    try:
        from faster_whisper import WhisperModel
        print("Loading faster-whisper 'base' model (local AI, no API key needed)...")
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        segments, info = model.transcribe(
            wav_path,
            beam_size=5,
            word_timestamps=True,
            language=None  # Auto-detect: handles English, Hindi, Hinglish
        )
        
        captions = []
        current_words = []
        current_start = None
        current_end = None
        
        for segment in segments:
            if segment.words:
                for word in segment.words:
                    w_text = word.word
                    if current_start is None:
                        current_start = word.start
                    current_words.append(w_text)
                    current_end = word.end
                    # Group into ~5-word readable chunks
                    if len(current_words) >= 5 or w_text.strip().endswith(('.', ',', '!', '?', '।', '...')):
                        text = "".join(current_words).strip()
                        if text:
                            captions.append({
                                "start": round(float(current_start), 2),
                                "end": round(float(current_end), 2),
                                "text": text.upper()
                            })
                        current_words = []
                        current_start = None
            else:
                # Segment-level fallback if word timestamps unavailable
                captions.append({
                    "start": round(float(segment.start), 2),
                    "end": round(float(segment.end), 2),
                    "text": segment.text.strip().upper()
                })
        
        # Flush any remaining words
        if current_words and current_start is not None:
            text = "".join(current_words).strip()
            if text:
                captions.append({
                    "start": round(float(current_start), 2),
                    "end": round(float(current_end), 2),
                    "text": text.upper()
                })
        
        print(f"[Whisper] Transcription complete: {len(captions)} subtitle segments generated.")
        return captions
    except ImportError:
        print("faster-whisper not found. Falling back to SpeechRecognition...")
        return None  # Signal fallback needed
    except Exception as e:
        print(f"[Whisper] Transcription error: {e}")
        return None

def detect_voice_activity(wav_path, frame_duration_ms=500):
    """
    Analyzes the WAV file amplitude and returns active speech intervals (start_sec, end_sec).
    Pure Python/NumPy VAD.
    """
    try:
        with wave.open(wav_path, 'rb') as wf:
            params = wf.getparams()
            channels = params.nchannels
            sample_width = params.sampwidth
            framerate = params.framerate
            n_frames = params.nframes
            raw_data = wf.readframes(n_frames)
            
            if sample_width == 2:
                data = np.frombuffer(raw_data, dtype=np.int16)
            elif sample_width == 1:
                data = np.frombuffer(raw_data, dtype=np.uint8).astype(np.int16) - 128
            else:
                return []
                
            if channels > 1:
                data = data.reshape(-1, channels).mean(axis=1)
                
        samples_per_frame = int(framerate * (frame_duration_ms / 1000.0))
        n_samples = len(data)
        n_frames_total = n_samples // samples_per_frame
        
        if n_frames_total == 0:
            return []
            
        energies = []
        for i in range(n_frames_total):
            start = i * samples_per_frame
            end = start + samples_per_frame
            frame_data = data[start:end]
            energy = np.sqrt(np.mean(frame_data.astype(np.float64)**2))
            energies.append(energy)
            
        energies = np.array(energies)
        mean_energy = np.mean(energies)
        min_energy = np.percentile(energies, 15)
        threshold = min_energy + (mean_energy - min_energy) * 0.4
        
        active_segments = []
        in_active = False
        start_frame = 0
        
        for idx, e in enumerate(energies):
            if e > threshold:
                if not in_active:
                    in_active = True
                    start_frame = idx
            else:
                if in_active:
                    in_active = False
                    active_segments.append((start_frame * frame_duration_ms / 1000.0, idx * frame_duration_ms / 1000.0))
                    
        if in_active:
            active_segments.append((start_frame * frame_duration_ms / 1000.0, n_frames_total * frame_duration_ms / 1000.0))
            
        merged_segments = []
        for seg in active_segments:
            if not merged_segments:
                merged_segments.append(seg)
            else:
                prev = merged_segments[-1]
                if seg[0] - prev[1] < 1.5:
                    merged_segments[-1] = (prev[0], seg[1])
                else:
                    merged_segments.append(seg)
                    
        return merged_segments
    except Exception as e:
        print(f"VAD calculation error: {e}")
        return []

def transcribe_video_audio(video_path: str) -> list:
    """
    Extracts audio from video and transcribes spoken words.
    Priority order:
      1. faster-whisper (local AI, best accuracy, free, no API key)
      2. Google SpeechRecognition + VAD pacing (fallback)
    """
    temp_wav = "temp_voice_extract.wav"
    try:
        clip = VideoFileClip(video_path)
        if clip.audio is None:
            print("[Caption Agent] Video has no audio track.")
            return []
        
        total_duration = clip.duration
        print("Extracting audio from video for transcription...")
        clip.audio.write_audiofile(temp_wav, codec="pcm_s16le", fps=16000, logger=None)
        clip.close()
    except Exception as e:
        print(f"Audio extraction failed: {e}")
        return []
    
    captions = []
    
    try:
        # === PRIMARY: faster-whisper (local, free, accurate) ===
        whisper_result = transcribe_with_whisper(temp_wav)
        if whisper_result is not None:
            return whisper_result
        
        # === FALLBACK: Google SpeechRecognition + VAD pacing ===
        print("Using SpeechRecognition fallback...")
        voice_segments = detect_voice_activity(temp_wav)
        print(f"Detected active voice bounds: {voice_segments}")
        
        import speech_recognition as sr
        r = sr.Recognizer()
        print("Transcribing voice speech...")
        with sr.AudioFile(temp_wav) as source:
            audio_data = r.record(source)
        
        full_text = r.recognize_google(audio_data, language="en-IN")
        print(f"Transcription result: {full_text}")
        
        words = full_text.split()
        if not words:
            return []
        
        phrases = []
        current_phrase = []
        for w in words:
            current_phrase.append(w)
            if len(current_phrase) >= 5 or w.endswith((".", ",", "!", "?")):
                phrases.append(" ".join(current_phrase))
                current_phrase = []
        if current_phrase:
            phrases.append(" ".join(current_phrase))
        
        if not voice_segments:
            voice_segments = [(0.0, total_duration)]
        
        phrase_idx = 0
        n_phrases = len(phrases)
        
        for seg_start, seg_end in voice_segments:
            seg_time = seg_start
            while seg_time < seg_end and phrase_idx < n_phrases:
                text = phrases[phrase_idx]
                word_count = len(text.split())
                cap_duration = max(1.2, word_count * 0.45)
                cap_start = seg_time + (0.5 if seg_time == seg_start else 0.0)
                if cap_start + cap_duration > seg_end:
                    break
                captions.append({
                    "start": float(round(cap_start, 1)),
                    "end": float(round(cap_start + cap_duration, 1)),
                    "text": text.upper()
                })
                seg_time = cap_start + cap_duration + 0.6
                phrase_idx += 1
        
        if phrase_idx < n_phrases:
            last_time = captions[-1]["end"] + 0.6 if captions else 0.5
            while phrase_idx < n_phrases and last_time < total_duration:
                text = phrases[phrase_idx]
                cap_duration = max(1.2, len(text.split()) * 0.45)
                if last_time + cap_duration > total_duration:
                    cap_duration = total_duration - last_time
                if cap_duration >= 0.8:
                    captions.append({
                        "start": float(round(last_time, 1)),
                        "end": float(round(last_time + cap_duration, 1)),
                        "text": text.upper()
                    })
                last_time += cap_duration + 0.6
                phrase_idx += 1
        
        print(f"SpeechRecognition transcription complete: {len(captions)} segments.")
        return captions
    except Exception as e:
        print(f"All transcription methods failed: {e}")
        return []
    finally:
        if os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except Exception:
                pass

def apply_zoom(clip, zoom_speed=0.06, enabled=True):
    """
    Applies a smooth Ken Burns zoom effect to an ImageClip or VideoClip.
    Only applied to short clips (under 10 seconds) if transitions are enabled.
    """
    if not enabled:
        return clip
    duration = clip.duration
    if not duration or duration > 10.0:
        return clip
    try:
        return clip.resized(lambda t: 1.0 + zoom_speed * (t / duration))
    except Exception:
        return clip

def apply_color_grade(clip, grade_type="moody", enabled=True):
    """
    Applies a color grading filter using pixel color adjustments.
    Only applied if enabled and the clip is under 15 seconds.
    """
    if not enabled:
        return clip
    duration = clip.duration
    if not duration or duration > 15.0:
        return clip
        
    if grade_type == "moody":
        def filter_fn(image):
            img = image.astype('float32')
            img = 128 + 1.2 * (img - 128)
            img[:, :, 2] = img[:, :, 2] * 1.05  # Blue
            img[:, :, 1] = img[:, :, 1] * 0.98  # Green
            img[:, :, 0] = img[:, :, 0] * 0.95  # Red
            return np.clip(img, 0, 255).astype('uint8')
        return clip.image_transform(filter_fn)
    elif grade_type == "warm":
        def filter_fn(image):
            img = image.astype('float32')
            img[:, :, 0] = img[:, :, 0] * 1.10  # Red
            img[:, :, 1] = img[:, :, 1] * 1.02  # Green
            img[:, :, 2] = img[:, :, 2] * 0.90  # Blue
            return np.clip(img, 0, 255).astype('uint8')
        return clip.image_transform(filter_fn)
    return clip

def assemble_edit(raw_videos_meta, missing_shot_action, progress_callback=None, music_style="moody_phonk", output_dir="static",
                  run_music=True, run_sfx=True, run_caption=True, run_transitions=True, run_graphics=True, run_stock=True, vibe="generic"):
    """
    Assembles the final video edit by executing the structured plan contract files generated by the agents.
    """
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "edited_output.mp4")
    subtitles_path = os.path.join(output_dir, "subtitles.vtt")
    subtitles_json_path = os.path.join(output_dir, "subtitles.json")
    timeline_data_path = os.path.join(output_dir, "timeline_data.json")

    # 1. Load Stock Plan Contract
    stock_plan_path = os.path.join(output_dir, "stock_plan.json")
    if os.path.exists(stock_plan_path):
        with open(stock_plan_path, "r", encoding="utf-8") as f:
            stock_plan = json.load(f)
    else:
        stock_plan = {
            "missing_shot_action": missing_shot_action,
            "raw_files": raw_videos_meta,
            "inspected_metadata": [],
            "cuts": []
        }

    # 2. Load Music Plan Contract
    music_plan_path = os.path.join(output_dir, "music_plan.json")
    if os.path.exists(music_plan_path):
        with open(music_plan_path, "r", encoding="utf-8") as f:
            music_plan = json.load(f)
    else:
        music_plan = {"run_music": run_music, "track": "backing_music.mp3", "volume": 0.15, "beats": [], "vibe": vibe}

    # 3. Load Transitions Plan Contract
    transitions_plan_path = os.path.join(output_dir, "transitions_plan.json")
    if os.path.exists(transitions_plan_path):
        with open(transitions_plan_path, "r", encoding="utf-8") as f:
            transitions_plan = json.load(f)
    else:
        transitions_plan = {"run_transitions": run_transitions, "zoom_speed_presets": {}}

    # 4. Load Graphics Plan Contract
    graphics_plan_path = os.path.join(output_dir, "graphics_plan.json")
    if os.path.exists(graphics_plan_path):
        with open(graphics_plan_path, "r", encoding="utf-8") as f:
            graphics_plan = json.load(f)
    else:
        graphics_plan = {"run_graphics": run_graphics, "grade_type": "moody" if vibe in ["gym", "generic"] else "warm"}

    # Resolve paths for raw videos
    raw_paths = [os.path.join(output_dir, "uploads", f) for f in stock_plan.get("raw_files", []) if f]
    
    # Try to load user's uploaded raw footage clips
    valid_video_clips = []
    for path in raw_paths:
        if os.path.exists(path) and os.path.getsize(path) > 0:
            try:
                ext = os.path.splitext(path)[1].lower()
                if ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"]:
                    clip = ImageClip(path).with_duration(3.0)
                    clip = ensure_audio(clip, 3.0)
                else:
                    clip = VideoFileClip(path)
                valid_video_clips.append(clip)
            except Exception as e:
                print(f"Failed to load raw file {path}: {e}")
                
    assets_dir = os.path.join(output_dir, "assets")
    chalk_path = os.path.join(assets_dir, "ref_chalk_hands.png")
    prep_path = os.path.join(assets_dir, "ai_filler_broll.png")
    straps_path = os.path.join(assets_dir, "ref_wrist_straps.png")
    lift_path = os.path.join(assets_dir, "ref_heavy_lift.png")

    scenes = []
    target_w, target_h = 480, 854
    vibe_val = music_plan.get("vibe", vibe)
    action_val = stock_plan.get("missing_shot_action", missing_shot_action)

    if valid_video_clips:
        processed_clips = []
        for c in valid_video_clips:
            processed_clips.append(process_clip_to_format(c, target_w, target_h))
            
        num_clips = len(processed_clips)
        
        # Check if stock plan cuts have custom clip_index and start/end offsets (dynamic scene layout)
        plan_cuts = stock_plan.get("cuts", [])
        has_dynamic_cuts = len(plan_cuts) > 0 and all("clip_index" in c and "start" in c and "end" in c for c in plan_cuts)
        
        if has_dynamic_cuts:
            print("Using Vision Agent planned scene segments across multiple clips...")
            for idx, cut in enumerate(plan_cuts):
                clip_idx = cut["clip_index"]
                # Clamp clip index in case it exceeds valid processed clips range
                if clip_idx >= len(processed_clips):
                    clip_idx = len(processed_clips) - 1
                
                src_clip = processed_clips[clip_idx]
                is_img = "ImageClip" in str(type(src_clip)) or "ColorClip" in str(type(src_clip))
                
                c_start = max(0.0, cut["start"])
                c_end = min(src_clip.duration if not is_img else 10.0, cut["end"])
                play_dur = max(0.1, c_end - c_start)
                
                # Extract clip segment
                c_scene = src_clip.subclipped(c_start, c_end) if not is_img else src_clip.with_duration(play_dur)
                
                # Apply transition zoom preset
                preset_key = f"scene{idx + 1}"
                zoom_speed = transitions_plan.get("zoom_speed_presets", {}).get(preset_key, 0.08)
                c_scene = apply_zoom(c_scene, zoom_speed=zoom_speed, enabled=transitions_plan.get("run_transitions", True))
                
                # Apply color grade
                c_scene = apply_color_grade(c_scene, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
                
                scenes.append(c_scene)
                print(f"  Mapped scene {idx + 1} from clip {clip_idx} ['{cut.get('description', '')}'] timing: {c_start}s to {c_end}s (dur={play_dur:.1f}s)")
                
        elif num_clips >= 3:
            # SCENE 1: clip 0 (2.5s)
            c1 = processed_clips[0]
            c1 = c1.subclipped(0, min(2.5, c1.duration)) if not ("ImageClip" in str(type(c1)) or "ColorClip" in str(type(c1))) else c1.with_duration(2.5)
            z1 = transitions_plan.get("zoom_speed_presets", {}).get("scene1", 0.08)
            c1 = apply_zoom(c1, zoom_speed=z1, enabled=transitions_plan.get("run_transitions", True))
            c1 = apply_color_grade(c1, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c1)
            
            # SCENE 2: clip 1 (2.5s)
            c2 = processed_clips[1]
            c2 = c2.subclipped(0, min(2.5, c2.duration)) if not ("ImageClip" in str(type(c2)) or "ColorClip" in str(type(c2))) else c2.with_duration(2.5)
            z2 = transitions_plan.get("zoom_speed_presets", {}).get("scene2", -0.06)
            c2 = apply_zoom(c2, zoom_speed=z2, enabled=transitions_plan.get("run_transitions", True))
            c2 = apply_color_grade(c2, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c2)
            
            # SCENE 3: clip 2 (3.0s)
            c3 = processed_clips[2]
            c3 = c3.subclipped(0, min(3.0, c3.duration)) if not ("ImageClip" in str(type(c3)) or "ColorClip" in str(type(c3))) else c3.with_duration(3.0)
            z3 = transitions_plan.get("zoom_speed_presets", {}).get("scene3", 0.07)
            c3 = apply_zoom(c3, zoom_speed=z3, enabled=transitions_plan.get("run_transitions", True))
            c3 = apply_color_grade(c3, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c3)
                
            # SCENE 4: clip 3 or last clip (3.5s)
            c4_src = processed_clips[3] if num_clips >= 4 else processed_clips[-1]
            c4 = c4_src.subclipped(0, min(3.5, c4_src.duration)) if not ("ImageClip" in str(type(c4_src)) or "ColorClip" in str(type(c4_src))) else c4_src.with_duration(3.5)
            z4 = transitions_plan.get("zoom_speed_presets", {}).get("scene4", 0.05)
            c4 = apply_zoom(c4, zoom_speed=z4, enabled=transitions_plan.get("run_transitions", True))
            c4 = apply_color_grade(c4, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c4)
            
        elif num_clips == 2:
            c1_src = processed_clips[0]
            c2_src = processed_clips[1]
            
            # SCENE 1: first half of clip 0 (2.5s)
            is_c1_img = "ImageClip" in str(type(c1_src)) or "ColorClip" in str(type(c1_src))
            dur1 = c1_src.duration
            t_mid = dur1 / 2
            c1 = c1_src.subclipped(0, t_mid) if not is_c1_img else c1_src.with_duration(2.5)
            z1 = transitions_plan.get("zoom_speed_presets", {}).get("scene1", 0.08)
            c1 = apply_zoom(c1, zoom_speed=z1, enabled=transitions_plan.get("run_transitions", True))
            c1 = apply_color_grade(c1, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c1)
            
            # SCENE 2: second half of clip 0 (2.5s)
            c2 = c1_src.subclipped(t_mid, dur1) if not is_c1_img else c1_src.with_duration(2.5)
            z2 = transitions_plan.get("zoom_speed_presets", {}).get("scene2", -0.06)
            c2 = apply_zoom(c2, zoom_speed=z2, enabled=transitions_plan.get("run_transitions", True))
            c2 = apply_color_grade(c2, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c2)
            
            # SCENE 3: stock filler or first half of clip 1 (3.0s)
            if run_stock and action_val == "generate":
                if os.path.exists(prep_path):
                    c3 = ImageClip(prep_path).with_duration(3.0).resized(new_size=(target_w, target_h))
                    z3 = transitions_plan.get("zoom_speed_presets", {}).get("scene3", 0.12)
                    c3 = apply_zoom(c3, zoom_speed=z3, enabled=transitions_plan.get("run_transitions", True))
                    c3 = apply_color_grade(c3, "warm", enabled=graphics_plan.get("run_graphics", True))
                    c3 = ensure_audio(c3, 3.0)
                    scenes.append(c3)
                else:
                    scenes.append(ensure_audio(ColorClip(size=(target_w, target_h), color=(50, 50, 60)).with_duration(3.0), 3.0))
            else:
                is_c2_img = "ImageClip" in str(type(c2_src)) or "ColorClip" in str(type(c2_src))
                dur2 = c2_src.duration
                t_mid2 = dur2 / 2
                c3 = c2_src.subclipped(0, t_mid2) if not is_c2_img else c2_src.with_duration(3.0)
                z3 = transitions_plan.get("zoom_speed_presets", {}).get("scene3", 0.07)
                c3 = apply_zoom(c3, zoom_speed=z3, enabled=transitions_plan.get("run_transitions", True))
                c3 = apply_color_grade(c3, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
                scenes.append(c3)
                
            # SCENE 4: second half of clip 1 (3.5s)
            is_c2_img = "ImageClip" in str(type(c2_src)) or "ColorClip" in str(type(c2_src))
            dur2 = c2_src.duration
            t_mid2 = dur2 / 2
            c4 = c2_src.subclipped(t_mid2, dur2) if not is_c2_img else c2_src.with_duration(3.5)
            z4 = transitions_plan.get("zoom_speed_presets", {}).get("scene4", 0.05)
            c4 = apply_zoom(c4, zoom_speed=z4, enabled=transitions_plan.get("run_transitions", True))
            c4 = apply_color_grade(c4, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c4)
            
        else:
            # num_clips == 1
            main_video_cropped = processed_clips[0]
            is_main_img = "ImageClip" in str(type(main_video_cropped)) or "ColorClip" in str(type(main_video_cropped))
            total_duration = main_video_cropped.duration
            t1 = min(2.5, total_duration * 0.25)
            t2 = min(5.0, total_duration * 0.5)
            t3 = min(8.0, total_duration * 0.75)
            
            c1 = main_video_cropped.subclipped(0, t1) if not is_main_img else main_video_cropped.with_duration(2.5)
            z1 = transitions_plan.get("zoom_speed_presets", {}).get("scene1", 0.08)
            c1 = apply_zoom(c1, zoom_speed=z1, enabled=transitions_plan.get("run_transitions", True))
            c1 = apply_color_grade(c1, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c1)
            
            c2 = main_video_cropped.subclipped(t1, t2) if not is_main_img else main_video_cropped.with_duration(2.5)
            z2 = transitions_plan.get("zoom_speed_presets", {}).get("scene2", -0.06)
            c2 = apply_zoom(c2, zoom_speed=z2, enabled=transitions_plan.get("run_transitions", True))
            c2 = apply_color_grade(c2, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c2)
            
            if run_stock:
                if action_val == "generate":
                    if os.path.exists(prep_path):
                        c3 = ImageClip(prep_path).with_duration(3.0).resized(new_size=(target_w, target_h))
                        z3 = transitions_plan.get("zoom_speed_presets", {}).get("scene3", 0.12)
                        c3 = apply_zoom(c3, zoom_speed=z3, enabled=transitions_plan.get("run_transitions", True))
                        c3 = apply_color_grade(c3, "warm", enabled=graphics_plan.get("run_graphics", True))
                        c3 = ensure_audio(c3, 3.0)
                        scenes.append(c3)
                    else:
                        scenes.append(ensure_audio(ColorClip(size=(target_w, target_h), color=(50, 50, 60)).with_duration(3.0), 3.0))
                else:
                    pass
            
            c4 = main_video_cropped.subclipped(t2 if not run_stock or action_val != "generate" else t3, total_duration) if not is_main_img else main_video_cropped.with_duration(3.5)
            z4 = transitions_plan.get("zoom_speed_presets", {}).get("scene4", 0.05)
            c4 = apply_zoom(c4, zoom_speed=z4, enabled=transitions_plan.get("run_transitions", True))
            c4 = apply_color_grade(c4, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            scenes.append(c4)
        
    else:
        # Fallback to visual placeholder images if no valid video clips loaded (e.g. testing)
        if os.path.exists(chalk_path):
            clip1 = ImageClip(chalk_path).with_duration(2.5).resized(new_size=(target_w, target_h))
            z1 = transitions_plan.get("zoom_speed_presets", {}).get("scene1", 0.08)
            clip1 = apply_zoom(clip1, zoom_speed=z1, enabled=transitions_plan.get("run_transitions", True))
            clip1 = apply_color_grade(clip1, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            clip1 = ensure_audio(clip1, 2.5)
            scenes.append(clip1)
        else:
            scenes.append(ensure_audio(ColorClip(size=(target_w, target_h), color=(20, 20, 25)).with_duration(2.5), 2.5))

        if os.path.exists(prep_path):
            clip2 = ImageClip(prep_path).with_duration(2.5).resized(new_size=(target_w, target_h))
            z2 = transitions_plan.get("zoom_speed_presets", {}).get("scene2", -0.06)
            clip2 = apply_zoom(clip2, zoom_speed=z2, enabled=transitions_plan.get("run_transitions", True))
            clip2 = apply_color_grade(clip2, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            clip2 = ensure_audio(clip2, 2.5)
            scenes.append(clip2)
        else:
            scenes.append(ensure_audio(ColorClip(size=(target_w, target_h), color=(10, 10, 15)).with_duration(2.5), 2.5))

        if run_stock:
            if action_val == "generate":
                if os.path.exists(prep_path):
                    clip3 = ImageClip(prep_path).with_duration(3.0).resized(new_size=(target_w, target_h))
                    z3 = transitions_plan.get("zoom_speed_presets", {}).get("scene3", 0.12)
                    clip3 = apply_zoom(clip3, zoom_speed=z3, enabled=transitions_plan.get("run_transitions", True))
                    clip3 = apply_color_grade(clip3, "warm", enabled=graphics_plan.get("run_graphics", True))
                    clip3 = ensure_audio(clip3, 3.0)
                    scenes.append(clip3)
            elif action_val == "upload":
                if os.path.exists(straps_path):
                    clip3 = ImageClip(straps_path).with_duration(3.0).resized(new_size=(target_w, target_h))
                    z3 = transitions_plan.get("zoom_speed_presets", {}).get("scene3", 0.07)
                    clip3 = apply_zoom(clip3, zoom_speed=z3, enabled=transitions_plan.get("run_transitions", True))
                    clip3 = apply_color_grade(clip3, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
                    clip3 = ensure_audio(clip3, 3.0)
                    scenes.append(clip3)
            else:
                pass

        if os.path.exists(lift_path):
            clip4 = ImageClip(lift_path).with_duration(4.0).resized(new_size=(target_w, target_h))
            z4 = transitions_plan.get("zoom_speed_presets", {}).get("scene4", 0.05)
            clip4 = apply_zoom(clip4, zoom_speed=z4, enabled=transitions_plan.get("run_transitions", True))
            clip4 = apply_color_grade(clip4, graphics_plan.get("grade_type", "moody"), enabled=graphics_plan.get("run_graphics", True))
            clip4 = ensure_audio(clip4, 4.0)
            scenes.append(clip4)
        else:
            scenes.append(ensure_audio(ColorClip(size=(target_w, target_h), color=(30, 20, 20)).with_duration(4.0), 4.0))

    # Stitch clips with compose
    final_video = concatenate_videoclips(scenes, method="compose")

    # Ensure subtitle files exist (CaptionAgent generates them, write placeholder if not present)
    if not os.path.exists(subtitles_path):
        with open(subtitles_path, "w", encoding="utf-8") as f:
            f.write("WEBVTT\n\n")
    if not os.path.exists(subtitles_json_path):
        with open(subtitles_json_path, "w", encoding="utf-8") as f:
            json.dump({"active": False, "captions": []}, f)

    # Mix soundtrack background music if requested — supports multiple tracks
    music_tracks = music_plan.get("tracks", [])
    # Backward compat: old format has single "track" key
    if not music_tracks and music_plan.get("track"):
        music_tracks = [{"track": music_plan["track"], "volume": music_plan.get("volume", 0.15)}]
    
    if music_plan.get("run_music", True) and music_tracks:
        audio_layers = [final_video.audio] if final_video.audio is not None else []
        for track_entry in music_tracks:
            track_rel = track_entry.get("track", "")
            track_vol = track_entry.get("volume", 0.15)
            # Try multiple path resolutions
            music_file = os.path.join(output_dir, track_rel)
            if not os.path.exists(music_file):
                music_file = os.path.join(output_dir, "music", track_rel)
            if not os.path.exists(music_file):
                music_file = os.path.join(output_dir, "music", os.path.basename(track_rel))
            if os.path.exists(music_file):
                try:
                    track_start = track_entry.get("start", 0.0)       # when in video timeline music enters
                    track_end = track_entry.get("end", final_video.duration)
                    song_start_sec = track_entry.get("song_start_sec", 0.0)  # which part of song to use
                    play_duration = max(0.1, track_end - track_start)
                    
                    backing_track = AudioFileClip(music_file)
                    
                    # Skip the boring intro — start from the AI-chosen section of the song
                    if song_start_sec > 0 and song_start_sec < backing_track.duration - 5:
                        backing_track = backing_track.subclipped(song_start_sec)
                        print(f"  → Starting song from {song_start_sec}s (AI-selected best section)")
                    
                    # Trim to target play duration
                    if backing_track.duration > play_duration:
                        backing_track = backing_track.subclipped(0, play_duration)
                    
                    # Scale volume
                    backing_track = backing_track.with_volume_scaled(track_vol)
                    
                    # Apply timeline offset (video_start_sec)
                    if track_start > 0:
                        backing_track = backing_track.with_start(track_start)
                        
                    audio_layers.append(backing_track)
                    print(f"Mixed music track: {music_file} [song@{song_start_sec}s → video@{track_start}s-{track_end}s] @ vol={track_vol}")
                except Exception as e:
                    print(f"Failed to mix track '{music_file}': {e}")
        if len(audio_layers) > 1:
            final_video = final_video.with_audio(CompositeAudioClip(audio_layers))
        elif len(audio_layers) == 1:
            final_video = final_video.with_audio(audio_layers[0])

    # Mix custom/stock sound effects if requested
    sfx_plan_path = os.path.join(output_dir, "sfx_plan.json")
    if os.path.exists(sfx_plan_path):
        with open(sfx_plan_path, "r", encoding="utf-8") as f:
            sfx_plan = json.load(f)
    else:
        sfx_plan = {"run_sfx": run_sfx, "tracks": [], "placements": []}

    if sfx_plan.get("run_sfx", True):
        audio_sources = [final_video.audio] if final_video.audio is not None else []
        
        # If user customized SFX via the timeline
        if sfx_plan.get("edited_by_user", False):
            for placement in sfx_plan.get("placements", []):
                t_track = placement.get("track", "")
                t_start = placement.get("start", 0.0)
                t_end = placement.get("end", t_start + 1.0)
                t_vol = placement.get("volume", 0.3)
                
                # Try multiple path resolutions
                sfx_file = os.path.join(output_dir, t_track)
                if not os.path.exists(sfx_file):
                    sfx_file = os.path.join(output_dir, "music", t_track)
                if not os.path.exists(sfx_file):
                    sfx_file = os.path.join(output_dir, "music", os.path.basename(t_track))
                
                if os.path.exists(sfx_file):
                    try:
                        sfx_clip = AudioFileClip(sfx_file)
                        play_duration = max(0.1, t_end - t_start)
                        if sfx_clip.duration > play_duration:
                            sfx_clip = sfx_clip.subclipped(0, play_duration)
                        sfx_clip = sfx_clip.with_volume_scaled(t_vol)
                        if t_start > 0:
                            sfx_clip = sfx_clip.with_start(t_start)
                        audio_sources.append(sfx_clip)
                        print(f"Mixed custom SFX: {sfx_file} [{t_start}s-{t_end}s] @ vol={t_vol}")
                    except Exception as e:
                        print(f"Failed to mix custom SFX '{sfx_file}': {e}")
        else:
            sfx_tracks = sfx_plan.get("tracks", [])
            if not sfx_tracks:
                effect_tracks = sfx_plan.get("effect_tracks", [])
                if not effect_tracks and sfx_plan.get("effect_track"):
                    effect_tracks = [sfx_plan["effect_track"]]
                fallback_volume = sfx_plan.get("volume", 0.3)
                sfx_tracks = [{"track": t, "volume": fallback_volume} for t in effect_tracks]
            
            # Use stock swoosh as absolute fallback
            if not sfx_tracks:
                default_sfx = "music/whip-swoosh.wav" if vibe == "gym" else ("music/fry_sizzle.wav" if vibe == "cooking" else "music/swoosh_soft.wav")
                sfx_tracks = [{"track": default_sfx, "volume": sfx_plan.get("volume", 0.3)}]

            for track_entry in sfx_tracks:
                sfx_track_rel = track_entry.get("track", "")
                sfx_vol = track_entry.get("volume", 0.3)
                sfx_file = os.path.join(output_dir, sfx_track_rel)
                if not os.path.exists(sfx_file):
                    sfx_file = os.path.join(output_dir, "music", sfx_track_rel)
                if not os.path.exists(sfx_file):
                    sfx_file = os.path.join(output_dir, "music", os.path.basename(sfx_track_rel))
                    
                if os.path.exists(sfx_file):
                    try:
                        sfx_clip = AudioFileClip(sfx_file)
                        sfx_clip = sfx_clip.with_volume_scaled(sfx_vol)
                        for t_placement in sfx_plan.get("placements", []):
                            if t_placement < final_video.duration:
                                audio_sources.append(sfx_clip.with_start(t_placement))
                        print(f"Mixed SFX track: {sfx_file} @ vol={sfx_vol}")
                    except Exception as e:
                        print(f"Failed to mix SFX '{sfx_file}': {e}")
                        
        if audio_sources and len(audio_sources) > 1:
            final_video = final_video.with_audio(CompositeAudioClip(audio_sources))
        elif audio_sources and len(audio_sources) == 1:
            final_video = final_video.with_audio(audio_sources[0])

    # Build dynamic timeline details reflecting actual cuts and color grades
    clip_segments = []
    current_time = 0.0
    for idx, scene in enumerate(scenes):
        is_filler = "ImageClip" in str(type(scene)) or "ColorClip" in str(type(scene))
        clip_segments.append({
            "name": f"Scene {idx+1}: " + ("Stock Overlay" if is_filler else "Raw Footage"),
            "start": float(round(current_time, 1)),
            "end": float(round(current_time + scene.duration, 1)),
            "color": "var(--color-warning)" if is_filler else "var(--color-primary)"
        })
        current_time += scene.duration
        
    transition_times = []
    curr = 0.0
    for scene in scenes[:-1]:
        curr += scene.duration
        transition_times.append(float(round(curr, 1)))
        
    audio_beats = music_plan.get("beats", [])
    if not audio_beats:
        for time_beat in np.arange(0.0, final_video.duration, 1.25):
            audio_beats.append(float(round(time_beat, 1)))

    # Save to dynamic timeline_data.json
    timeline_dataset = {
        "active_vibe": vibe_val,
        "missing_shot_action": action_val,
        "video_duration": final_video.duration,
        "video_clips": clip_segments,
        "transitions": transition_times,
        "audio_beats": audio_beats
    }
    with open(timeline_data_path, "w", encoding="utf-8") as f:
        json.dump(timeline_dataset, f, indent=4)

    # Write video output
    output_fps = 10 if final_video.duration > 30.0 else 15
    final_video = final_video.with_fps(output_fps)
    
    # Progress Logger
    from proglog import ProgressBarLogger
    class SSEProgressLogger(ProgressBarLogger):
        def __init__(self):
            super().__init__()
            self.last_pct = -1
            
        def callback(self, **changes):
            for bar_name, bar in self.bars.items():
                if bar['total'] > 0:
                    pct = int(100 * bar['index'] / bar['total'])
                    if pct != self.last_pct:
                        self.last_pct = pct
                        if progress_callback:
                            try:
                                progress_callback(pct)
                            except Exception:
                                pass
                                
    custom_logger = SSEProgressLogger()
    
    final_video.write_videofile(
        output_path,
        codec="libx264",
        audio=True,
        audio_codec="aac",
        temp_audiofile=os.path.join(output_dir, "temp-audio.m4a"),
        remove_temp=True,
        preset="ultrafast",
        threads=4,
        logger=custom_logger
    )
    
    # Close clips
    for s in scenes:
        try:
            s.close()
        except Exception:
            pass
    final_video.close()

    # Close valid raw video handles to prevent file lock
    for clip in valid_video_clips:
        try:
            clip.close()
        except Exception:
            pass

    return {
        "video_url": "/static/edited_output.mp4",
        "subtitles_url": "/static/subtitles.vtt",
        "duration": final_video.duration
    }

def write_subtitles(filepath, json_filepath, total_duration, missing_shot_action, vibe, raw_paths):
    """
    Writes WebVTT and JSON subtitles.
    Attempts to transcribe the raw video clip using SpeechRecognition.
    Falls back to vibe-based creative subtitles if transcription fails or no voice is found.
    """
    captions = []
    
    # Try transcription first
    if raw_paths:
        for path in raw_paths:
            ext = path.lower().split('.')[-1]
            if ext in ['png', 'jpg', 'jpeg', 'webp', 'gif']:
                continue
            if os.path.exists(path) and os.path.getsize(path) > 0:
                print(f"Attempting speech recognition on raw video: {path}")
                captions = transcribe_video_audio(path)
                if captions:
                    print(f"Successfully transcribed {len(captions)} speech caption segments.")
                    break
                else:
                    print("No voice speech recognized in raw video.")
                    
    # Fallback to vibe-based subtitles if transcription yielded no results
    if not captions:
        print("Using vibe-based creative fallback subtitles.")
        is_skipped = (missing_shot_action == "skip")
        phrases = {}
        if vibe == "cooking":
            phrases = {
                "scene1": ["Welcome to this creative cooking guide.", "Working with fresh ingredients today."],
                "scene2": ["Make sure to slice everything evenly.", "Prep work is the key to success."],
                "scene3": ["Stir the heat and let the pan sizzle.", "Let the flavors blend together."],
                "scene4": ["Time to plate it fresh with style.", "Bon Appetit! Enjoy every single bite."]
            }
        elif vibe == "tech":
            phrases = {
                "scene1": ["Starting up the developer workspace.", "Initializing core configurations on screen."],
                "scene2": ["Now we write clean modular code.", "Resolving dependency graphs."],
                "scene3": ["Type keyboard rapidly to compile.", "Checking log outputs for success."],
                "scene4": ["Deploying the project to production.", "Like and subscribe for more tech walkthroughs."]
            }
        elif vibe == "gym":
            phrases = {
                "scene1": ["Focus entirely on your target goal.", "No excuses, show up every day."],
                "scene2": ["Prepare your mind for the lift.", "The body will follow your focus."],
                "scene3": ["Strap in and secure the wrist wraps.", "Lock the weights into position."],
                "scene4": ["Push your absolute limits to the max.", "Become unstoppable. Stay disciplined."]
            }
        else:
            phrases = {
                "scene1": ["Welcome back to another vlog.", "Today we are editing raw clips."],
                "scene2": ["Slicing scenes and placing timeline blocks.", "Adding transitions to smooth it out."],
                "scene3": ["Mixing backing tracks and visuals.", "Syncing beats to matching cuts."],
                "scene4": ["Thanks for watching this edit walkthrough.", "Make sure to like and subscribe!"]
            }
            
        seg = total_duration / 4
        scenes_times = [
            {"start": 0.0, "end": seg, "textList": phrases["scene1"]},
            {"start": seg, "end": seg * 2, "textList": phrases["scene2"]}
        ]
        if not is_skipped and missing_shot_action is not None:
            scenes_times.append({"start": seg * 2, "end": seg * 3, "textList": phrases["scene3"]})
            scenes_times.append({"start": seg * 3, "end": total_duration, "textList": phrases["scene4"]})
        else:
            scenes_times.append({"start": seg * 2, "end": total_duration, "textList": phrases["scene4"]})
            
        for sc in scenes_times:
            sc_len = sc["end"] - sc["start"]
            for idx, text in enumerate(sc["textList"]):
                word_count = len(text.split())
                cap_duration = max(1.2, word_count * 0.45)
                cap_start = sc["start"] + (0.5 if idx == 0 else (sc_len / 2.0) + 0.5)
                
                if cap_start + cap_duration > sc["end"]:
                    cap_duration = sc["end"] - cap_start
                    
                if cap_duration >= 0.8:
                    captions.append({
                        "start": float(round(cap_start, 1)),
                        "end": float(round(cap_start + cap_duration, 1)),
                        "text": text
                    })
                    
    # Write WebVTT file
    vtt_content = "WEBVTT\n\n"
    for idx, cap in enumerate(captions):
        def format_vtt_time(seconds):
            h = int(seconds // 3600)
            m = int((seconds % 3600) // 60)
            s = int(seconds % 60)
            ms = int(round((seconds % 1) * 1000))
            if ms >= 1000:
                ms = 999
            return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"
            
        vtt_content += f"{idx + 1}\n"
        vtt_content += f"{format_vtt_time(cap['start'])} --> {format_vtt_time(cap['end'])}\n"
        vtt_content += f"{cap['text'].upper()}\n\n"
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(vtt_content)
        
    # Write JSON file
    with open(json_filepath, "w", encoding="utf-8") as f:
        json.dump({"active": True, "captions": captions}, f, indent=4)
