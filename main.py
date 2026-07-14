import os
import json
import asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables (e.g. GEMINI_API_KEY)
load_dotenv()

# Import our custom agents and editor pipeline
from agents import run_agent_workflow, classify_vibe, get_remaining_gemini_credits
from editor_pipeline import assemble_edit

app = FastAPI(title="Agentic AI Video Editor Backend")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    cleaned_errors = []
    for err in exc.errors():
        c_err = dict(err)
        if "ctx" in c_err:
            # Convert context dictionary values to string representations to avoid serialization issues
            c_err["ctx"] = {k: str(v) for k, v in c_err["ctx"].items()}
        cleaned_errors.append(c_err)
    err_msg = str(cleaned_errors)
    print("VALIDATION ERROR:", err_msg)
    return JSONResponse(
        status_code=422,
        content={"detail": cleaned_errors, "status": "error", "message": err_msg}
    )

# Shared memory state for the current editing job
job_state = {
    "raw_files": [],
    "ref_file": "",
    "prompt": "",
    "vibe": "generic",
    "missing_item": "cinematic detail b-roll shot",
    "missing_shot_action": None,
    "copyright_action": None,
    "status": "idle",
    "custom_music_files": [],    # List of uploaded music filenames
    "custom_sfx_files": [],      # List of uploaded SFX filenames
    "custom_photo_files": [],    # List of uploaded photo filenames
    "text_overlays": [],          # List of {text, start, end, position, style}
    "default_music_volume": 0.15,
    "default_sfx_volume": 0.30,
    "music_config": [],
    "sfx_config": [],
    "ai_credits": 5
}

def clear_compiled_and_plan_files():
    for f in ["static/creative_plan.json", "static/music_plan.json", "static/sfx_plan.json", "static/transitions_plan.json",
              "static/graphics_plan.json", "static/subtitles.json", "static/subtitles.vtt",
              "static/text_overlays.json", "static/timeline_data.json", "static/edited_output.mp4",
              "static/gemini_usage.json"]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pre-download backing music and sfx once on server startup
import urllib.request
music_dir = "static/music"
os.makedirs(music_dir, exist_ok=True)

library_assets = {
    "backing_music.mp3": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "gym_phonk.mp3": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "lofi_chill.mp3": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "whip-swoosh.wav": "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav",
    "swoosh_soft.wav": "https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav",
    "fry_sizzle.wav": "https://assets.mixkit.co/active_storage/sfx/2437/2437-84.wav",
    "cyber_beep.wav": "https://assets.mixkit.co/active_storage/sfx/1657/1657-84.wav",
    "impact_boom.wav": "https://assets.mixkit.co/active_storage/sfx/2598/2598-84.wav"
}

for name, url in library_assets.items():
    filepath = os.path.join(music_dir, name)
    if not os.path.exists(filepath):
        try:
            print(f"Pre-downloading offline asset: {name}...")
            if name.endswith(".wav"):
                # Download via yt-dlp using imageio_ffmpeg
                import imageio_ffmpeg
                import subprocess
                ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
                # search for a short version of this sound effect
                s_name = name.replace(".wav", "").replace("-", " ").replace("_", " ")
                search_query = f"ytsearch1:{s_name} sound effect short"
                cmd = [
                    "python", "-m", "yt_dlp",
                    search_query,
                    "-x",
                    "--audio-format", "wav",
                    "-o", filepath,
                    "--ffmpeg-location", ffmpeg_path,
                    "--match-filter", "duration < 15",
                    "--force-overwrites"
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                # backing tracks are fine via direct soundhelix mp3 link
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                data = urllib.request.urlopen(req).read()
                with open(filepath, "wb") as f:
                    f.write(data)
            print(f"Asset {name} downloaded successfully.")
        except Exception as e:
            print(f"Failed to pre-download asset {name}: {e}")

# Mount the static directory so the HTML/CSS/JS frontend and output video files are served
app.mount("/static", StaticFiles(directory="static"), name="static")

from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
async def get_landing_page():
    with open("index.html", encoding="utf-8") as f:
        return f.read()

@app.get("/dashboard", response_class=HTMLResponse)
async def get_dashboard():
    with open("static/index.html", encoding="utf-8") as f:
        return f.read()

@app.post("/api/upload")
async def upload_files(
    prompt: str = Form(...),
    raw_clips: list[UploadFile] = File(...),
    ref_clip: UploadFile | None = File(None),
    music_files: list[UploadFile] = File(default=[]),
    sfx_files: list[UploadFile] = File(default=[]),
    photo_files: list[UploadFile] = File(default=[]),
    text_overlays_json: str = Form(default="[]"),
    default_music_volume: float = Form(default=0.15),
    default_sfx_volume: float = Form(default=0.30),
    music_config_json: str = Form(default="[]"),
    sfx_config_json: str = Form(default="[]")
):
    try:
        clear_compiled_and_plan_files()
        
        job_state["raw_files"] = []
        job_state["custom_music_files"] = []
        job_state["custom_sfx_files"] = []
        job_state["custom_photo_files"] = []
        job_state["text_overlays"] = []
        job_state["default_music_volume"] = default_music_volume
        job_state["default_sfx_volume"] = default_sfx_volume
        
        try:
            m_conf = json.loads(music_config_json)
            job_state["music_config"] = m_conf if isinstance(m_conf, list) else []
        except Exception:
            job_state["music_config"] = []
            
        try:
            s_conf = json.loads(sfx_config_json)
            job_state["sfx_config"] = s_conf if isinstance(s_conf, list) else []
        except Exception:
            job_state["sfx_config"] = []
        
        # Save raw clips
        for clip in raw_clips:
            if clip.filename:
                file_path = os.path.join(UPLOAD_DIR, clip.filename)
                with open(file_path, "wb") as f:
                    content = await clip.read()
                    f.write(content)
                job_state["raw_files"].append(clip.filename)
        
        # Save reference clip if provided
        if ref_clip and ref_clip.filename:
            ref_path = os.path.join(UPLOAD_DIR, ref_clip.filename)
            with open(ref_path, "wb") as f:
                content = await ref_clip.read()
                f.write(content)
            job_state["ref_file"] = ref_clip.filename
        else:
            job_state["ref_file"] = ""
        
        # Save multiple music files
        for mf in music_files:
            if mf and mf.filename:
                fname = f"music_{mf.filename}"
                with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
                    f.write(await mf.read())
                job_state["custom_music_files"].append(fname)
        
        # Save multiple SFX files
        for sf in sfx_files:
            if sf and sf.filename:
                fname = f"sfx_{sf.filename}"
                with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
                    f.write(await sf.read())
                job_state["custom_sfx_files"].append(fname)
        
        # Save multiple photo files
        for pf in photo_files:
            if pf and pf.filename:
                fname = f"photo_{pf.filename}"
                with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
                    f.write(await pf.read())
                job_state["custom_photo_files"].append(fname)
        
        # Parse text overlays JSON from frontend
        try:
            overlays = json.loads(text_overlays_json)
            job_state["text_overlays"] = overlays if isinstance(overlays, list) else []
        except Exception:
            job_state["text_overlays"] = []
        
        # Save text overlays JSON to disk for frontend to consume
        with open("static/text_overlays.json", "w") as f:
            json.dump(job_state["text_overlays"], f)
        
        job_state["prompt"] = prompt
        job_state["missing_shot_action"] = None
        job_state["copyright_action"] = None
        job_state["status"] = "analyzing"
        
        # Classify the vibe and determine if anything is missing
        vibe, missing_item = classify_vibe(prompt, job_state["raw_files"])
        job_state["vibe"] = vibe
        job_state["missing_item"] = missing_item
        
        return {
            "status": "success",
            "message": "Files uploaded successfully. Initiating agent analysis workflow.",
            "data": {
                "vibe": vibe,
                "missing_item": missing_item,
                "music_count": len(job_state["custom_music_files"]),
                "sfx_count": len(job_state["custom_sfx_files"]),
                "photo_count": len(job_state["custom_photo_files"]),
                "text_overlay_count": len(job_state["text_overlays"])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resolve")
async def resolve_discrepancy(action: str = Form(...)):
    """
    Receives user choice (upload, generate, skip, continue) to resolve missing shot or copyright discrepancies.
    """
    if action not in ["upload", "generate", "skip", "continue"]:
        raise HTTPException(status_code=400, detail="Invalid resolution action.")
    
    if job_state["status"] != "awaiting_resolution":
        pass

    if action == "continue":
        job_state["copyright_action"] = "continue"
        job_state["status"] = "compiling"
    elif action == "upload":
        job_state["copyright_action"] = "upload"
        job_state["status"] = "idle"
    else:
        job_state["missing_shot_action"] = action
        job_state["status"] = "compiling"
    
    return {
        "status": "success",
        "action": action,
        "message": f"Action '{action}' registered. Resuming agent compile flow."
    }

@app.get("/api/stream-logs")
async def stream_logs():
    """
    Server-Sent Events (SSE) endpoint to stream real-time logs from the multi-agent system.
    """
    async def log_generator():
        # Step 1: Run Phase 1 of Agent Workflow (up to discrepancy block)
        # If action is already present, run the whole thing
        action = job_state["missing_shot_action"]
        cop_action = job_state["copyright_action"]
        
        free_mode = get_remaining_gemini_credits() <= 0
        import agents
        orig_key = agents.GEMINI_KEY
        if free_mode:
            agents.GEMINI_KEY = ""
        else:
            agents.GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
        
        try:
            log_iterator = run_agent_workflow(
                job_state["raw_files"],
                job_state["ref_file"],
                job_state["prompt"],
                action,
                job_state["custom_music_files"],
                job_state["custom_sfx_files"],
                job_state["custom_photo_files"],
                job_state.get("default_music_volume", 0.15),
                job_state.get("default_sfx_volume", 0.30),
                job_state.get("music_config", []),
                job_state.get("sfx_config", []),
                copyright_action=cop_action,
                free_mode=free_mode
            )
            
            for log in log_iterator:
                yield f"data: {json.dumps(log)}\n\n"
                await asyncio.sleep(0.01) # Yield control back to event loop
                
                # Check if this log suspends execution (missing shot or copyright)
                if log["message"].startswith("Execution suspended"):
                    job_state["status"] = "awaiting_resolution"
                    return
                if log["message"].startswith("Copyright suspension"):
                    job_state["status"] = "awaiting_resolution"
                    return
        finally:
            import agents
            agents.GEMINI_KEY = orig_key
        
        # If we reached the end of log_iterator, editing has compiled
        try:
            # If no action is selected (e.g. no reference was uploaded), default compile action to 'skip'
            compile_action = action if action else "skip"
            
            # Setup threadsafe progress queue
            progress_queue = asyncio.Queue()
            loop = asyncio.get_running_loop()
            
            def progress_callback(pct):
                # Threadsafe put into queue
                loop.call_soon_threadsafe(progress_queue.put_nowait, pct)
            
            # Parse selective keywords from prompt to execute dynamic rendering skips
            prompt_lower = job_state["prompt"].lower()
            selective_keywords = ["bg", "music", "song", "audio", "soundtrack", "sound",
                                  "caption", "subtitle", "text", "typography", "vtt",
                                  "transition", "cut", "pan", "zoom", "fade", "whip",
                                  "effect", "graphics", "motion", "fx", "neon", "filter",
                                  "broll", "b-roll", "stock", "footage", "clip", "generate"]
            is_selective = any(x in prompt_lower for x in selective_keywords)
            
            if is_selective:
                run_music = any(x in prompt_lower for x in ["music", "song", "soundtrack", "bgm", "background music"])
                run_sfx = any(x in prompt_lower for x in ["sfx", "sound", "foley", "beep", "swoosh", "audio effect", "sound effect"])
                run_caption = any(x in prompt_lower for x in ["caption", "subtitle", "sub", "text", "lyrics", "words", "speech", "transcribe"])
                run_transitions = any(x in prompt_lower for x in ["transition", "cut", "zoom", "pan", "fade", "whip", "dissolve", "glide", "crossfade"])
                run_graphics = any(x in prompt_lower for x in ["graphics", "effect", "filter", "grade", "color", "vibe", "neon", "glow", "aesthetic"])
                run_stock = any(x in prompt_lower for x in ["stock", "footage", "broll", "b-roll", "generate", "filler", "clip"])
            else:
                run_music = True
                run_sfx = True
                run_caption = True
                run_transitions = True
                run_graphics = True
                run_stock = True
                
            # Run the heavy MoviePy compilation in a background thread to prevent blocking FastAPI event loop
            import time as pytime
            compile_task = loop.run_in_executor(
                None,  # Default thread pool executor
                assemble_edit,
                job_state["raw_files"],
                compile_action,
                progress_callback,
                "moody_phonk",
                "static",
                run_music,
                run_sfx,
                run_caption,
                run_transitions,
                run_graphics,
                run_stock,
                job_state["vibe"]
            )
            
            # Stream progress percentage logs over SSE
            while not compile_task.done() or not progress_queue.empty():
                try:
                    pct = await asyncio.wait_for(progress_queue.get(), timeout=0.1)
                    progress_log = {
                        "timestamp": pytime.time(),
                        "agent": "Editor Agent",
                        "role": "Video Compilation & Rendering Engine",
                        "message": f"Writing output video to disk... {pct}% complete.",
                        "level": "INFO"
                    }
                    yield f"data: {json.dumps(progress_log)}\n\n"
                except asyncio.TimeoutError:
                    continue
            
            # Retrieve compiler result to raise exceptions if any occurred
            await compile_task
            
            job_state["status"] = "completed"
            # Send a completion event so the frontend knows to update the player
            completion_log = {
                "timestamp": pytime.time(),
                "agent": "System",
                "role": "Server Deployment",
                "message": "VIDEO_COMPILE_SUCCESSFUL",
                "level": "SUCCESS"
            }
            yield f"data: {json.dumps(completion_log)}\n\n"
        except Exception as e:
            error_log = {
                "timestamp": 0,
                "agent": "System",
                "role": "Server Deployment",
                "message": f"Video compilation failed: {str(e)}",
                "level": "ERROR"
            }
            yield f"data: {json.dumps(error_log)}\n\n"

    return StreamingResponse(log_generator(), media_type="text/event-stream")

@app.post("/api/save-subtitles")
async def save_subtitles(payload: dict):
    captions = payload.get("captions", [])
    subtitles_path = "static/subtitles.vtt"
    subtitles_json_path = "static/subtitles.json"
    
    # Save JSON file
    with open(subtitles_json_path, "w", encoding="utf-8") as f:
        json.dump({"active": True, "captions": captions}, f, indent=4)
        
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
        
    with open(subtitles_path, "w", encoding="utf-8") as f:
        f.write(vtt_content)
        
    return {"status": "success", "message": "Subtitles saved successfully."}

@app.post("/api/reprompt")
async def reprompt_job(payload: dict):
    """
    Allows the user to re-run the agent pipeline with a new prompt
    while reusing all currently uploaded assets, but updating audio config.
    """
    new_prompt = payload.get("prompt", "").strip()
    if not new_prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    if not job_state["raw_files"]:
        raise HTTPException(status_code=400, detail="No raw files available. Please upload videos first.")
    
    job_state["prompt"] = new_prompt
    job_state["missing_shot_action"] = None
    job_state["copyright_action"] = None
    job_state["status"] = "analyzing"
    
    if "default_music_volume" in payload:
        job_state["default_music_volume"] = float(payload["default_music_volume"])
    if "default_sfx_volume" in payload:
        job_state["default_sfx_volume"] = float(payload["default_sfx_volume"])
    if "music_config_json" in payload:
        try:
            job_state["music_config"] = json.loads(payload["music_config_json"])
        except Exception:
            pass
    if "sfx_config_json" in payload:
        try:
            job_state["sfx_config"] = json.loads(payload["sfx_config_json"])
        except Exception:
            pass
    
    vibe, missing_item = classify_vibe(new_prompt, job_state["raw_files"])
    job_state["vibe"] = vibe
    job_state["missing_item"] = missing_item
    
    return {
        "status": "success",
        "message": f"Reprompt accepted. Re-running agents with new instructions.",
        "data": {"vibe": vibe, "missing_item": missing_item}
    }

@app.post("/api/save-text-overlays")
async def save_text_overlays(payload: dict):
    """Saves updated text overlays from the frontend editor."""
    overlays = payload.get("overlays", [])
    job_state["text_overlays"] = overlays
    with open("static/text_overlays.json", "w", encoding="utf-8") as f:
        json.dump(overlays, f, indent=2)
    return {"status": "success", "count": len(overlays)}

@app.post("/api/save-music-plan")
async def save_music_plan(payload: dict):
    """Saves updated background music tracks timeline config (start/end/vol) from timeline."""
    music_plan_path = "static/music_plan.json"
    with open(music_plan_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return {"status": "success"}

@app.post("/api/save-sfx-plan")
async def save_sfx_plan(payload: dict):
    """Saves updated SFX timeline layout (start/end/vol) from timeline."""
    sfx_plan_path = "static/sfx_plan.json"
    with open(sfx_plan_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return {"status": "success"}

@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """Uploads a timeline backing soundtrack to static/music/ directory."""
    music_dir = "static/music"
    os.makedirs(music_dir, exist_ok=True)
    filename = "".join(c for c in file.filename if c.isalnum() or c in "._-").strip()
    filepath = os.path.join(music_dir, filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())
    return {"status": "success", "filepath": f"music/{filename}"}

@app.post("/api/reset")
async def reset_job():
    clear_compiled_and_plan_files()
    global job_state
    job_state = {
        "raw_files": [],
        "ref_file": "",
        "prompt": "",
        "vibe": "generic",
        "missing_item": "cinematic detail b-roll shot",
        "missing_shot_action": None,
        "status": "idle",
        "custom_music_files": [],
        "custom_sfx_files": [],
        "custom_photo_files": [],
        "text_overlays": [],
        "default_music_volume": 0.15,
        "default_sfx_volume": 0.30,
        "music_config": [],
        "sfx_config": [],
        "ai_credits": 5
    }
    return {"status": "success", "message": "Job state reset."}

@app.get("/api/status")
async def get_status():
    """
    Returns the current job state so the frontend can restore UI on page refresh.
    """
    return {
        "status": "success",
        "job_state": {
            "status": job_state["status"],
            "prompt": job_state["prompt"],
            "vibe": job_state["vibe"],
            "default_music_volume": job_state.get("default_music_volume", 0.15),
            "default_sfx_volume": job_state.get("default_sfx_volume", 0.30),
            "has_raw_files": len(job_state["raw_files"]) > 0,
            "ai_credits": get_remaining_gemini_credits()
        }
    }

# In-memory search count rate limiter by IP
# Format: {ip: {"count": X, "date": "YYYY-MM-DD"}}
ip_search_tracker = {}
freesound_key_pointer = 0

def get_rotated_freesound_key() -> str | None:
    global freesound_key_pointer
    keys = []
    # Fetch from env keys
    for k in ["FREESOUND_KEY_1", "FREESOUND_KEY_2"]:
        val = os.environ.get(k, "").strip()
        if val:
            keys.append(val)
    if not keys:
        return None
    key = keys[freesound_key_pointer % len(keys)]
    freesound_key_pointer += 1
    return key

def get_server_jamendo_key() -> str | None:
    return os.environ.get("JAMENDO_KEY", "").strip()

@app.get("/api/library/search")
async def search_library(
    q: str, 
    type: str, 
    request: Request,
    duration: str | None = None,
    vibe: str | None = None,
    x_freesound_key: str | None = Header(None, alias="X-Freesound-Key"),
    x_jamendo_key: str | None = Header(None, alias="X-Jamendo-Key")
):
    """
    Search Freesound.org for SFX or Jamendo for Music. (YouTube fallback removed).
    """
    import json
    import urllib.request
    import urllib.parse
    import datetime
    
    # Get client IP & daily quota limit
    client_ip = request.client.host if request.client else "unknown"
    today_str = datetime.date.today().isoformat()
    try:
        daily_limit = int(os.environ.get("DAILY_LIMIT_PER_IP", "20"))
    except:
        daily_limit = 20
        
    # Handle empty or * query for View All
    # Freesound doesn't support bare "*" — use empty string to browse by downloads
    raw_query = q.strip() if q else ""
    if raw_query == "*":
        raw_query = ""
    q_clean = urllib.parse.quote(raw_query)
    results = []
    
    if type == "sfx":
        active_key = get_rotated_freesound_key()
            
        if not active_key:
            return {
                "status": "error", 
                "message": "Freesound API Token is not configured on the server. Please check the server's .env file."
            }
            
        # Check rate limiting for server key
        searches_remaining = None
        user_data = ip_search_tracker.get(client_ip)
        if not user_data or user_data["date"] != today_str:
            ip_search_tracker[client_ip] = {"count": 1, "date": today_str}
            searches_remaining = daily_limit - 1
        else:
            if user_data["count"] >= daily_limit:
                return {
                    "status": "limit_reached",
                    "message": f"Daily search limit reached ({daily_limit} searches/day). Upgrade to the Premium Plan to get unlimited searches, royalty-free downloads, and AI sound synthesis."
                }
            user_data["count"] += 1
            searches_remaining = daily_limit - user_data["count"]
                
        # Build Freesound filters
        filters = []
        if duration == "short":
            filters.append("duration:[0 TO 2]")
        elif duration == "medium":
            filters.append("duration:[2.01 TO 10]")
        elif duration == "long":
            filters.append("duration:[10.01 TO 120]")
            
        if vibe and vibe != "any":
            filters.append(f"tag:{vibe}")
            
        filter_query = ""
        if filters:
            combined_filter = " ".join(filters)
            filter_query = f"&filter={urllib.parse.quote(combined_filter)}"
            
        # Search Freesound API
        try:
            url = f"https://freesound.org/apiv2/search/text/?query={q_clean}&fields=id,name,previews,duration,license,num_downloads,avg_rating,username&sort=downloads_desc&page_size=15&token={active_key}{filter_query}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req)
            data = json.loads(resp.read().decode("utf-8"))
            for item in data.get("results", []):
                lic = item.get("license", "").lower()
                # Filter out Non-Commercial (NC) and Sampling+ licenses
                if "noncommercial" not in lic and "sampling" not in lic:
                    lic_type = "CC-BY"
                    if "publicdomain/zero" in lic or "cc0" in lic:
                        lic_type = "CC0"
                    results.append({
                        "id": str(item["id"]),
                        "title": item["name"],
                        "duration": float(item["duration"]),
                        "preview_url": item["previews"]["preview-hq-mp3"],
                        "source": "freesound",
                        "downloads": item.get("num_downloads", 0),
                        "rating": round(item.get("avg_rating", 0.0), 1),
                        "username": item.get("username", "unknown"),
                        "license": lic_type
                    })
            return {"status": "success", "results": results, "searches_remaining": searches_remaining}
        except Exception as e:
            return {"status": "error", "message": f"Freesound API search failed: {str(e)}"}
            
    else: # type == "music"
        active_key = get_server_jamendo_key()
            
        if not active_key:
            return {
                "status": "error", 
                "message": "Jamendo API Client ID is not configured on the server. Please check the server's .env file."
            }
            
        # Check rate limiting for server key
        searches_remaining = None
        user_data = ip_search_tracker.get(client_ip)
        if not user_data or user_data["date"] != today_str:
            ip_search_tracker[client_ip] = {"count": 1, "date": today_str}
            searches_remaining = daily_limit - 1
        else:
            if user_data["count"] >= daily_limit:
                return {
                    "status": "limit_reached",
                    "message": f"Daily search limit reached ({daily_limit} searches/day). Upgrade to the Premium Plan to get unlimited searches, royalty-free downloads, and AI sound synthesis."
                }
            user_data["count"] += 1
            searches_remaining = daily_limit - user_data["count"]
                
        # Search Jamendo API
        try:
            url = f"https://api.jamendo.com/v3.0/tracks/?client_id={active_key}&format=json&limit=15&search={q_clean}&cc_only=true&audioformat=mp32"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req)
            data = json.loads(resp.read().decode("utf-8"))
            for item in data.get("results", []):
                results.append({
                    "id": str(item["id"]),
                    "title": item["name"] + " - " + item["artist_name"],
                    "duration": float(item["duration"]),
                    "preview_url": item["audio"], # Direct MP3 preview link
                    "source": "jamendo",
                    "license": "CC-BY", # Jamendo CC tracks generally require attribution
                    "artist_name": item.get("artist_name", "Jamendo Artist")
                })
            return {"status": "success", "results": results, "searches_remaining": searches_remaining}
        except Exception as e:
            return {"status": "error", "message": f"Jamendo API search failed: {str(e)}"}

@app.get("/api/library/stream")
async def stream_library(id: str, source: str):
    """
    Direct preview streamer (YouTube disabled).
    """
    if source == "youtube":
        raise HTTPException(status_code=400, detail="YouTube streaming is disabled for legal ToS compliance.")
    # Freesound/Jamendo use direct preview CDN URLs
    return {"status": "success", "url": id}

@app.post("/api/library/download")
async def download_library_file(payload: dict):
    """
    Download a selected sound from Freesound or Jamendo to local storage.
    """
    import urllib.request
    import uuid
    
    source = payload.get("source")
    media_type = payload.get("type", "sfx") # sfx or music
    title = payload.get("title", "downloaded_track")
    preview_url = payload.get("preview_url")
    
    if source not in ["freesound", "jamendo"]:
        raise HTTPException(status_code=400, detail=f"Source '{source}' is not supported in production.")
        
    if not preview_url:
        raise HTTPException(status_code=400, detail="Download URL is required.")
        
    # Sanitize title
    clean_title = "".join(c for c in title if c.isalnum() or c in "._- ").strip()
    clean_title = clean_title.replace(" ", "_")[:50]
    
    if not clean_title:
        clean_title = str(uuid.uuid4())[:8]
        
    ext = "wav" if media_type == "sfx" else "mp3"
    filename = f"{clean_title}.{ext}"
    music_dir = "static/music"
    os.makedirs(music_dir, exist_ok=True)
    filepath = os.path.join(music_dir, filename)
    
    try:
        req = urllib.request.Request(preview_url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req).read()
        with open(filepath, "wb") as f:
            f.write(data)
        return {"status": "success", "filepath": f"music/{filename}", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{source.capitalize()} download failed: {str(e)}")

@app.post("/api/library/generate_ai")
async def generate_ai_sound(payload: dict, x_elevenlabs_key: str | None = Header(None, alias="X-ElevenLabs-Key")):
    """
    Generate custom sound effects using ElevenLabs Text-to-Sound-Effects or local wave synthesizer.
    """
    import urllib.request
    import json
    import wave
    import struct
    import math
    import uuid
    
    prompt = payload.get("prompt", "futuristic sweep")
    duration = float(payload.get("duration", 2.0))
    
    clean_prompt = "".join(c for c in prompt if c.isalnum() or c in "._- ").strip()
    clean_prompt = clean_prompt.replace(" ", "_")[:30]
    if not clean_prompt:
        clean_prompt = str(uuid.uuid4())[:8]
        
    filename = f"ai_{clean_prompt}.wav"
    music_dir = "static/music"
    os.makedirs(music_dir, exist_ok=True)
    filepath = os.path.join(music_dir, filename)
    
    if x_elevenlabs_key and x_elevenlabs_key.strip():
        try:
            url = "https://api.elevenlabs.io/v1/sound-effects"
            headers = {
                "xi-api-key": x_elevenlabs_key,
                "Content-Type": "application/json"
            }
            body = {
                "text": prompt,
                "duration_seconds": duration,
                "prompt_influence": 0.3
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            resp = urllib.request.urlopen(req)
            data = resp.read()
            with open(filepath, "wb") as f:
                f.write(data)
            return {
                "status": "success", 
                "filepath": f"music/{filename}", 
                "filename": filename,
                "message": "Premium ElevenLabs AI sound effect generated successfully!"
            }
        except Exception as e:
            print(f"ElevenLabs API failed, falling back to local synthesis: {e}")
            pass
            
    # Local synthesis fallback
    try:
        prompt_lower = prompt.lower()
        sample_rate = 22050
        num_samples = int(duration * sample_rate)
        
        with wave.open(filepath, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            
            frames = []
            for i in range(num_samples):
                t = i / sample_rate
                
                if "laser" in prompt_lower or "zap" in prompt_lower or "shoot" in prompt_lower:
                    freq = 2000 * math.exp(-6 * t) + 100
                    val = math.sin(2 * math.pi * freq * t)
                elif "explosion" in prompt_lower or "boom" in prompt_lower or "impact" in prompt_lower:
                    freq = 80 + 300 * math.exp(-8 * t)
                    noise = math.sin(2 * math.pi * freq * t) * (1.0 - t / duration)
                    pseudo_noise = math.sin(t * t * 100000) * math.exp(-4 * t)
                    val = 0.4 * noise + 0.6 * pseudo_noise
                elif "beep" in prompt_lower or "ping" in prompt_lower or "click" in prompt_lower:
                    freq = 880 if "beep" in prompt_lower else 1500
                    val = math.sin(2 * math.pi * freq * t) * math.exp(-15 * t)
                elif "riser" in prompt_lower or "whoosh" in prompt_lower or "swoosh" in prompt_lower:
                    freq = 150 + 400 * (t / duration)
                    envelope = math.sin(math.pi * (t / duration))
                    val = math.sin(2 * math.pi * freq * t) * envelope
                else:
                    freq = 440 + 200 * math.sin(2 * math.pi * 2 * t)
                    val = math.sin(2 * math.pi * freq * t)
                    
                val = max(-1.0, min(1.0, val))
                sample = int(val * 32767)
                frames.append(struct.pack("<h", sample))
                
            wav_file.writeframes(b"".join(frames))
            
        return {
            "status": "success", 
            "filepath": f"music/{filename}", 
            "filename": filename,
            "message": "Trial mode: Local Synthesized sound generated successfully! (To unlock ElevenLabs Premium Sound Effects, add your API key in Settings)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local synthesis failed: {str(e)}")


@app.post("/api/library/generate_ai_music")
async def generate_ai_music(payload: dict):
    """
    Generate AI background music from a free-text prompt.
    Maps keywords like 'horror', 'thriller', 'romantic', 'sad', etc.
    to musical parameters. Each generation is unique (randomized seed).
    """
    import wave
    import struct
    import math
    import random
    import uuid

    prompt = payload.get("prompt", "").strip().lower()
    duration = float(payload.get("duration", 15.0))
    duration = max(5.0, min(60.0, duration))

    # ── Keyword → Vibe mapping ─────────────────────────────────────────
    KEYWORD_MAP = {
        "horror":      ["horror", "scary", "creepy", "haunted", "ghost", "demon", "nightmare", "dread", "fear"],
        "thriller":    ["thriller", "suspense", "tension", "tense", "chase", "escape", "danger", "spy", "detective"],
        "dark":        ["dark", "evil", "sinister", "villain", "ominous", "shadow", "wicked", "black"],
        "phonk":       ["phonk", "drift", "trap", "aggressive", "hard", "street", "flex"],
        "gym":         ["gym", "workout", "exercise", "training", "power", "energy", "hype", "beast", "pump"],
        "cinematic":   ["cinematic", "epic", "orchestral", "movie", "dramatic", "grand", "war", "battle", "hero", "adventure"],
        "sad":         ["sad", "sadness", "melancholy", "crying", "tears", "grief", "heartbreak", "lonely", "loss", "sorrow", "depressing"],
        "romantic":    ["romantic", "romance", "love", "wedding", "sweet", "gentle", "tender", "passion", "couple", "valentine"],
        "happy":       ["happy", "joy", "cheerful", "fun", "playful", "bright", "sunny", "smile", "positive", "celebration"],
        "lofi":        ["lofi", "lo-fi", "chill", "relax", "study", "coffee", "rainy", "night", "calm", "sleep", "focus"],
        "upbeat":      ["upbeat", "energetic", "dance", "pop", "party", "exciting", "bouncy", "fast"],
        "mystery":     ["mystery", "mysterious", "unknown", "secret", "puzzle", "investigation", "clue", "eerie", "strange"],
        "meditation":  ["meditation", "zen", "peaceful", "ambient", "nature", "breathe", "yoga", "spa", "mindful", "soft"],
        "action":      ["action", "intense", "explosive", "racing", "speed", "combat", "fight", "urgent"],
        "cooking":     ["cooking", "food", "kitchen", "recipe", "baking", "chef", "restaurant", "delicious"],
        "comedy":      ["comedy", "funny", "silly", "cartoon", "quirky", "playful", "humor", "laugh"],
    }

    # Score each vibe by how many keywords match the prompt
    vibe_scores = {}
    for vibe_name, keywords in KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in prompt)
        if score > 0:
            vibe_scores[vibe_name] = score

    # Pick best match, fallback to lofi if nothing matches
    if vibe_scores:
        vibe = max(vibe_scores, key=vibe_scores.get)
    elif prompt:
        # Generic fallback: if they typed something but no keyword matched
        vibe = "lofi"
    else:
        vibe = "lofi"

    # ── Vibe Presets ──────────────────────────────────────────────────
    VIBE_PRESETS = {
        "horror": {
            "bpm": 55, "scale": [0, 1, 3, 5, 6, 8], "root": 41,  # F dim/chromatic
            "chord_prog": [[0, 3, 6], [1, 4, 7], [0, 3, 6], [5, 8, 11]],
            "melody_octave_up": False, "bass_drive": 0.7, "percussion": False, "dark": True,
            "tremolo": True,
        },
        "thriller": {
            "bpm": 100, "scale": [0, 1, 3, 5, 6, 8, 10], "root": 45,
            "chord_prog": [[0, 3, 7], [1, 4, 8], [5, 8, 12], [0, 3, 6]],
            "melody_octave_up": True, "bass_drive": 0.75, "percussion": True, "dark": True,
            "tremolo": False,
        },
        "mystery": {
            "bpm": 70, "scale": [0, 1, 3, 5, 6, 8, 10], "root": 47,
            "chord_prog": [[0, 3, 7], [5, 8, 11], [2, 5, 9], [0, 3, 6]],
            "melody_octave_up": False, "bass_drive": 0.5, "percussion": False, "dark": True,
            "tremolo": True,
        },
        "sad": {
            "bpm": 65, "scale": [0, 2, 3, 5, 7, 8, 10], "root": 52,
            "chord_prog": [[0, 3, 7], [5, 8, 12], [3, 7, 10], [2, 5, 9]],
            "melody_octave_up": False, "bass_drive": 0.3, "percussion": False, "dark": False,
            "tremolo": False,
        },
        "romantic": {
            "bpm": 72, "scale": [0, 2, 4, 5, 7, 9, 11], "root": 55,
            "chord_prog": [[0, 4, 7], [5, 9, 12], [3, 7, 11], [7, 11, 14]],
            "melody_octave_up": True, "bass_drive": 0.3, "percussion": False, "dark": False,
            "tremolo": False,
        },
        "happy": {
            "bpm": 110, "scale": [0, 2, 4, 5, 7, 9, 11], "root": 60,
            "chord_prog": [[0, 4, 7], [5, 9, 12], [7, 11, 14], [4, 7, 11]],
            "melody_octave_up": True, "bass_drive": 0.5, "percussion": True, "dark": False,
            "tremolo": False,
        },
        "action": {
            "bpm": 160, "scale": [0, 3, 5, 7, 10], "root": 49,
            "chord_prog": [[0, 3, 7], [7, 10, 14], [5, 8, 12], [0, 3, 7]],
            "melody_octave_up": True, "bass_drive": 1.0, "percussion": True, "dark": True,
            "tremolo": False,
        },
        "meditation": {
            "bpm": 50, "scale": [0, 2, 4, 7, 9], "root": 53,
            "chord_prog": [[0, 4, 7], [2, 5, 9], [5, 9, 12], [0, 4, 7]],
            "melody_octave_up": False, "bass_drive": 0.1, "percussion": False, "dark": False,
            "tremolo": False,
        },
        "comedy": {
            "bpm": 130, "scale": [0, 2, 4, 5, 7, 9, 11], "root": 62,
            "chord_prog": [[0, 4, 7], [2, 5, 9], [5, 9, 12], [7, 11, 14]],
            "melody_octave_up": True, "bass_drive": 0.4, "percussion": True, "dark": False,
            "tremolo": False,
        },
        "phonk": {
            "bpm": 140, "scale": [0, 3, 5, 7, 10], "root": 49,
            "chord_prog": [[0, 3, 7], [0, 3, 7], [5, 8, 12], [3, 7, 10]],
            "melody_octave_up": True, "bass_drive": 0.8, "percussion": True, "dark": True,
            "tremolo": False,
        },
        "lofi": {
            "bpm": 75, "scale": [0, 2, 3, 5, 7, 8, 10], "root": 52,
            "chord_prog": [[0, 3, 7], [5, 8, 12], [3, 7, 10], [0, 3, 7]],
            "melody_octave_up": False, "bass_drive": 0.4, "percussion": True, "dark": False,
            "tremolo": False,
        },
        "cinematic": {
            "bpm": 60, "scale": [0, 2, 3, 5, 7, 8, 10], "root": 45,
            "chord_prog": [[0, 4, 7], [5, 8, 12], [7, 11, 14], [0, 4, 7]],
            "melody_octave_up": True, "bass_drive": 0.5, "percussion": False, "dark": True,
            "tremolo": False,
        },
        "upbeat": {
            "bpm": 120, "scale": [0, 2, 4, 5, 7, 9, 11], "root": 60,
            "chord_prog": [[0, 4, 7], [5, 9, 12], [7, 11, 14], [3, 7, 10]],
            "melody_octave_up": True, "bass_drive": 0.6, "percussion": True, "dark": False,
            "tremolo": False,
        },
        "dark": {
            "bpm": 90, "scale": [0, 1, 3, 5, 6, 8, 10], "root": 45,
            "chord_prog": [[0, 3, 6], [5, 8, 11], [3, 6, 9], [0, 3, 7]],
            "melody_octave_up": False, "bass_drive": 0.9, "percussion": True, "dark": True,
            "tremolo": False,
        },
        "gym": {
            "bpm": 150, "scale": [0, 3, 5, 7, 10], "root": 49,
            "chord_prog": [[0, 3, 7], [7, 10, 14], [5, 8, 12], [3, 7, 10]],
            "melody_octave_up": True, "bass_drive": 0.9, "percussion": True, "dark": True,
            "tremolo": False,
        },
        "cooking": {
            "bpm": 95, "scale": [0, 2, 4, 5, 7, 9, 11], "root": 57,
            "chord_prog": [[0, 4, 7], [5, 9, 12], [4, 7, 11], [7, 11, 14]],
            "melody_octave_up": False, "bass_drive": 0.45, "percussion": True, "dark": False,
            "tremolo": False,
        },
    }

    preset = VIBE_PRESETS.get(vibe, VIBE_PRESETS["lofi"])
    bpm = preset["bpm"]
    scale = preset["scale"]
    root_midi = preset["root"]
    chord_prog = preset["chord_prog"]
    bass_drive = preset["bass_drive"]
    has_percussion = preset["percussion"]
    is_dark = preset["dark"]
    melody_octave_up = preset["melody_octave_up"]
    tremolo = preset.get("tremolo", False)

    # ── Random seed — unique every generation ─────────────────────────
    seed = random.randint(0, 999999)
    random.seed(seed)

    music_dir = "static/music"
    os.makedirs(music_dir, exist_ok=True)
    clean_vibe = "".join(c for c in vibe if c.isalnum() or c in "_-")[:20]
    uid = str(uuid.uuid4())[:6]
    filename = f"ai_music_{clean_vibe}_{uid}.wav"
    filepath = os.path.join(music_dir, filename)

    SAMPLE_RATE = 22050
    num_samples = int(duration * SAMPLE_RATE)
    beat_duration = 60.0 / bpm
    bar_duration = beat_duration * 4

    def midi_to_freq(midi):
        return 440.0 * (2.0 ** ((midi - 69) / 12.0))

    def sine(freq, t, phase=0.0):
        return math.sin(2 * math.pi * freq * t + phase)

    def square(freq, t, duty=0.5):
        return 1.0 if (t * freq) % 1.0 < duty else -1.0

    def sawtooth(freq, t):
        return 2.0 * ((t * freq) % 1.0) - 1.0

    def triangle(freq, t):
        p = (t * freq) % 1.0
        return 4.0 * p - 1.0 if p < 0.5 else 3.0 - 4.0 * p

    def adsr(t, attack=0.01, decay=0.05, sustain=0.7, release=0.1, total=0.5):
        if t < attack:
            return t / attack
        elif t < attack + decay:
            return 1.0 - (1.0 - sustain) * (t - attack) / decay
        elif t < total - release:
            return sustain
        elif t < total:
            return sustain * (1.0 - (t - (total - release)) / release)
        return 0.0

    buf = [0.0] * num_samples

    # --- Chord layer ---
    for bar in range(int(duration / bar_duration) + 1):
        chord = chord_prog[bar % len(chord_prog)]
        chord_start = bar * bar_duration
        chord_len = bar_duration * 0.95
        for semitone in chord:
            midi = root_midi + scale[semitone % len(scale)] + (semitone // len(scale)) * 12
            freq = midi_to_freq(midi)
            for i in range(int(chord_start * SAMPLE_RATE), min(num_samples, int((chord_start + chord_len) * SAMPLE_RATE))):
                t_local = (i / SAMPLE_RATE) - chord_start
                env = adsr(t_local, 0.06, 0.1, 0.5, 0.25, chord_len)
                # Tremolo for horror/mystery
                trem = (0.5 + 0.5 * math.sin(2 * math.pi * 5 * t_local)) if tremolo else 1.0
                val = (sine(freq, i / SAMPLE_RATE) * 0.5 + triangle(freq * 0.5, i / SAMPLE_RATE) * 0.5) * env * 0.18 * trem
                buf[i] += val

    # --- Bass layer ---
    for bar in range(int(duration / bar_duration) + 1):
        chord = chord_prog[bar % len(chord_prog)]
        bass_note = root_midi + scale[chord[0] % len(scale)] - 12
        freq = midi_to_freq(bass_note)
        for beat_offset in [0, beat_duration * 2]:
            hit_start = bar * bar_duration + beat_offset
            hit_len = beat_duration * 0.8
            for i in range(int(hit_start * SAMPLE_RATE), min(num_samples, int((hit_start + hit_len) * SAMPLE_RATE))):
                t_local = (i / SAMPLE_RATE) - hit_start
                env = adsr(t_local, 0.005, 0.08, 0.3, 0.15, hit_len)
                sub = sine(freq, i / SAMPLE_RATE)
                drv = sawtooth(freq, i / SAMPLE_RATE) * bass_drive
                val = (sub * 0.6 + drv * 0.4) * env * 0.35
                buf[i] += val

    # --- Melody layer (randomized) ---
    melody_notes = []
    for bar in range(int(duration / bar_duration) + 1):
        chord = chord_prog[bar % len(chord_prog)]
        for beat in range(4):
            if random.random() > 0.35:
                note_degree = random.choice(chord)
                octave_shift = 12 if melody_octave_up else 0
                midi = root_midi + scale[note_degree % len(scale)] + (note_degree // len(scale)) * 12 + octave_shift
                note_start = bar * bar_duration + beat * beat_duration
                note_len = beat_duration * random.choice([0.5, 0.75, 1.0])
                melody_notes.append((note_start, note_len, midi))

    for (note_start, note_len, midi) in melody_notes:
        freq = midi_to_freq(midi)
        for i in range(int(note_start * SAMPLE_RATE), min(num_samples, int((note_start + note_len) * SAMPLE_RATE))):
            t_local = (i / SAMPLE_RATE) - note_start
            env = adsr(t_local, 0.01, 0.05, 0.6, 0.15, note_len)
            val = (sine(freq, i / SAMPLE_RATE) * 0.6 + square(freq, i / SAMPLE_RATE, 0.3) * 0.4) * env * 0.12
            buf[i] += val

    # --- Percussion ---
    if has_percussion:
        for bar in range(int(duration / bar_duration) + 1):
            bar_start = bar * bar_duration
            kick_times = [0, beat_duration * 2]
            snare_times = [beat_duration, beat_duration * 3]
            hihat_times = [beat_duration * k * 0.5 for k in range(8)]

            for bt in kick_times:
                t_start = bar_start + bt
                kick_len = 0.15
                for i in range(int(t_start * SAMPLE_RATE), min(num_samples, int((t_start + kick_len) * SAMPLE_RATE))):
                    t_local = (i / SAMPLE_RATE) - t_start
                    freq = 60.0 * math.exp(-30 * t_local) + 30
                    env = math.exp(-20 * t_local)
                    buf[i] += sine(freq, t_local) * env * 0.55

            for bt in snare_times:
                t_start = bar_start + bt
                snare_len = 0.08
                for i in range(int(t_start * SAMPLE_RATE), min(num_samples, int((t_start + snare_len) * SAMPLE_RATE))):
                    t_local = (i / SAMPLE_RATE) - t_start
                    noise = math.sin(t_local * 17000 + math.sin(t_local * 13000))
                    env = math.exp(-40 * t_local)
                    buf[i] += noise * env * (0.4 if is_dark else 0.25)

            for bt in hihat_times:
                t_start = bar_start + bt
                hh_len = 0.04
                for i in range(int(t_start * SAMPLE_RATE), min(num_samples, int((t_start + hh_len) * SAMPLE_RATE))):
                    t_local = (i / SAMPLE_RATE) - t_start
                    noise = math.sin(t_local * 8000 * math.sin(t_local * 5200))
                    env = math.exp(-80 * t_local)
                    buf[i] += noise * env * 0.12

    # Normalize
    peak = max(abs(s) for s in buf) if buf else 1.0
    if peak > 0:
        buf = [s / peak * 0.85 for s in buf]

    # Write WAV
    try:
        with wave.open(filepath, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(SAMPLE_RATE)
            frames = []
            for s in buf:
                sample = int(max(-1.0, min(1.0, s)) * 32767)
                frames.append(struct.pack("<h", sample))
            wav_file.writeframes(b"".join(frames))

        # Friendly detected-vibe label
        vibe_labels = {
            "horror": "Horror 👻", "thriller": "Thriller 🔪", "mystery": "Mystery 🔍",
            "sad": "Sad 😢", "romantic": "Romantic 💕", "happy": "Happy 😊",
            "action": "Action 💥", "meditation": "Meditation 🧘", "comedy": "Comedy 😄",
            "phonk": "Phonk 🔥", "lofi": "Lofi 🌙", "cinematic": "Cinematic 🎬",
            "upbeat": "Upbeat ⚡", "dark": "Dark 🌑", "gym": "Gym 💪", "cooking": "Cooking 🍳",
        }
        label = vibe_labels.get(vibe, vibe.capitalize())

        return {
            "status": "success",
            "filepath": f"music/{filename}",
            "filename": filename,
            "vibe": vibe,
            "vibe_label": label,
            "duration": duration,
            "seed": seed,
            "prompt_used": prompt or vibe,
            "message": f"{label} music synthesized ({duration:.0f}s)!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI music synthesis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("Launching Agentic AI Video Editor server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)



if __name__ == "__main__":
    import uvicorn
    # Start the server on localhost:8000
    print("Launching Agentic AI Video Editor server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
