# 🔱 Ashtavadhani (अष्टावधानी)

**Ashtavadhani** is an advanced Multi-Agent Collaborative Video Synthesis Engine. Inspired by the ancient Indian tradition of *Ashtavadhana* — performing eight complex cognitive tasks simultaneously — this platform orchestrates a distributed council of specialized AI agents and neural models to edit footage, analyze audio beats, synchronize visual transitions, align anatomy, reconstruct plates, and render production-grade outputs.

---

## 🤖 The Ashtavadhani Agent Council

### Standard Mode: Multi-Agent Creative Suite
1. **Manager Agent** – Decides creative scope, edits layout, and coordinates sub-agents.
2. **Vision Agent** – Explores clips, evaluates action intensity, and flags blur/exposure changes.
3. **Reference Agent** – Decodes edit pacing and patterns from target reference clips.
4. **Music Agent** – Profiles audio energy waves to synchronize cuts directly to beat drops.
5. **SFX Agent** – Pinpoints optimal highlights to overlay contextual sound effects (swooshes, hits).
6. **Transitions Agent** – Designs dynamic zooms, whips, and cut timing.
7. **Motion Graphics Agent** – Determines visual grades and text overlay branding styles.
8. **Caption Agent** – Automates speech-to-text transcription for kinetic subtitles.

### Template Mode: 3D Zero-Shot Reference Cloning
1. **Snapdragon NPU Acceleration Engine** – Hardware execution provider for Qualcomm Snapdragon X Elite with ONNX / CUDA / CPU fallback.
2. **Blueprint Analyzer** – Extracts kinetic timing, beat drops, and layout blueprints from viral edits.
3. **BiRefNet Portrait Matting** – High-resolution neural background cutout engine.
4. **ISNet Keyframe Masking** – Temporal subject tracker across reference frames.
5. **Agentic Model Dispatcher** – Visual entropy router selecting between fast plate averaging, LaMa, and ProPainter.
6. **LaMa Inpainting** – Fast Fourier Convolution neural background reconstruction.
7. **Smart Anatomical Aligner** – Eye-locked, shoulder-matched scale & landmark spatial alignment.
8. **3D Depth Compositor** – Screen-light kinetic typography rendering behind or in front of creators.
9. **Audio Sync & Lossless Mux** – Precision AAC/MP4 multiplexing preserving 100% original pacing.

---

## ⚡ Key Features

- **Multi-Agent Orchestration:** Dynamic JSON-based collaborative plans streaming via Server-Sent Events (SSE).
- **Mathematical Beat-Sync:** Direct audio energy wave mapping using MoviePy & NumPy.
- **Dynamic Vibe Grading:** Automatically adapts color profiles (Moody Teal/Orange, Phonk, Vintage Glow, Cyber Blue).
- **Qualcomm Snapdragon NPU Acceleration:** Cloud & on-device Hexagon NPU compilation and profiling via Qualcomm AI Hub.
- **Fail-Safe Fallback Architecture:** Automatically degrades gracefully from NPU → CUDA → Local CPU without pipeline crashes.
- **Interactive Studio UI:** Real-time progress monitoring, custom transform box, live text overlay builder, and audio track volume mixer.

---

## 🛠️ Technology Stack

- **Backend:** FastAPI, MoviePy, NumPy, OpenCV, Whisper, Google Generative AI (Gemini), rembg, PyTorch
- **Hardware Acceleration:** Qualcomm AI Hub (`qai-hub`), Qualcomm Hexagon NPU
- **Frontend:** Vanilla ES6 JavaScript, HTML5 Canvas, CSS3 Glassmorphism theme, Lucide Icons

---

## 🚀 Quick Start

### 1. Clone & Setup Environment
```bash
git clone https://github.com/sanyam47/ashtavadhani.git
cd ashtavadhani

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Credentials
Copy `.env.example` to `.env` and insert your API keys:
```bash
cp .env.example .env
```
Key configuration items:
- `GEMINI_API_KEY`: Free key from [Google AI Studio](https://aistudio.google.com/)
- `QAI_HUB_API_TOKEN`: (Optional) Qualcomm AI Hub token for NPU benchmarking

### 3. Launch Ashtavadhani
```bash
python main.py
```
Open your browser at `http://localhost:8000` to launch the Studio interface.

---

## 📜 License
This project is licensed under the Apache 2.0 License.
