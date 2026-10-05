# 🔱 Ashtavadhani (अष्टावधानी)
### Multi-Agent Collaborative Video Synthesis Engine
**Qualcomm & HP Snapdragon AI Lab Challenge Submission | Unstop Platform**

---

## 📌 Executive Summary
**Ashtavadhani** is an edge-first, multi-agent collaborative video synthesis and zero-shot viral edit cloning engine. Inspired by the classical Indian intellectual tradition of *Ashtavadhana* — performing eight complex cognitive tasks concurrently without context loss — Ashtavadhani orchestrates a council of specialized AI agents and neural vision models to automate high-end short-form video editing directly on modern AI PCs.

By harnessing **Qualcomm Snapdragon X Elite NPU hardware acceleration** via the Qualcomm AI Hub (`qai-hub`), Ashtavadhani delivers sub-millisecond neural execution, 100% NPU compute offload, and complete on-device data sovereignty — eliminating recurring cloud AI subscription fees and ensuring creator media never leaks to remote servers.

---

## 🎯 The Problem
1. **The Creative Production Bottleneck**: Creating viral 30-second reels featuring kinetic typography, beat synchronization, and mask cutouts takes 4–8 hours of manual labor in professional NLE software (Premiere Pro, After Effects).
2. **Cloud AI Latency & Skyrocketing Costs**: Existing generative video platforms rely on centralized cloud GPUs, imposing long rendering queues, high bandwidth consumption, and recurring \$50–\$100/month subscriptions.
3. **Severe Creator Privacy Risks**: Raw personal footage, brand campaigns, and unreleased family media are exposed to third-party cloud servers.
4. **Underutilized NPU Silicon**: Modern Copilot+ AI PCs feature 45 TOPS NPUs (like the Qualcomm Snapdragon X Elite), yet 99% of creative video editing tools remain stuck on legacy CPU/GPU software rendering.

---

## 💡 The Solution: Dual-Mode Architecture

Ashtavadhani introduces a unified dual-mode architecture tailored for both narrative storytelling and precision viral replication:

### Mode 1: Standard Creative Suite (Prompt-Driven Multi-Agent Editing)
Orchestrates an **8-Agent Council** that communicates concurrently via structured JSON plans:
- **Manager Agent**: Defines timeline choreography, scene layout, and sub-agent routing.
- **Vision Agent**: Evaluates visual energy, exposure, and filters blur across raw footage.
- **Reference Agent**: Analyzes pacing curves and rhythm patterns from target reference clips.
- **Music Agent**: Performs FFT waveform profiling and tempo detection to lock cuts to beat drops.
- **SFX Agent**: Detects high-action transitions and inserts contextual audio impacts and risers.
- **Transitions Agent**: Dynamically computes directional whip-pans, zooms, and speed ramps.
- **Motion Graphics Agent**: Generates aesthetic LUT grades (Moody Phonk, Cinematic Teal/Orange, Warm Vintage).
- **Caption Agent**: Transcribes vocals word-by-word with kinetic short-form typographic animation.

### Mode 2: 3D Template Cloning Pipeline (Zero-Shot Reference Video Replication)
Deconstructs any viral Reel or TikTok and clones 100% of its timing, typography, and visual reveals using creator photos/videos:
- **Snapdragon NPU Engine**: Hardware acceleration layer verified via Qualcomm AI Hub.
- **Blueprint Analyzer**: Extracts keyframe rhythms, transition boundaries, and lyric timelines.
- **BiRefNet Portrait Matting**: Neural sub-pixel matting engine producing high-definition cutouts.
- **ISNet Masking**: Temporally tracks the subject across reference video frames.
- **Agentic Model Dispatcher**: Visual entropy router that analyzes margin hue standard deviation and Laplacian edge density to select optimal background reconstruction (Fast Plate Averaging, Fourier LaMa, or ProPainter).
- **Smart Anatomical Aligner**: Computer vision landmark eye-locking and shoulder-ratio matching to prevent uncanny distortions.
- **3D Depth Compositor**: Screen-Light kinetic typography rendering behind or in front of the creator with zero hardcoded fonts.
- **Audio Sync & Mux Engine**: Lossless AAC/MP4 multiplexing preserving rhythm and original audio.

---

## ⚡ Qualcomm Snapdragon Hardware Acceleration

Ashtavadhani is deeply integrated with the **Qualcomm AI Hub SDK (`qai-hub 0.55.0`)**:
- **Target Runtime**: Compiled for Qualcomm Hexagon NPU using `precompiled_qnn_onnx`.
- **Physical Hardware Verification**: Benchmarked on Qualcomm Snapdragon X Elite Compute Reference Device (CRD).
- **Measured Hardware Performance**:
  - 🚀 **100% NPU Compute Offload**: Zero CPU/GPU inference bottlenecks.
  - ⏱️ **0.52 ms Inference Latency**: Sub-millisecond execution per frame analysis.
  - 💾 **36.2 MB Peak Memory Footprint**: Minimal memory impact leaves RAM free for 4K video frames.
- **Resilient 3-Tier Fallback Chain**: `Snapdragon NPU (Primary) → CUDA GPU (Secondary) → Multithreaded CPU (Universal Fallback)`. The application runs universally anywhere while running exponentially faster on Snapdragon AI PCs.
- **Battery Endurance**: Hexagon NPU offloading provides 3–4x longer laptop battery life compared to power-hungry discrete GPU renderers.

---

## 🖥️ Studio Interface & Live Streaming UX
- **Real-Time SSE Streaming**: Server-Sent Events stream live terminal logs and percentage progress bars without polling.
- **Dynamic Dual-Grid UI**: Switching tabs dynamically morphs the Agent Operations Center between the 8-Agent Council and 9 Neural Models with live pulsing activity rings.
- **Interactive 2D Transform Box**: On-canvas interactive bounding box allowing creators to drag, scale, and reposition their subject in real time.
- **AI Supervisor Refinement**: Natural-language post-render adjustments (e.g., *"brighten my photo and put the text behind me"*).

---

## 📊 Market Impact & Creator Value
- **Target Audience**: 200M+ digital content creators, marketing agencies, and indie video editors.
- **Economics**: \$0/month infrastructure cost — runs 100% locally on creator hardware.
- **Speed**: 10x faster creative turnaround by eliminating cloud upload/download queues.
- **Privacy**: Zero cloud data leakage — essential for sensitive corporate and personal media.

---

## 🛠️ Technology Stack
- **AI & Computer Vision**: Qualcomm AI Hub (`qai-hub`), PyTorch, rembg, OpenCV, Faster-Whisper, Google Gemini API
- **Video & Audio Processing**: MoviePy, NumPy, SciPy, FFmpeg
- **Backend**: FastAPI (Python), Uvicorn, Server-Sent Events (SSE), Python-Dotenv
- **Frontend**: Vanilla ES6 JavaScript, HTML5 Canvas, CSS3 Glassmorphism Theme, Lucide Icons

---

## 🔗 Project Resources
- **GitHub Repository**: [https://github.com/sanyam47/ashtavadhani](https://github.com/sanyam47/ashtavadhani)
- **Challenge**: Qualcomm & HP Snapdragon AI Lab Hackathon (Unstop Platform)
- **Author**: Sanyam Asopa (`sanyam4747@gmail.com`)
