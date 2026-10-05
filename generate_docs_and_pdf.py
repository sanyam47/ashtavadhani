import os
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

base_dir = os.path.dirname(os.path.abspath(__file__))
docx_path = os.path.join(base_dir, "Ashtavadhani_Project_Description.docx")
pdf_path = os.path.join(base_dir, "Ashtavadhani_Project_Description.pdf")
logo_path = os.path.join(base_dir, "static", "logo.png")
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# ==========================================
# 1. GENERATE DOCX FILE
# ==========================================
def create_docx():
    doc = docx.Document()
    
    # Page setup
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles & Colors
    PRIMARY = RGBColor(14, 116, 144)      # Teal
    ACCENT_PURPLE = RGBColor(124, 58, 237)# Purple
    TEXT_DARK = RGBColor(15, 23, 42)       # Slate 900
    MUTED = RGBColor(100, 116, 139)        # Slate 500

    def style_run(run, font_name="Calibri", size_pt=11, bold=False, italic=False, color=TEXT_DARK):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = color

    # Header section with Logo
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False
    header_table.columns[0].width = Inches(1.4)
    header_table.columns[1].width = Inches(5.4)

    # Left Cell: Logo
    cell_logo = header_table.cell(0, 0)
    p_logo = cell_logo.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(1.2))

    # Right Cell: Title & Challenge Tag
    cell_title = header_table.cell(0, 1)
    p_sub = cell_title.paragraphs[0]
    r_sub = p_sub.add_run("QUALCOMM & HP SNAPDRAGON AI LAB CHALLENGE  |  UNSTOP PLATFORM\n")
    style_run(r_sub, size_pt=9, bold=True, color=PRIMARY)

    r_title = p_sub.add_run("ASHTAVADHANI (अष्टावधानी)\n")
    style_run(r_title, size_pt=20, bold=True, color=TEXT_DARK)

    r_sub2 = p_sub.add_run("Multi-Agent Collaborative Video Synthesis Engine\n")
    style_run(r_sub2, size_pt=12, bold=True, color=ACCENT_PURPLE)

    r_author = p_sub.add_run("Author: Sanyam Asopa (sanyam4747@gmail.com)  |  GitHub: github.com/sanyam47/ashtavadhani")
    style_run(r_author, size_pt=9.5, italic=True, color=MUTED)

    # Divider line
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_section_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        style_run(r, size_pt=13.5, bold=True, color=PRIMARY)
        return p

    def add_body_p(text, bold_prefix="", space_after=5):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            style_run(r_pre, size_pt=10.5, bold=True, color=TEXT_DARK)
        r_text = p.add_run(text)
        style_run(r_text, size_pt=10.5, color=TEXT_DARK)
        return p

    # Section 1: Executive Summary
    add_section_heading("1. Executive Summary")
    add_body_p(
        "Ashtavadhani is an edge-first, multi-agent collaborative video synthesis and zero-shot viral edit cloning engine. "
        "Inspired by the classical Indian intellectual tradition of Ashtavadhana—performing eight complex cognitive tasks concurrently "
        "without context loss—Ashtavadhani orchestrates a council of specialized AI agents and neural vision models to automate high-end "
        "short-form video editing directly on modern AI PCs.\n\n"
        "By harnessing Qualcomm Snapdragon X Elite NPU hardware acceleration via the Qualcomm AI Hub (qai-hub), Ashtavadhani delivers "
        "sub-millisecond neural execution, 100% NPU compute offload, and complete on-device data sovereignty—eliminating recurring cloud AI "
        "subscription fees and ensuring creator media never leaks to remote servers."
    )

    # Section 2: Problem Statement
    add_section_heading("2. Problem Statement")
    add_body_p("Creating a 30-second viral reel with kinetic typography, beat synchronization, and mask cutouts takes 4–8 hours in professional NLEs (Premiere, After Effects).", "• The Creative Production Bottleneck: ")
    add_body_p("Existing generative video platforms rely on centralized cloud GPUs, imposing long rendering queues, high bandwidth consumption, and recurring $50–$100/month fees.", "• Cloud AI Latency & Costs: ")
    add_body_p("Raw personal footage, gym clips, and brand assets are transmitted across third-party remote servers with zero privacy guarantees.", "• Severe Creator Privacy Risks: ")
    add_body_p("Modern Copilot+ AI PCs feature 45 TOPS NPUs (like the Qualcomm Snapdragon X Elite), yet 99% of creative video tools remain stuck on legacy CPU/GPU software rendering.", "• Underutilized NPU Silicon: ")

    # Section 3: Dual Mode Solution
    add_section_heading("3. The Solution: Dual-Mode Architecture")
    add_body_p("Ashtavadhani features a unified dual-mode architecture tailored for both open-ended creative storytelling and precision viral video replication:")

    add_body_p("Prompt-driven collaborative editing from raw clips via an 8-Agent Council communicating concurrently over structured JSON plans.", "Mode 1 — Standard Creative Suite: ")
    add_body_p("Deconstructs any viral Reel or TikTok and clones 100% of its timing, typography, and visual reveals using creator photos/videos without hardcoded fonts.", "Mode 2 — 3D Template Cloning Pipeline: ")

    # Table of Agents & Models
    tbl = doc.add_table(rows=1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(3.4)
    tbl.columns[1].width = Inches(3.4)

    hdr = tbl.rows[0]
    hdr.cells[0].paragraphs[0].add_run("Mode 1: The 8-Agent Council").bold = True
    hdr.cells[1].paragraphs[0].add_run("Mode 2: 9-Stage Neural Pipeline").bold = True
    hdr.cells[0].paragraphs[0].runs[0].font.color.rgb = PRIMARY
    hdr.cells[1].paragraphs[0].runs[0].font.color.rgb = ACCENT_PURPLE

    agents_m1 = [
        "1. Manager Agent: Timeline choreography & routing",
        "2. Vision Agent: Semantic clip inspection & quality",
        "3. Ref Analyzer: Viral pacing & pattern decoding",
        "4. Music Agent: FFT waveform profiling & beat matching",
        "5. SFX Agent: Contextual audio hits & impacts",
        "6. Transitions Agent: Dynamic zooms & speed ramps",
        "7. Motion Graphics: Vibe grading (Phonk, Teal/Orange)",
        "8. Caption Typographer: Word-level kinetic subtitles"
    ]

    models_m2 = [
        "1. Snapdragon NPU: Hardware acceleration probe",
        "2. Blueprint Analyzer: Keyframe rhythm & layout extractor",
        "3. BiRefNet Matting: Sub-pixel portrait cutout",
        "4. ISNet Masking: Temporal subject tracking across frames",
        "5. Model Dispatcher: Visual entropy background router",
        "6. LaMa Inpainting: Fourier Convolution plate synthesis",
        "7. Anatomical Aligner: Eye-locked landmark alignment",
        "8. 3D Depth Compositor: Screen-light typography depth",
        "9. Audio Sync & Mux: Lossless beat-locked AAC/MP4 delivery"
    ]

    for a1, m2 in zip(agents_m1, models_m2):
        row = tbl.add_row()
        row.cells[0].paragraphs[0].add_run(a1).font.size = Pt(9)
        row.cells[1].paragraphs[0].add_run(m2).font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Section 4: Qualcomm Snapdragon Hardware Acceleration
    add_section_heading("4. Qualcomm Snapdragon Hardware Acceleration & Benchmarks")
    add_body_p(
        "Ashtavadhani is deeply integrated with the Qualcomm AI Hub SDK (qai-hub 0.55.0), targeting the Snapdragon X Elite Hexagon NPU. "
        "Models were compiled using '--target_runtime precompiled_qnn_onnx' and profiled directly on physical Snapdragon X Elite hardware."
    )

    # Metric Table
    m_tbl = doc.add_table(rows=2, cols=3)
    m_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    m_tbl.columns[0].width = Inches(2.26)
    m_tbl.columns[1].width = Inches(2.26)
    m_tbl.columns[2].width = Inches(2.26)

    m_data = [
        ("100% NPU OFFLOAD", "0.52 ms LATENCY", "36.2 MB PEAK MEMORY"),
        ("Zero CPU/GPU inference bottleneck", "Benchmarked on Snapdragon X Elite", "Ultra-low memory footprint")
    ]
    for c_idx in range(3):
        p_top = m_tbl.rows[0].cells[c_idx].paragraphs[0]
        p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_top = p_top.add_run(m_data[0][c_idx])
        style_run(r_top, size_pt=11, bold=True, color=PRIMARY)

        p_bot = m_tbl.rows[1].cells[c_idx].paragraphs[0]
        p_bot.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_bot = p_bot.add_run(m_data[1][c_idx])
        style_run(r_bot, size_pt=8.5, color=MUTED)

    add_body_p(
        "Snapdragon NPU (Primary) → CUDA GPU (Secondary) → Multithreaded CPU (Universal Fallback). "
        "This ensures the platform runs everywhere while delivering transformative speedups on Snapdragon PCs.",
        "• Resilient 3-Tier Fallback Chain: "
    )
    add_body_p(
        "Hexagon NPU offload drastically reduces power consumption compared to discrete GPUs, enabling up to 3–4x longer battery life during intensive creative workloads.",
        "• All-Day Battery Efficiency: "
    )

    # Section 5: Algorithmic Innovations
    add_section_heading("5. Key Algorithmic Breakthroughs")
    add_body_p("Analyzes Margin Hue Standard Deviation (<5.0) and Laplacian Edge Density (<20.0) to automatically route between Fast Plate Averaging, Fourier LaMa Inpainting, and ProPainter.", "• Visual Entropy Model Dispatcher: ")
    add_body_p("Anchors users naturally in 3D frame space by matching reference eye-line heights, head centers, and shoulder widths to eliminate awkward scaling distortions.", "• Smart Anatomical Landmark Eye-Lock: ")
    add_body_p("Blends kinetic typography using Screen Light transfer modes, rendering crisp typography behind or in front of the creator with zero hardcoded fonts.", "• Screen-Light 3D Typography Compositor: ")
    add_body_p("Disk-persistent serialization caches keyframe segmentations, cutting re-render cycles from minutes to seconds.", "• Dynamic Reference Memory Cache: ")

    # Section 6: Market Impact
    add_section_heading("6. Market Potential & Creator Value")
    add_body_p("Democratizes viral video editing for 200M+ digital creators, indie filmmakers, and social marketing agencies who cannot afford full-time editors.", "• Global Creator Democratization: ")
    add_body_p("10x faster iteration speed by eliminating cloud upload queues; $0/month in recurring server API fees; 100% sovereign media privacy on local hardware.", "• Competitive Advantage: ")

    # Section 7: Tech Stack & Links
    add_section_heading("7. Technology Stack & Project Links")
    add_body_p("Qualcomm AI Hub (qai-hub), PyTorch, rembg, OpenCV, Faster-Whisper, MoviePy, NumPy, SciPy, Google Gemini API, FastAPI, ES6 Vanilla JS, HTML5 Canvas, CSS3 Glassmorphism.", "• Frameworks & Libraries: ")
    add_body_p("https://github.com/sanyam47/ashtavadhani", "• GitHub Repository: ")
    add_body_p("Qualcomm & HP Snapdragon AI Lab Hackathon (Unstop Platform)", "• Submission Event: ")

    doc.save(docx_path)
    print(f"[Success] DOCX created at: {docx_path}")

# ==========================================
# 2. GENERATE PDF FILE VIA HEADLESS EDGE
# ==========================================
def create_pdf():
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ashtavadhani - Project Description</title>
    <style>
        @page {{
            size: A4;
            margin: 18mm 18mm 18mm 18mm;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            line-height: 1.5;
            font-size: 10pt;
            background: #fff;
            margin: 0;
            padding: 0;
        }}
        .header {{
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #0e7490;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }}
        .logo {{
            width: 75px;
            height: 75px;
            object-fit: cover;
            border-radius: 8px;
        }}
        .header-text {{
            flex: 1;
        }}
        .tag {{
            font-size: 7.5pt;
            font-weight: 700;
            color: #0e7490;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 2px;
        }}
        h1 {{
            font-size: 20pt;
            font-weight: 800;
            margin: 0;
            color: #0f172a;
            letter-spacing: -0.02em;
        }}
        .subtitle {{
            font-size: 11pt;
            font-weight: 600;
            color: #7c3aed;
            margin: 2px 0 4px 0;
        }}
        .meta {{
            font-size: 8pt;
            color: #64748b;
        }}
        h2 {{
            font-size: 12pt;
            font-weight: 700;
            color: #0e7490;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin: 14px 0 6px 0;
        }}
        p {{
            margin: 0 0 6px 0;
        }}
        ul {{
            margin: 4px 0 8px 18px;
            padding: 0;
        }}
        li {{
            margin-bottom: 4px;
        }}
        .badge {{
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
        }}
        .metric-grid {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 10px 0;
        }}
        .metric-card {{
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
        }}
        .metric-val {{
            font-size: 16pt;
            font-weight: 800;
            color: #0e7490;
        }}
        .metric-lbl {{
            font-size: 8pt;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
        }}
        .metric-sub {{
            font-size: 7pt;
            color: #64748b;
        }}
        .table-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 8px 0;
        }}
        .table-col {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
        }}
        .table-col h3 {{
            margin: 0 0 6px 0;
            font-size: 9.5pt;
            color: #0e7490;
        }}
        .table-col.purple h3 {{
            color: #7c3aed;
        }}
        .table-col ol {{
            margin: 0 0 0 16px;
            padding: 0;
            font-size: 8.5pt;
        }}
        .table-col li {{
            margin-bottom: 3px;
        }}
        .footer {{
            margin-top: 16px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            font-size: 7.5pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
        }}
    </style>
</head>
<body>
    <div class="header">
        <img src="file:///{logo_path.replace(os.sep, '/')}" class="logo" alt="Logo">
        <div class="header-text">
            <div class="tag">Qualcomm & HP Snapdragon AI Lab Challenge • Unstop Platform</div>
            <h1>ASHTAVADHANI (अष्टावधानी)</h1>
            <div class="subtitle">Multi-Agent Collaborative Video Synthesis Engine</div>
            <div class="meta">
                Author: <strong>Sanyam Asopa</strong> (sanyam4747@gmail.com) &nbsp;|&nbsp; 
                GitHub: <a href="https://github.com/sanyam47/ashtavadhani" style="color:#0e7490; text-decoration:none;">github.com/sanyam47/ashtavadhani</a>
            </div>
        </div>
    </div>

    <h2>1. Executive Summary</h2>
    <p>
        <strong>Ashtavadhani</strong> is an edge-first, multi-agent collaborative video synthesis and zero-shot viral edit cloning engine. 
        Inspired by the classical Indian intellectual tradition of <em>Ashtavadhana</em>—performing eight complex cognitive tasks concurrently 
        without context loss—Ashtavadhani orchestrates a council of specialized AI agents and neural vision models to automate high-end 
        short-form video editing directly on modern AI PCs.
    </p>
    <p>
        By harnessing <strong>Qualcomm Snapdragon X Elite NPU hardware acceleration</strong> via the Qualcomm AI Hub (<code>qai-hub</code>), 
        Ashtavadhani delivers sub-millisecond neural execution, 100% NPU compute offload, and complete on-device data sovereignty—eliminating 
        recurring cloud AI subscription fees and ensuring creator media never leaks to remote servers.
    </p>

    <h2>2. Problem Statement</h2>
    <ul>
        <li><strong>The Creative Production Bottleneck:</strong> Creating viral 30-second reels featuring kinetic typography, beat synchronization, and mask cutouts takes 4–8 hours of manual labor in professional NLE software (Premiere Pro, After Effects).</li>
        <li><strong>Cloud AI Latency & Skyrocketing Costs:</strong> Existing generative video platforms rely on centralized cloud GPUs, imposing long rendering queues, high bandwidth consumption, and recurring $50–$100/month subscriptions.</li>
        <li><strong>Severe Creator Privacy Risks:</strong> Raw personal footage, brand campaigns, and unreleased family media are exposed to third-party cloud servers.</li>
        <li><strong>Underutilized NPU Silicon:</strong> Modern Copilot+ AI PCs feature 45 TOPS NPUs (like the Qualcomm Snapdragon X Elite), yet 99% of creative video editing tools remain stuck on legacy CPU/GPU software rendering.</li>
    </ul>

    <h2>3. The Solution: Dual-Mode Architecture</h2>
    <p>Ashtavadhani features a unified dual-mode architecture tailored for both narrative storytelling and precision viral replication:</p>

    <div class="table-grid">
        <div class="table-col">
            <h3>Mode 1: The 8-Agent Council</h3>
            <ol>
                <li><strong>Manager Agent:</strong> Scope & timeline choreography</li>
                <li><strong>Vision Agent:</strong> Semantic clip inspection & quality scoring</li>
                <li><strong>Ref Analyzer:</strong> Viral rhythm & pacing pattern extraction</li>
                <li><strong>Music Agent:</strong> FFT audio wave profiling & beat drop sync</li>
                <li><strong>SFX Agent:</strong> Contextual sound hits, whooshes & impacts</li>
                <li><strong>Transitions Agent:</strong> Dynamic directional whip-pans & zooms</li>
                <li><strong>Motion Graphics:</strong> Vibe grading (Phonk, Teal/Orange LUTs)</li>
                <li><strong>Caption Typographer:</strong> Word-level kinetic subtitles</li>
            </ol>
        </div>
        <div class="table-col purple">
            <h3>Mode 2: 9-Stage Neural Pipeline</h3>
            <ol>
                <li><strong>Snapdragon NPU:</strong> Hardware acceleration verification</li>
                <li><strong>Blueprint Analyzer:</strong> Keyframe rhythm & typography timing</li>
                <li><strong>BiRefNet Matting:</strong> Sub-pixel portrait subject cutout</li>
                <li><strong>ISNet Masking:</strong> Temporal subject tracking across frames</li>
                <li><strong>Model Dispatcher:</strong> Visual entropy background routing</li>
                <li><strong>LaMa Inpainting:</strong> Fourier Convolution plate synthesis</li>
                <li><strong>Anatomical Aligner:</strong> Eye-locked landmark alignment</li>
                <li><strong>3D Depth Compositor:</strong> Screen-light typography depth</li>
                <li><strong>Audio Sync & Mux:</strong> Lossless beat-locked AAC/MP4 delivery</li>
            </ol>
        </div>
    </div>

    <h2>4. Qualcomm Snapdragon Hardware Acceleration & Benchmarks</h2>
    <p>
        Ashtavadhani is deeply integrated with the <strong>Qualcomm AI Hub SDK (<code>qai-hub 0.55.0</code>)</strong>. 
        Models were compiled using <code>--target_runtime precompiled_qnn_onnx</code> and validated on physical Snapdragon X Elite hardware.
    </p>

    <div class="metric-grid">
        <div class="metric-card">
            <div class="metric-val">100% NPU</div>
            <div class="metric-lbl">Compute Offload</div>
            <div class="metric-sub">Zero CPU/GPU inference bottleneck</div>
        </div>
        <div class="metric-card">
            <div class="metric-val">0.52 ms</div>
            <div class="metric-lbl">Inference Latency</div>
            <div class="metric-sub">Benchmarked on Snapdragon X Elite CRD</div>
        </div>
        <div class="metric-card">
            <div class="metric-val">36.2 MB</div>
            <div class="metric-lbl">Peak Memory Footprint</div>
            <div class="metric-sub">Ultra-low footprint leaves RAM free</div>
        </div>
    </div>

    <ul>
        <li><strong>Resilient 3-Tier Fallback Chain:</strong> <code>Snapdragon NPU (Primary) &rarr; CUDA GPU (Secondary) &rarr; Multithreaded CPU (Universal Fallback)</code>. Runs universally while delivering exponential speedups on Snapdragon PCs.</li>
        <li><strong>All-Day Battery Efficiency:</strong> Hexagon NPU offloading extends laptop battery life up to 3–4x compared to power-hungry discrete GPU renderers.</li>
    </ul>

    <h2>5. Key Algorithmic Breakthroughs</h2>
    <ul>
        <li><strong>Visual Entropy Model Dispatcher:</strong> Dynamically analyzes Margin Hue Std-Dev and Laplacian Edge Density to route between Fast Plate Averaging, Fourier LaMa Inpainting, and ProPainter.</li>
        <li><strong>Smart Anatomical Landmark Eye-Lock:</strong> Eliminates uncanny distortions by anchoring user subjects via reference eye-lines and shoulder-width proportions.</li>
        <li><strong>Screen-Light 3D Typography Compositor:</strong> Blends kinetic typography using Screen Light transfer modes behind or in front of creators with zero hardcoded fonts.</li>
        <li><strong>Dynamic Reference Memory Cache:</strong> Serializes keyframe segmentations, cutting re-render cycles from minutes to seconds.</li>
    </ul>

    <h2>6. Market Potential & Creator Value</h2>
    <ul>
        <li><strong>Global Reach:</strong> Democratizes viral video editing for 200M+ digital creators, indie filmmakers, and marketing agencies.</li>
        <li><strong>Economic Advantage:</strong> 10x faster turnaround; $0/month in recurring server API fees; 100% sovereign media privacy on local hardware.</li>
    </ul>

    <div class="footer">
        <span>Ashtavadhani • Qualcomm & HP Snapdragon AI Lab Challenge</span>
        <span>Repository: https://github.com/sanyam47/ashtavadhani</span>
    </div>
</body>
</html>
"""
    temp_html_path = os.path.join(base_dir, "temp_project_description.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}",
        "--no-pdf-header-footer",
        temp_html_path
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)
    print(f"[Success] PDF created at: {pdf_path}")

if __name__ == "__main__":
    create_docx()
    create_pdf()
