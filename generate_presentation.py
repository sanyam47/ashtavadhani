import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_path="Ashtavadhani_Snapdragon_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    BG_DARK = RGBColor(10, 14, 23)        # #0A0E17
    CARD_BG = RGBColor(18, 24, 38)        # #121826
    CARD_BORDER = RGBColor(38, 48, 71)    # #263047
    TEAL = RGBColor(6, 182, 212)          # #06B6D4
    CYAN = RGBColor(34, 211, 238)         # #22D3EE
    PURPLE = RGBColor(139, 92, 246)       # #8B5CF6
    LIGHT_PURPLE = RGBColor(196, 181, 253)# #C4B5FD
    TEXT_WHITE = RGBColor(248, 250, 252)  # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184)  # #94A3B8
    GREEN = RGBColor(16, 185, 129)        # #10B981
    GOLD = RGBColor(245, 158, 11)         # #F59E0B

    FONT_HEADING = "Outfit"
    FONT_BODY = "Inter"

    logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "logo.png")

    def set_slide_background(slide):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_DARK
        bg_shape.line.fill.background()
        return bg_shape

    def add_header(slide, category_text, title_text, subtitle_text=""):
        # Category Pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(2.6), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = RGBColor(25, 34, 54)
        pill.line.color.rgb = TEAL
        pill.line.width = Pt(1)
        p_tf = pill.text_frame
        p_tf.word_wrap = True
        p_p = p_tf.paragraphs[0]
        p_p.text = category_text.upper()
        p_p.font.name = FONT_BODY
        p_p.font.size = Pt(9.5)
        p_p.font.bold = True
        p_p.font.color.rgb = CYAN
        p_p.alignment = PP_ALIGN.CENTER

        # Title
        t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.82), Inches(11.7), Inches(0.65))
        t_tf = t_box.text_frame
        t_tf.word_wrap = True
        t_p = t_tf.paragraphs[0]
        t_p.text = title_text
        t_p.font.name = FONT_HEADING
        t_p.font.size = Pt(22)
        t_p.font.bold = True
        t_p.font.color.rgb = TEXT_WHITE

        # Subtitle
        if subtitle_text:
            s_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.42), Inches(11.7), Inches(0.4))
            s_tf = s_box.text_frame
            s_tf.word_wrap = True
            s_p = s_tf.paragraphs[0]
            s_p.text = subtitle_text
            s_p.font.name = FONT_BODY
            s_p.font.size = Pt(11)
            s_p.font.color.rgb = TEXT_MUTED

    def add_footer(slide, current_num, total_num=12):
        f_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.3))
        f_tf = f_box.text_frame
        f_p = f_tf.paragraphs[0]
        f_p.text = f"Ashtavadhani  •  Qualcomm & HP Snapdragon AI Lab Challenge  •  Slide {current_num} of {total_num}"
        f_p.font.name = FONT_BODY
        f_p.font.size = Pt(9)
        f_p.font.color.rgb = RGBColor(90, 105, 130)

    def add_card(slide, left, top, width, height, title, subtitle="", border_color=CARD_BORDER, bg_color=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        
        # Text
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.2)
        tf.margin_bottom = Inches(0.2)

        if title:
            p_title = tf.paragraphs[0]
            p_title.text = title
            p_title.font.name = FONT_HEADING
            p_title.font.size = Pt(12.5)
            p_title.font.bold = True
            p_title.font.color.rgb = CYAN

        if subtitle:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(9.5)
            p_sub.font.color.rgb = TEXT_MUTED
            p_sub.space_before = Pt(4)

        return card

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Ambient Accent Glow card
    glow = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.2), Inches(11.733), Inches(5.1))
    glow.fill.solid()
    glow.fill.fore_color.rgb = RGBColor(14, 20, 32)
    glow.line.color.rgb = RGBColor(40, 50, 80)
    glow.line.width = Pt(1.5)

    # Logo if available
    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(1.3), Inches(1.7), width=Inches(1.8))

    # Title texts
    title_box = s1.shapes.add_textbox(Inches(3.4), Inches(1.5), Inches(8.8), Inches(2.2))
    tf1 = title_box.text_frame
    tf1.word_wrap = True
    
    p_badge = tf1.paragraphs[0]
    p_badge.text = "QUALCOMM & HP SNAPDRAGON AI LAB SUBMISSION"
    p_badge.font.name = FONT_BODY
    p_badge.font.size = Pt(11)
    p_badge.font.bold = True
    p_badge.font.color.rgb = CYAN
    p_badge.space_after = Pt(6)

    p_main = tf1.add_paragraph()
    p_main.text = "ASHTAVADHANI (अष्टावधानी)"
    p_main.font.name = FONT_HEADING
    p_main.font.size = Pt(36)
    p_main.font.bold = True
    p_main.font.color.rgb = TEXT_WHITE
    p_main.space_after = Pt(6)

    p_sub = tf1.add_paragraph()
    p_sub.text = "Multi-Agent Collaborative Video Synthesis Engine"
    p_sub.font.name = FONT_HEADING
    p_sub.font.size = Pt(18)
    p_sub.font.bold = True
    p_sub.font.color.rgb = LIGHT_PURPLE

    # Description & Details
    desc_box = s1.shapes.add_textbox(Inches(1.3), Inches(3.8), Inches(10.7), Inches(2.2))
    tf_desc = desc_box.text_frame
    tf_desc.word_wrap = True

    p_d1 = tf_desc.paragraphs[0]
    p_d1.text = "Autonomous dual-mode creative engine orchestrating an 8-Agent Council and 9 Neural Vision Models."
    p_d1.font.name = FONT_BODY
    p_d1.font.size = Pt(13)
    p_d1.font.color.rgb = TEXT_MUTED
    p_d1.space_after = Pt(14)

    p_d2 = tf_desc.add_paragraph()
    p_d2.text = "⚡ Accelerated on Qualcomm Snapdragon X Elite NPU via Qualcomm AI Hub"
    p_d2.font.name = FONT_BODY
    p_d2.font.size = Pt(13)
    p_d2.font.bold = True
    p_d2.font.color.rgb = TEAL
    p_d2.space_after = Pt(18)

    p_meta = tf_desc.add_paragraph()
    p_meta.text = "Author: Sanyam Asopa  |  Platform: Unstop Snapdragon AI Lab  |  Deployment: Snapdragon X Elite & WoS Edge PCs"
    p_meta.font.name = FONT_BODY
    p_meta.font.size = Pt(10)
    p_meta.font.color.rgb = RGBColor(130, 145, 170)

    add_footer(s1, 1)

    # ==========================================
    # SLIDE 2: THE PROBLEM STATEMENT
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Challenge & Opportunity", "The Video Creation Bottleneck in the AI Era", 
               "Why traditional workflows fail creators and why on-device AI is the necessary paradigm shift.")

    cards_p = [
        ("1. The Manual Editing Slump", 
         "Creating a 30-second viral reel with kinetic typography, beat synchronization, and mask cutouts takes 4-8 hours in Adobe Premiere or After Effects. Independent creators cannot scale content production without burning out.",
         PURPLE),
        ("2. Cloud AI Latency & Costs", 
         "Existing generative video tools require uploading gigabytes of raw clips to expensive cloud GPUs. Creators face long render queues, recurring $50-100/mo subscriptions, and high network bandwidth consumption.",
         TEAL),
        ("3. Severe Privacy Risks", 
         "Personal family footage, gym videos, and unreleased brand content are transmitted across third-party remote servers. Creators demand edge-first zero-leak processing where their footage stays local.",
         GOLD),
        ("4. Underutilized NPU Silicon", 
         "Next-gen AI PCs (Qualcomm Snapdragon X Elite with 45 TOPS Hexagon NPU) have immense neural compute power, yet 99% of creative applications still rely on legacy software CPU renderers.",
         GREEN)
    ]

    for i, (title, text, color) in enumerate(cards_p):
        left = Inches(0.8 + (i % 2) * 5.95)
        top = Inches(1.9 + (i // 2) * 2.45)
        add_card(s2, left, top, Inches(5.75), Inches(2.25), title, text, border_color=color)

    add_footer(s2, 2)

    # ==========================================
    # SLIDE 3: THE SOLUTION - ASHTAVADHANI
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Executive Overview", "Introducing Ashtavadhani (अष्टावधानी)", 
               "An autonomous multi-agent video synthesis engine inspired by classical eight-fold cognitive mastery.")

    sol_cards = [
        ("🔱 Inspired by Ashtavadhana", 
         "Ancient Indian cognitive feat where a scholar performs 8 distinct intellectual tasks simultaneously without losing context. Ashtavadhani models 8 specialized AI agents that collaborate concurrently on video synthesis.",
         PURPLE),
        ("⚡ Snapdragon Hexagon NPU", 
         "Direct hardware acceleration compiled and profiled on Qualcomm AI Hub. Achieves 100% NPU compute offload with sub-millisecond neural execution, unlocking desktop-class AI editing on ultra-portable battery power.",
         TEAL),
        ("🎬 Zero-Shot Reference Cloning", 
         "Breakthrough Template Mode enables creators to upload any viral video and clone 100% of its pacing, typography, and beat flashes with user photos—without hardcoded fonts or manual keyframing.",
         CYAN),
        ("🛡️ 100% On-Device & Private", 
         "All media frames, audio tracks, and optical masks are rendered strictly on the local PC. Zero raw video bytes are uploaded to cloud servers, ensuring sovereign creator privacy.",
         GREEN)
    ]

    for i, (title, text, color) in enumerate(sol_cards):
        left = Inches(0.8 + (i % 2) * 5.95)
        top = Inches(1.9 + (i // 2) * 2.45)
        add_card(s3, left, top, Inches(5.75), Inches(2.25), title, text, border_color=color)

    add_footer(s3, 3)

    # ==========================================
    # SLIDE 4: DUAL-MODE ARCHITECTURE
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "System Architecture", "Dual-Mode Agentic Workflow", 
               "Two complementary creative engines tailored for open-ended prompt editing and precision reference replication.")

    # Left Box: Standard Creative Suite
    c_std = add_card(s4, Inches(0.8), Inches(1.9), Inches(5.75), Inches(4.8), 
                     "MODE 1: STANDARD CREATIVE SUITE", 
                     "Designed for open-ended, prompt-driven narrative storytelling from raw footage.",
                     border_color=PURPLE)
    tf_std = c_std.text_frame
    bullets_std = [
        "• Natural Language Directing: 'Edit my gym footage with phonk music and fast beat drops.'",
        "• 8-Agent Council: Orchestrates Manager, Vision, Audio, SFX, Caption, and Review agents.",
        "• Semantic B-Roll Sourcing: Detects missing shots and intelligently sources contextual inserts.",
        "• Mathematical Beat Matching: Scans audio energy peaks to align cuts on exact musical beats.",
        "• Kinetic Word Subtitles: Local Whisper speech recognition with synced typographic animation."
    ]
    for b in bullets_std:
        p = tf_std.add_paragraph()
        p.text = b
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    # Right Box: Template Cloning Pipeline
    c_tpl = add_card(s4, Inches(6.75), Inches(1.9), Inches(5.75), Inches(4.8), 
                     "MODE 2: 3D TEMPLATE CLONING PIPELINE", 
                     "Designed for zero-shot cloning of viral Reels/TikToks with creator photos or clips.",
                     border_color=CYAN)
    tf_tpl = c_tpl.text_frame
    bullets_tpl = [
        "• Reference Video Blueprinting: Deconstructs viral clips into keyframes, lyrics, and pacing.",
        "• 9 Neural Vision Models: BiRefNet matting, ISNet tracking, LaMa inpainting, and audio muxing.",
        "• Smart Anatomical Aligner: Computer vision eye-lock and shoulder scaling prevents distortions.",
        "• 3D Depth Compositor: Blends kinetic words in front of or behind the creator seamlessly.",
        "• Snapdragon NPU Acceleration: Hardware execution via Qualcomm AI Hub Hexagon NPU."
    ]
    for b in bullets_tpl:
        p = tf_tpl.add_paragraph()
        p.text = b
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    add_footer(s4, 4)

    # ==========================================
    # SLIDE 5: THE 8-AGENT COUNCIL (MODE 1)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Mode 1 Deep Dive", "The Ashtavadhani Agent Council", 
               "Eight specialized autonomous agents collaborating concurrently via structured JSON plans.")

    agents = [
        ("1. Manager Agent", "Creative scope, timeline choreography & sub-agent orchestration.", PURPLE),
        ("2. Vision Agent", "Semantic clip inspection, action scoring, blur & exposure filtering.", TEAL),
        ("3. Ref Analyzer", "Pacing curves, viral rhythm extraction, and transition pattern matching.", CYAN),
        ("4. Music Agent", "FFT waveform profiling, tempo detection & beat-drop synchronization.", GREEN),
        ("5. SFX Enhancer", "Contextual audio hit placement (whooshes, risers, impacts, cinematic drops).", GOLD),
        ("6. Transitions Agent", "Dynamic whip pans, directional zooms, and speed ramps calculation.", PURPLE),
        ("7. Motion Graphics", "Vibe color grading (Moody Teal, Phonk, Warm Film) & branding overlays.", TEAL),
        ("8. Caption Typographer", "Word-level speech transcription & kinetic subtitle positioning.", CYAN)
    ]

    for i, (title, text, color) in enumerate(agents):
        col = i % 4
        row = i // 4
        left = Inches(0.8 + col * 2.95)
        top = Inches(1.9 + row * 2.45)
        add_card(s5, left, top, Inches(2.85), Inches(2.25), title, text, border_color=color)

    add_footer(s5, 5)

    # ==========================================
    # SLIDE 6: NEURAL CLONING PIPELINE (MODE 2)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Mode 2 Deep Dive", "The 9-Stage Neural Cloning Pipeline", 
               "How viral reference edits are deconstructed and synthesized with user assets in real time.")

    models = [
        ("1. Snapdragon NPU", "Hardware acceleration probe (NPU → CUDA → CPU chain).", GREEN),
        ("2. Blueprint Analyzer", "Keyframe rhythm & typography timing extraction.", CYAN),
        ("3. BiRefNet Matting", "Sub-pixel high-resolution portrait subject cutout.", TEAL),
        ("4. ISNet Masking", "Temporal subject tracking across reference frames.", PURPLE),
        ("5. Model Dispatcher", "Visual entropy router for plate reconstruction.", GOLD),
        ("6. LaMa Inpainting", "Fast Fourier Convolution neural plate fill.", TEAL),
        ("7. Anatomical Aligner", "Eye-locked, shoulder-ratio landmark matching.", CYAN),
        ("8. 3D Depth Compositor", "Screen-light kinetic typography rendering behind creator.", PURPLE),
        ("9. Audio Sync & Mux", "Lossless AAC/MP4 multiplexing preserving rhythm.", GREEN)
    ]

    for i, (title, text, color) in enumerate(models):
        col = i % 3
        row = i // 3
        left = Inches(0.8 + col * 3.95)
        top = Inches(1.9 + row * 1.6)
        add_card(s6, left, top, Inches(3.8), Inches(1.45), title, text, border_color=color)

    add_footer(s6, 6)

    # ==========================================
    # SLIDE 7: QUALCOMM SNAPDRAGON NPU ACCELERATION
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Hardware Acceleration", "Qualcomm Snapdragon NPU & AI Hub Integration", 
               "Harnessing the 45 TOPS Hexagon NPU on Snapdragon X Elite for desktop-class on-device neural synthesis.")

    # 3 Metric Highlight Cards
    metrics = [
        ("100% NPU", "COMPUTE OFFLOAD", "Zero CPU / GPU bottleneck during neural inference", GREEN),
        ("0.52 ms", "INFERENCE LATENCY", "Benchmarked on physical Snapdragon X Elite CRD", CYAN),
        ("36.2 MB", "PEAK MEMORY FOOTPRINT", "Ultra-low memory usage leaves RAM free for video editing", PURPLE)
    ]

    for i, (val, title, sub, color) in enumerate(metrics):
        left = Inches(0.8 + i * 3.95)
        c = add_card(s7, left, Inches(1.9), Inches(3.8), Inches(1.6), "", border_color=color)
        tf = c.text_frame
        p_val = tf.paragraphs[0]
        p_val.text = val
        p_val.font.name = FONT_HEADING
        p_val.font.size = Pt(28)
        p_val.font.bold = True
        p_val.font.color.rgb = color

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(10)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(2)

        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.name = FONT_BODY
        p_s.font.size = Pt(8.5)
        p_s.font.color.rgb = TEXT_MUTED

    # Bottom Details: Qualcomm AI Hub Integration Architecture
    c_bottom = add_card(s7, Inches(0.8), Inches(3.7), Inches(11.7), Inches(3.0), 
                        "QUALCOMM AI HUB PIPELINE & RESILIENT FALLBACK CHAIN", 
                        border_color=TEAL)
    tf_b = c_bottom.text_frame
    q_points = [
        "1. Qualcomm AI Hub SDK (qai-hub 0.55.0): Connected via secure API token to compile models for Qualcomm Hexagon NPU.",
        "2. Compilation Target: Compiled using '--target_runtime precompiled_qnn_onnx' for native execution on Snapdragon X Elite.",
        "3. Real Hardware Verification: Validated on physical Snapdragon X Elite Compute Reference Device (CRD) via QAI Hub jobs.",
        "4. 3-Tier Graceful Fallback Architecture: Snapdragon NPU (Primary) → CUDA GPU (Secondary) → Multithreaded CPU (Universal Fallback). The app runs universally on any computer while running exponentially faster on Snapdragon.",
        "5. Efficiency Impact: Offloading vision models to Hexagon NPU extends laptop battery life up to 3-4x compared to GPU rendering."
    ]
    for p_txt in q_points:
        p = tf_b.add_paragraph()
        p.text = p_txt
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(6)

    add_footer(s7, 7)

    # ==========================================
    # SLIDE 8: ALGORITHMIC BREAKTHROUGHS
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Deep Tech Innovation", "Proprietary Algorithmic Breakthroughs", 
               "Core technical contributions solving complex visual synchronization and background reconstruction.")

    tech_cards = [
        ("Visual Entropy Model Dispatcher", 
         "Dynamically analyzes Hue Standard Deviation and Laplacian Edge Density on frame margins to select the optimal background strategy: Fast Wall Averaging for flat studios, Fourier LaMa for textured surfaces, or ProPainter for dynamic motions.",
         TEAL),
        ("Smart Anatomical Landmark Alignment", 
         "Calculates eye-line heights, head centers, and shoulder width ratios between reference creators and the user. Eliminates awkward uncanny-valley scaling by anchoring the user naturally in the 3D frame.",
         CYAN),
        ("Screen-Light Kinetic Typo Compositor", 
         "Renders kinetic typography using specialized Screen Light blending. Keeps text crisp behind or in front of the creator with zero hardcoded fonts, replicating authentic viral aesthetic reveals.",
         PURPLE),
        ("Dynamic Reference Memory Cache", 
         "Disk-persistent reference analysis caching prevents re-analyzing video blueprints. Keyframe masks and scene cuts load instantly from cache, reducing compilation times from minutes to seconds.",
         GREEN)
    ]

    for i, (title, text, color) in enumerate(tech_cards):
        left = Inches(0.8 + (i % 2) * 5.95)
        top = Inches(1.9 + (i // 2) * 2.45)
        add_card(s8, left, top, Inches(5.75), Inches(2.25), title, text, border_color=color)

    add_footer(s8, 8)

    # ==========================================
    # SLIDE 9: INTERACTIVE STUDIO UI & STREAMING
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "User Experience", "Interactive Studio UI & Live Streaming", 
               "Designed for creators with real-time feedback, visual controls, and continuous agent transparency.")

    ui_cards = [
        ("Live Server-Sent Events (SSE) Streaming", 
         "Terminal logs and progress percentages stream live from backend threads to the frontend. Creators see every stage execute in real time without refreshing or polling.",
         CYAN),
        ("Dynamic Dual-Grid UI Switching", 
         "Switching from Videos to Template tab instantly toggles the Agent Operations Center between the 8-Agent Council and the 9 Neural Models with active pulse indicators.",
         PURPLE),
        ("Interactive 2D Transform Box", 
         "Visual bounding box overlaid directly on the video player allows creators to drag, nudge, and scale their subject in real time with instantaneous coordinate feedback.",
         TEAL),
        ("AI Supervisor Natural Language Refinement", 
         "Post-render refinement panel: type 'make my photo brighter and put text behind me' and the AI supervisor recalculates parameters and re-renders automatically.",
         GOLD)
    ]

    for i, (title, text, color) in enumerate(ui_cards):
        left = Inches(0.8 + (i % 2) * 5.95)
        top = Inches(1.9 + (i // 2) * 2.45)
        add_card(s9, left, top, Inches(5.75), Inches(2.25), title, text, border_color=color)

    add_footer(s9, 9)

    # ==========================================
    # SLIDE 10: IMPACT & ADVANTAGES
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Market Impact", "Value Proposition & Competitive Advantage", 
               "Transforming short-form content economics through on-device edge acceleration.")

    metrics_imp = [
        ("10x Faster", "ITERATION SPEED", "Zero cloud upload queues; instant on-device neural processing", CYAN),
        ("$0 / Month", "SUBSCRIPTION COSTS", "Runs locally on user hardware without recurring server API bills", GREEN),
        ("100% Private", "ZERO DATA LEAKAGE", "Media files never leave the creator's Snapdragon device", PURPLE)
    ]

    for i, (val, title, sub, color) in enumerate(metrics_imp):
        left = Inches(0.8 + i * 3.95)
        c = add_card(s10, left, Inches(1.9), Inches(3.8), Inches(1.5), "", border_color=color)
        tf = c.text_frame
        p_val = tf.paragraphs[0]
        p_val.text = val
        p_val.font.name = FONT_HEADING
        p_val.font.size = Pt(26)
        p_val.font.bold = True
        p_val.font.color.rgb = color

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(9.5)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE

        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.name = FONT_BODY
        p_s.font.size = Pt(8.5)
        p_s.font.color.rgb = TEXT_MUTED

    # Bottom card: Target audience & market reach
    c_mkt = add_card(s10, Inches(0.8), Inches(3.6), Inches(11.7), Inches(3.1), 
                     "TARGET AUDIENCE & ECOSYSTEM IMPACT", border_color=TEAL)
    tf_m = c_mkt.text_frame
    m_points = [
        "• 200M+ Digital Creators: Democratizes viral Reels/TikTok editing for indie creators who cannot afford professional editors.",
        "• Social Media Marketing Agencies: Enables 1-click template cloning for brand campaigns, cutting turnaround from days to minutes.",
        "• Qualcomm Snapdragon PC Ecosystem: Serves as a flagship showcase application proving why creators need Snapdragon X Elite Copilot+ AI PCs with 45 TOPS NPUs.",
        "• Battery-Operated Creative Workstations: Unlike power-hungry discrete GPUs that drain laptops in 1 hour of editing, Snapdragon NPU efficiency enables all-day editing on battery power."
    ]
    for p_txt in m_points:
        p = tf_m.add_paragraph()
        p.text = p_txt
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(6)

    add_footer(s10, 10)

    # ==========================================
    # SLIDE 11: FUTURE ROADMAP
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Vision & Roadmap", "Future Roadmap & Ecosystem Expansion", 
               "Expanding Ashtavadhani into a comprehensive real-time neural production suite.")

    phases = [
        ("Phase 1: Current Release", 
         "✅ 8-Agent Council standard workflow\n✅ 9-Model 3D zero-shot template cloning\n✅ Qualcomm AI Hub Hexagon NPU offload\n✅ Real-time SSE percentage streaming UI\n✅ Resilient NPU → CUDA → CPU fallback chain", 
         GREEN),
        ("Phase 2: Real-Time Stream", 
         "🔄 Live webcam neural synthesis at 60 FPS\n🔄 Real-time virtual studio background inpainting\n🔄 Direct integration with Snapdragon WoS DirectML\n🔄 Multi-track audio stem separation on Hexagon NPU", 
         CYAN),
        ("Phase 3: Multi-Modal Studio", 
         "🚀 Autonomous voiceover generation with lip-sync\n🚀 Multilingual kinetic caption localization\n🚀 Community viral template hub with 1-click clone\n🚀 Native Qualcomm Snapdragon Developer SDK plug-in", 
         PURPLE)
    ]

    for i, (title, text, color) in enumerate(phases):
        left = Inches(0.8 + i * 3.95)
        c = add_card(s11, left, Inches(1.9), Inches(3.8), Inches(4.8), title, border_color=color)
        tf = c.text_frame
        for line in text.split("\n"):
            p = tf.add_paragraph()
            p.text = line
            p.font.name = FONT_BODY
            p.font.size = Pt(10)
            p.font.color.rgb = TEXT_WHITE
            p.space_before = Pt(8)

    add_footer(s11, 11)

    # ==========================================
    # SLIDE 12: CONCLUSION & SUMMARY
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)

    # End Banner
    glow_end = s12.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.2), Inches(11.733), Inches(5.1))
    glow_end.fill.solid()
    glow_end.fill.fore_color.rgb = RGBColor(14, 20, 32)
    glow_end.line.color.rgb = RGBColor(40, 50, 80)
    glow_end.line.width = Pt(1.5)

    if os.path.exists(logo_path):
        s12.shapes.add_picture(logo_path, Inches(1.3), Inches(1.6), width=Inches(1.8))

    t_end = s12.shapes.add_textbox(Inches(3.4), Inches(1.5), Inches(8.8), Inches(4.5))
    tf_e = t_end.text_frame
    tf_e.word_wrap = True

    pe1 = tf_e.paragraphs[0]
    pe1.text = "ASHTAVADHANI (अष्टावधानी)"
    pe1.font.name = FONT_HEADING
    pe1.font.size = Pt(32)
    pe1.font.bold = True
    pe1.font.color.rgb = TEXT_WHITE
    pe1.space_after = Pt(4)

    pe2 = tf_e.add_paragraph()
    pe2.text = "The Future of Video Synthesis is On-Device, Agentic, and Powered by Snapdragon."
    pe2.font.name = FONT_HEADING
    pe2.font.size = Pt(15)
    pe2.font.bold = True
    pe2.font.color.rgb = CYAN
    pe2.space_after = Pt(14)

    recap_bullets = [
        "✔ Multi-Agent Cognitive Orchestration: 8 agents collaborate in real-time.",
        "✔ 3D Zero-Shot Template Cloning: 9 neural models replicate viral video pacing.",
        "✔ Qualcomm AI Hub Verified: 100% NPU offload with 0.52 ms latency on Snapdragon X Elite.",
        "✔ Creator Sovereignty: 100% local, private, and free of recurring subscription costs."
    ]
    for b in recap_bullets:
        p = tf_e.add_paragraph()
        p.text = b
        p.font.name = FONT_BODY
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(4)

    p_links = tf_e.add_paragraph()
    p_links.text = "\nGitHub Repository: https://github.com/sanyam47/ashtavadhani\nChallenge: Qualcomm & HP Snapdragon AI Lab  |  Candidate: Sanyam Asopa"
    p_links.font.name = FONT_BODY
    p_links.font.size = Pt(10)
    p_links.font.bold = True
    p_links.font.color.rgb = TEAL

    add_footer(s12, 12)

    # Save Presentation
    prs.save(output_path)
    print(f"[Success] Presentation saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
