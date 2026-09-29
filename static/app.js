// DOM ELEMENTS
const uploadForm = document.getElementById('upload-form');
const inputRaw = document.getElementById('input-raw');
const inputRef = document.getElementById('input-ref');
const listRaw = document.getElementById('list-raw');
const listRef = document.getElementById('list-ref');
const dropzoneRaw = document.getElementById('dropzone-raw');
const dropzoneRef = document.getElementById('dropzone-ref');
const inputMusic = document.getElementById('input-music');
const inputSfx = document.getElementById('input-sfx');
const dropzoneMusic = document.getElementById('dropzone-music');
const dropzoneSfx = document.getElementById('dropzone-sfx');
const btnSubmit = document.getElementById('btn-submit');
const btnReset = document.getElementById('btn-reset');

// Asset state
let rawClipsState = []; // [{ file, id }]
let musicAssets = [];  // { file, volume, id }
let sfxAssets = [];    // { file, volume, id }
let textOverlays = []; // { text, start, end, position, style, id }
let assetIdCounter = 0;
let shortlistedSfx = JSON.parse(localStorage.getItem('shortlisted_sfx') || '[]');
let defaultMusicVolume = 0.15;
let defaultSfxVolume = 0.30;

let currentTemplateBlueprint = null;
let templateSlotFiles = {};
let templateSlotRawFiles = {};
let currentTemplateDepthMode = 'foreground';
let currentTemplateBackdropMode = 'studio_gray';
let currentTemplateVerticalPos = 0.50;
let currentTemplateTextColor = 'white';
let currentTemplateSubjectScale = 1.00;
let currentTemplateAnchorMode = 'smart';
let currentTemplatePosXOffset = 0;
let currentTemplatePosYOffset = 0;

const systemStatusPill = document.getElementById('system-status-pill');
const systemStatusText = document.getElementById('system-status-text');
const consoleLogs = document.getElementById('console-logs');

const storyboardResolverBox = document.getElementById('storyboard-resolver-box');
const btnResolveUpload = document.getElementById('btn-resolve-upload');
const btnResolveGenerate = document.getElementById('btn-resolve-generate');
const btnResolveSkip = document.getElementById('btn-resolve-skip');

const copyrightResolverBox = document.getElementById('copyright-resolver-box');
const copyrightErrorMsg = document.getElementById('copyright-error-msg');
const btnCopyrightContinue = document.getElementById('btn-copyright-continue');
const btnCopyrightUpload = document.getElementById('btn-copyright-upload');

const mainVideoPlayer = document.getElementById('main-video-player');
const playerTrack = document.getElementById('player-track');
const captionText = document.getElementById('caption-text');
const playerGradeOverlay = document.getElementById('player-grade-overlay');
const playerRenderingSpinner = document.getElementById('player-rendering-spinner');
const renderStatusHeading = document.getElementById('render-status-heading');

const btnPlayPause = document.getElementById('btn-play-pause');
const playIcon = document.getElementById('play-icon');
const btnPlayPauseOverlay = document.getElementById('btn-play-pause-overlay');
const playIconOverlay = document.getElementById('play-icon-overlay');
const playerTimeDisplay = document.getElementById('player-time-display');
const playerProgressBar = document.getElementById('player-progress-bar');
const btnVolume = document.getElementById('btn-volume');
const volumeIcon = document.getElementById('volume-icon');
const soundtrackAudio = document.getElementById('soundtrack-audio');

const timelinePlayheadLine = document.getElementById('timeline-playhead-line');
const rulerTicks = document.getElementById('ruler-ticks');
const trackVideoClips = document.getElementById('track-video-clips');
const trackTransitions = document.getElementById('track-transitions');
const trackCaptions = document.getElementById('track-captions');
const trackAudioBeats = document.getElementById('track-audio-beats');
const timelineContainer = document.getElementById('timeline-container');

// STATE PARAMETERS
let systemStatus = 'idle';
let currentEventSource = null;
let videoDuration = 12.0; // Default
let subtitleTimeline = [];
let activeAction = null; // 'upload', 'generate', 'skip'
let timelineZoom = 1.0;
let currentVibe = 'gym'; // Default classified vibe
let currentMissingItem = 'close-up of tying wrist straps'; // Default missing item label
let currentEditingIndex = -1;
let timelineVideoClips = []; // Dynamic Video Clips list from backend
let timelineTransitions = []; // Dynamic Transition Times list from backend
let timelineAudioBeats = []; // Dynamic Audio Beat Markers list from backend
let timelineSfxPlacements = []; // Dynamic SFX Placement markers
let timelineSfxTracks = [];     // Dynamic SFX tracks list
let timelineSfxClips = [];      // Interactive SFX clips on timeline
let timelineMusicTracks = [];   // Dynamic Music tracks on timeline
let editingTrackId = null;      // ID of music track currently being edited
let editingTrackType = 'music'; // 'music' or 'sfx'

// Subtitle Editor Modal Elements
const subtitleEditorModal = document.getElementById('subtitle-editor-modal');
const editCaptionText = document.getElementById('edit-caption-text');
const editCaptionStart = document.getElementById('edit-caption-start');
const editCaptionEnd = document.getElementById('edit-caption-end');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSaveEdit = document.getElementById('btn-save-edit');

// Save & Export Buttons
const btnSaveTimeline = document.getElementById('btn-save-timeline');
const btnDownloadVideo = document.getElementById('btn-download-video');
const btnDownloadVtt = document.getElementById('btn-download-vtt');

// AGENT DOM ELEMENT MAP
const agentCards = {
    "User Interaction Agent": document.getElementById('agent-user'),
    "Manager Agent": document.getElementById('agent-manager'),
    "Reference Analysis Agent": document.getElementById('agent-reference'),
    "Stock & AI Footage Agent": document.getElementById('agent-stock'),
    "Music Agent": document.getElementById('agent-music'),
    "Sound Effects Agent": document.getElementById('agent-sfx'),
    "Caption Agent": document.getElementById('agent-caption'),
    "Editor Agent": document.getElementById('agent-editor'),
    "Quality Review Agent": document.getElementById('agent-review'),
    "Transitions Agent": document.getElementById('agent-transitions'),
    "Motion Graphics Agent": document.getElementById('agent-motion-graphics')
};

let currentTemplateEventSource = null;
let currentAgentMode = 'standard';

// TEMPLATE MODE NEURAL MODEL DOM ELEMENT MAP
const templateAgentCards = {
    "Snapdragon NPU": document.getElementById('agent-tpl-npu'),
    "Blueprint Analyzer": document.getElementById('agent-tpl-blueprint'),
    "BiRefNet Matting": document.getElementById('agent-tpl-matting'),
    "ISNet Masking": document.getElementById('agent-tpl-masking'),
    "Model Dispatcher": document.getElementById('agent-tpl-dispatcher'),
    "LaMa Inpainting": document.getElementById('agent-tpl-inpainting'),
    "Anatomical Aligner": document.getElementById('agent-tpl-aligner'),
    "3D Depth Compositor": document.getElementById('agent-tpl-compositor'),
    "Audio Sync & Mux": document.getElementById('agent-tpl-audio')
};

function switchAgentMode(mode) {
    currentAgentMode = mode;
    const gridStandard = document.getElementById('agent-grid-standard');
    const gridTemplate = document.getElementById('agent-grid-template');
    const badge = document.getElementById('agent-pipeline-badge');
    
    if (mode === 'template') {
        if (gridStandard) gridStandard.classList.add('hidden');
        if (gridTemplate) gridTemplate.classList.remove('hidden');
        if (badge) {
            badge.textContent = 'Template Cloning Pipeline';
            badge.style.background = 'rgba(6, 182, 212, 0.15)';
            badge.style.color = '#22d3ee';
            badge.style.borderColor = 'rgba(6, 182, 212, 0.3)';
        }
    } else {
        if (gridTemplate) gridTemplate.classList.add('hidden');
        if (gridStandard) gridStandard.classList.remove('hidden');
        if (badge) {
            badge.textContent = 'Standard Multi-Agent';
            badge.style.background = 'rgba(139, 92, 246, 0.15)';
            badge.style.color = '#a78bfa';
            badge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        }
    }
}

// INITIALIZE APP
function init() {
    setupUploadHandlers();
    setupAssetTabs();
    setupTextOverlays();
    setupReprompt();
    setupPlayerControls();
    setupTimelineZoom();
    setupSubtitleEditor(); // Bound subtitle click and save handlers
    setupTimelineMusicListeners(); // Setup timeline editable music events
    setupPlayheadScrubbing(); // Setup interactive playhead scrubbing
    setupSettingsModal();
    setupLibraryPanel();
    setupTemplateHandlers();
    setupPhotoCropModal();
    setupPlayerTransformBox();
    
    btnReset.addEventListener('click', resetWorkspace);
    
    // Resolve buttons
    btnResolveUpload.addEventListener('click', () => resolveDiscrepancy('upload'));
    btnResolveGenerate.addEventListener('click', () => resolveDiscrepancy('generate'));
    btnResolveSkip.addEventListener('click', () => resolveDiscrepancy('skip'));
}

// TAB SWITCHING
function setupAssetTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            const targetContent = document.getElementById('tab-' + tabId);
            if (targetContent) targetContent.classList.add('active');
            
            // Dynamically switch Agent Operations Center view (Standard vs Template models)
            switchAgentMode(tabId === 'template' ? 'template' : 'standard');
        });
    });
}

// DRAG AND DROP FILE HANDLERS
function setupUploadHandlers() {
    // Dropzone drag-overs
    [dropzoneRaw, dropzoneRef, dropzoneMusic, dropzoneSfx].forEach(dz => {
        if (!dz) return;
        dz.addEventListener('dragover', (e) => {
            e.preventDefault();
            dz.style.borderColor = 'var(--color-primary)';
            dz.style.background = 'rgba(139, 92, 246, 0.05)';
        });
        dz.addEventListener('dragleave', () => {
            dz.style.borderColor = 'var(--border-color)';
            dz.style.background = '';
        });
    });

    // Raw/Ref file list updates
    inputRaw.addEventListener('change', () => {
        appendRawClips(inputRaw.files);
        // Clear input value so selecting the same file again triggers change event
        inputRaw.value = '';
    });
    inputRef.addEventListener('change', () => updateFileList(inputRef, listRef));

    dropzoneRaw.addEventListener('drop', (e) => {
        e.preventDefault();
        appendRawClips(e.dataTransfer.files);
        dropzoneRaw.style.borderColor = 'var(--border-color)';
        dropzoneRaw.style.background = '';
    });
    
    dropzoneRef.addEventListener('drop', (e) => {
        e.preventDefault();
        inputRef.files = e.dataTransfer.files;
        updateFileList(inputRef, listRef);
        dropzoneRef.style.borderColor = 'var(--border-color)';
        dropzoneRef.style.background = '';
    });

    // Multi-file music upload
    inputMusic.addEventListener('change', () => addMusicAssets(inputMusic.files));
    dropzoneMusic.addEventListener('drop', (e) => {
        e.preventDefault();
        addMusicAssets(e.dataTransfer.files);
        dropzoneMusic.style.borderColor = 'var(--border-color)';
        dropzoneMusic.style.background = '';
    });

    // Multi-file SFX upload
    inputSfx.addEventListener('change', () => addSfxAssets(inputSfx.files));
    dropzoneSfx.addEventListener('drop', (e) => {
        e.preventDefault();
        addSfxAssets(e.dataTransfer.files);
        dropzoneSfx.style.borderColor = 'var(--border-color)';
        dropzoneSfx.style.background = '';
    });

    // Add More Buttons
    const btnAddMore = document.getElementById('btn-add-more-clips');
    if (btnAddMore) {
        btnAddMore.addEventListener('click', () => inputRaw.click());
    }

    // Modal Add More Button
    const btnModalAddMore = document.getElementById('btn-modal-add-more');
    if (btnModalAddMore) {
        btnModalAddMore.addEventListener('click', () => inputRaw.click());
    }

    // Show All Button
    const btnShowAll = document.getElementById('btn-show-all-clips');
    if (btnShowAll) {
        btnShowAll.addEventListener('click', () => {
            renderClipsModalList();
            document.getElementById('clips-modal').classList.remove('hidden');
        });
    }

    // Close Modal Button
    const btnCloseModal = document.getElementById('btn-close-clips-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            document.getElementById('clips-modal').classList.add('hidden');
        });
    }

    // Clear All Button inside modal
    const btnClearAll = document.getElementById('btn-clear-all-clips');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            rawClipsState = [];
            updateRawClipsCount();
            renderClipsModalList();
        });
    }

    // Copyright buttons
    if (btnCopyrightContinue) {
        btnCopyrightContinue.addEventListener('click', () => resolveCopyright('continue'));
    }
    if (btnCopyrightUpload) {
        btnCopyrightUpload.addEventListener('click', () => resolveCopyright('upload'));
    }

    // Form Submit
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await startEditingPipeline();
    });
}

function appendRawClips(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = ++assetIdCounter;
        rawClipsState.push({ file, id });
    }
    updateRawClipsCount();
    renderRawClipsFileList();
}

function updateRawClipsCount() {
    const counter = document.getElementById('raw-clips-count');
    if (counter) {
        counter.textContent = rawClipsState.length;
    }
}

function renderRawClipsFileList() {
    if (!listRaw) return;
    listRaw.innerHTML = '';
    rawClipsState.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'file-item';
        row.innerHTML = `
            <span><i data-lucide="file" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${item.file.name}</span>
            <span class="file-item-delete" onclick="removeRawClip(${item.id})">&times;</span>
        `;
        listRaw.appendChild(row);
    });
    lucide.createIcons();
}

function renderClipsModalList() {
    const listContainer = document.getElementById('clips-modal-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (rawClipsState.length === 0) {
        listContainer.innerHTML = `
            <div class="asset-empty-state" style="justify-content: center; height: 100px; align-items: center;">
                <i data-lucide="video-off"></i>
                <span>No clips or photos added yet.</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    rawClipsState.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'photo-thumb-card';
        row.style.background = 'rgba(255, 255, 255, 0.03)';
        row.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        row.style.padding = '8px 12px';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        
        const isPhoto = item.file.type.startsWith('image/');
        const iconHtml = isPhoto 
            ? `<i data-lucide="image" style="color: #3b82f6; width: 20px; height: 20px; flex-shrink:0;"></i>` 
            : `<i data-lucide="video" style="color: #a78bfa; width: 20px; height: 20px; flex-shrink:0;"></i>`;
            
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; flex: 1;">
                ${iconHtml}
                <span style="font-size: 0.8rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.file.name}</span>
                <span style="font-size: 0.65rem; color: rgba(255,255,255,0.4);">(${(item.file.size / (1024*1024)).toFixed(1)} MB)</span>
            </div>
            <button class="photo-thumb-del" onclick="removeRawClip(${item.id})" type="button" title="Remove" style="background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center;">
                <i data-lucide="x" style="width:14px; height:14px;"></i>
            </button>
        `;
        listContainer.appendChild(row);
    });
    
    lucide.createIcons();
}

window.removeRawClip = function(id) {
    rawClipsState = rawClipsState.filter(item => item.id !== id);
    updateRawClipsCount();
    renderRawClipsFileList();
    renderClipsModalList();
};

// MUSIC ASSET MANAGEMENT
function addMusicAssets(files) {
    for (const file of files) {
        const id = ++assetIdCounter;
        musicAssets.push({ file, volume: 0.20, id });
    }
    renderMusicList();
}

function renderMusicList() {
    const list = document.getElementById('music-asset-list');
    if (!list) return;
    const emptyEl = document.getElementById('music-empty');
    
    // Remove old cards (keep empty state)
    list.querySelectorAll('.asset-track-card').forEach(el => el.remove());
    
    if (musicAssets.length === 0) {
        if (emptyEl) emptyEl.style.display = 'none';
        const card = document.createElement('div');
        card.className = 'asset-track-card default-track-card';
        card.innerHTML = `
            <div class="asset-track-top">
                <span class="asset-track-name">🎵 Default Backing Soundtrack (Stock)</span>
            </div>
            <div class="asset-track-vol">
                <span>Vol</span>
                <input type="range" min="0" max="100" value="${Math.round(defaultMusicVolume * 100)}" 
                    oninput="updateDefaultMusicVol(this.value)" title="Volume">
                <span class="vol-label" id="default-music-vol-label">${Math.round(defaultMusicVolume * 100)}%</span>
            </div>
        `;
        list.appendChild(card);
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
        musicAssets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'asset-track-card';
            card.dataset.id = asset.id;
            card.innerHTML = `
                <div class="asset-track-top">
                    <span class="asset-track-name">🎵 ${asset.file.name}</span>
                    <button class="asset-track-delete" onclick="removeMusicAsset(${asset.id})" title="Remove" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
                <div class="asset-track-vol">
                    <span>Vol</span>
                    <input type="range" min="0" max="100" value="${Math.round(asset.volume * 100)}" 
                        oninput="updateMusicVol(${asset.id}, this.value)" title="Volume">
                    <span class="vol-label" id="vol-label-${asset.id}">${Math.round(asset.volume * 100)}%</span>
                </div>
            `;
            list.appendChild(card);
        });
    }
}

window.removeMusicAsset = function(id) {
    musicAssets = musicAssets.filter(a => a.id !== id);
    renderMusicList();
    updateAttributionCredits();
};
window.updateMusicVol = function(id, val) {
    const asset = musicAssets.find(a => a.id === id);
    if (asset) { asset.volume = parseInt(val) / 100; }
    const label = document.getElementById('vol-label-' + id);
    if (label) label.textContent = val + '%';
};
window.updateDefaultMusicVol = function(val) {
    defaultMusicVolume = parseInt(val) / 100;
    const label = document.getElementById('default-music-vol-label');
    if (label) label.textContent = val + '%';
};

// SFX ASSET MANAGEMENT
function addSfxAssets(files) {
    for (const file of files) {
        const id = ++assetIdCounter;
        sfxAssets.push({ file, volume: 0.30, id });
    }
    renderSfxList();
}
function renderSfxList() {
    const list = document.getElementById('sfx-asset-list');
    if (!list) return;
    const emptyEl = document.getElementById('sfx-empty');
    list.querySelectorAll('.asset-track-card').forEach(el => el.remove());
    
    if (sfxAssets.length === 0) {
        if (emptyEl) emptyEl.style.display = 'none';
        const card = document.createElement('div');
        card.className = 'asset-track-card default-track-card';
        card.innerHTML = `
            <div class="asset-track-top">
                <span class="asset-track-name">🔊 Default Transition Swoosh (Stock)</span>
            </div>
            <div class="asset-track-vol">
                <span>Vol</span>
                <input type="range" min="0" max="100" value="${Math.round(defaultSfxVolume * 100)}" 
                    oninput="updateDefaultSfxVol(this.value)" title="Volume">
                <span class="vol-label" id="default-sfx-vol-label">${Math.round(defaultSfxVolume * 100)}%</span>
            </div>
        `;
        list.appendChild(card);
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
        sfxAssets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'asset-track-card';
            card.innerHTML = `
                <div class="asset-track-top">
                    <span class="asset-track-name">🔊 ${asset.file.name}</span>
                    <button class="asset-track-delete" onclick="removeSfxAsset(${asset.id})" type="button" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
                <div class="asset-track-vol">
                    <span>Vol</span>
                    <input type="range" min="0" max="100" value="${Math.round(asset.volume * 100)}" 
                        oninput="updateSfxVol(${asset.id}, this.value)" title="Volume">
                    <span class="vol-label" id="sfx-vol-label-${asset.id}">${Math.round(asset.volume * 100)}%</span>
                </div>
            `;
            list.appendChild(card);
        });
    }
}
window.removeSfxAsset = function(id) {
    sfxAssets = sfxAssets.filter(a => a.id !== id);
    renderSfxList();
    updateAttributionCredits();
};
window.updateSfxVol = function(id, val) {
    const asset = sfxAssets.find(a => a.id === id);
    if (asset) asset.volume = parseInt(val) / 100;
    const label = document.getElementById('sfx-vol-label-' + id);
    if (label) label.textContent = val + '%';
};
window.updateDefaultSfxVol = function(val) {
    defaultSfxVolume = parseInt(val) / 100;
    const label = document.getElementById('default-sfx-vol-label');
    if (label) label.textContent = val + '%';
};

function updateFileList(input, listElement) {
    listElement.innerHTML = '';
    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <span><i data-lucide="file" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${file.name}</span>
            <span class="file-item-delete" onclick="removeFile(${i}, '${input.id}')">&times;</span>
        `;
        listElement.appendChild(item);
    }
    lucide.createIcons();
}

window.removeFile = function(index, inputId) {
    const input = document.getElementById(inputId);
    let listElement;
    if (inputId === 'input-raw') listElement = listRaw;
    else if (inputId === 'input-ref') listElement = listRef;
    else if (inputId === 'input-music') listElement = listMusic;
    else if (inputId === 'input-sfx') listElement = listSfx;
    
    const dt = new DataTransfer();
    const files = input.files;
    for (let i = 0; i < files.length; i++) {
        if (i !== index) dt.items.add(files[i]);
    }
    input.files = dt.files;
    updateFileList(input, listElement);
};

// RESET APP WORKSPACE
async function resetWorkspace() {
    try {
        await fetch('/api/reset', { method: 'POST' });
    } catch(e) {}
    
    if (currentEventSource) {
        currentEventSource.close();
    }
    
    // Clear logs
    consoleLogs.innerHTML = '<div class="log-line system">[System] Workspace reset. Ready.</div>';
    
    // Clear inputs
    inputRaw.value = '';
    inputRef.value = '';
    inputMusic.value = '';
    inputSfx.value = '';
    listRaw.innerHTML = '';
    listRef.innerHTML = '';
    
    // Clear new asset state
    rawClipsState = [];
    musicAssets = [];
    sfxAssets = [];
    textOverlays = [];
    defaultMusicVolume = 0.15;
    defaultSfxVolume = 0.30;
    updateRawClipsCount();
    renderMusicList();
    renderSfxList();
    renderTextOverlayList();
    const repromptPanel = document.getElementById('reprompt-panel');
    if (repromptPanel) repromptPanel.classList.add('hidden');
    document.querySelectorAll('.active-text-overlay').forEach(el => el.remove());
    
    // UI state
    setSystemStatus('idle', 'System Idle');
    storyboardResolverBox.classList.add('hidden');
    copyrightResolverBox.classList.add('hidden');
    playerRenderingSpinner.classList.add('hidden');
    
    // Stop video
    mainVideoPlayer.pause();
    mainVideoPlayer.src = '';
    soundtrackAudio.pause();
    soundtrackAudio.currentTime = 0;
    
    // Reset agent classes
    Object.values(agentCards).forEach(card => {
        card.className = 'agent-card idle';
    });
    
    // Reset timelines
    drawTimeline([]);
    activeAction = null;
    currentVibe = 'gym';
    currentMissingItem = 'close-up of tying wrist straps';
    btnSubmit.disabled = false;
}

// PIPELINE STARTER
async function startEditingPipeline() {
    btnSubmit.disabled = true;
    setSystemStatus('running', 'Analyzing Files...');
    storyboardResolverBox.classList.add('hidden');
    copyrightResolverBox.classList.add('hidden');
    
    // Clear logs
    consoleLogs.innerHTML = '<div class="log-line system">[System] Initiating file transmission...</div>';
    
    const formData = new FormData();
    formData.append('prompt', document.getElementById('prompt').value);
    
    // Raw files from state
    if (rawClipsState.length === 0) {
        formData.append('raw_clips', new File([""], "clip_chalk_hands.mp4", {type: "video/mp4"}));
        formData.append('raw_clips', new File([""], "clip_lifting_heavy.mp4", {type: "video/mp4"}));
    } else {
        rawClipsState.forEach(item => {
            formData.append('raw_clips', item.file);
        });
    }
    
    // Reference file
    const refFile = inputRef.files[0];
    if (refFile) formData.append('ref_clip', refFile);
    
    // Multiple music files (only upload local files, skip downloaded library tracks)
    musicAssets.forEach(a => {
        if (a.file && a.file instanceof File) {
            formData.append('music_files', a.file);
        }
    });
    
    // Multiple SFX files (only upload local files, skip downloaded library tracks)
    sfxAssets.forEach(a => {
        if (a.file && a.file instanceof File) {
            formData.append('sfx_files', a.file);
        }
    });
    
    // Text overlays JSON
    formData.append('text_overlays_json', JSON.stringify(textOverlays.map(o => ({
        text: o.text, start: o.start, end: o.end, position: o.position, style: o.style
    }))));

    // Audio volume configuration
    formData.append('default_music_volume', defaultMusicVolume);
    formData.append('default_sfx_volume', defaultSfxVolume);
    formData.append('music_config_json', JSON.stringify(musicAssets.map(a => ({
        filename: a.file.name,
        volume: a.volume,
        filepath: a.filepath || null
    }))));
    formData.append('sfx_config_json', JSON.stringify(sfxAssets.map(a => ({
        filename: a.file.name,
        volume: a.volume,
        filepath: a.filepath || null
    }))));
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            currentVibe = result.data.vibe || 'gym';
            currentMissingItem = result.data.missing_item || 'close-up of tying wrist straps';
            appendLog('System', 'Server Deployment', 'Files successfully buffered on server. Spawning Multi-Agent workspace.', 'SUCCESS');
            restoreJobState();
            startLogStream();
        } else {
            setSystemStatus('idle', 'Error');
            appendLog('System', 'Server Deployment', 'Upload failed: ' + result.message, 'ERROR');
            btnSubmit.disabled = false;
        }
    } catch (e) {
        setSystemStatus('idle', 'Error');
        appendLog('System', 'Server Deployment', 'Network connection failed: ' + e.message, 'ERROR');
        btnSubmit.disabled = false;
    }
}

// SERVER SENT EVENTS LOG LISTENER
function startLogStream() {
    if (currentEventSource) {
        currentEventSource.close();
    }
    
    currentEventSource = new EventSource('/api/stream-logs');
    
    currentEventSource.onmessage = (event) => {
        const log = JSON.parse(event.data);
        
        // Parse progress updates to show on player card loading spinner
        const match = log.message.match(/Writing output video to disk\.\.\. (\d+)%/);
        if (match) {
            const pct = match[1];
            updateRenderProgress(pct, "Writing output video to disk", `${pct}% complete`);
            playerRenderingSpinner.classList.remove('hidden');
        }
        
        // Handle core system triggers
        if (log.message === "VIDEO_COMPILE_SUCCESSFUL") {
            currentEventSource.close();
            updateRenderProgress(100, "Render Complete", "Finished 100%");
            completeCompile();
            return;
        }
        
        if (log.level === "ERROR") {
            currentEventSource.close();
            setSystemStatus('idle', 'Error');
            appendLog(log.agent, log.role, log.message, log.level);
            btnSubmit.disabled = false;
            return;
        }
        
        appendLog(log.agent, log.role, log.message, log.level);
        updateAgentUI(log.agent, log.level, log.message);
    };
    
    currentEventSource.onerror = (e) => {
        currentEventSource.close();
        // If it closes due to discrepancy check, we pause
    };
}

// REAL-TIME RENDER PROGRESS BAR HELPER
function updateRenderProgress(pct, phase, detail) {
    const p = Math.max(0, Math.min(100, parseInt(pct) || 0));
    
    // 1. Preview Player Overlay Elements
    const playerPct = document.getElementById('render-progress-percent');
    const playerFill = document.getElementById('render-progress-fill');
    const playerPhase = document.getElementById('render-progress-phase');
    const playerDetail = document.getElementById('render-progress-frame-detail');
    const playerHeading = document.getElementById('render-status-heading');
    
    if (playerPct) playerPct.textContent = `${p}%`;
    if (playerFill) playerFill.style.width = `${p}%`;
    if (playerPhase && phase) playerPhase.textContent = phase;
    if (playerDetail && detail) playerDetail.textContent = detail;
    if (playerHeading) playerHeading.textContent = `Rendering Video... ${p}%`;
    
    // 2. Template Tab Progress Card Elements
    const tplCard = document.getElementById('template-render-progress-card');
    const tplPct = document.getElementById('tpl-progress-percentage');
    const tplFill = document.getElementById('tpl-progress-bar-fill');
    const tplBadge = document.getElementById('tpl-progress-agent-badge');
    const tplCounter = document.getElementById('tpl-progress-frame-counter');
    
    if (tplCard && tplCard.classList.contains('hidden')) tplCard.classList.remove('hidden');
    if (tplPct) tplPct.textContent = `${p}%`;
    if (tplFill) tplFill.style.width = `${p}%`;
    if (tplBadge && phase) tplBadge.textContent = phase;
    if (tplCounter && detail) tplCounter.textContent = detail;
    
    // 3. System Status Pill
    setSystemStatus('running', `Rendering Video... ${p}%`);
}

// CONSOLE LOGGER HELPERS
function appendLog(agent, role, message, level) {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${level.toLowerCase()}`;
    
    const timeStr = new Date().toLocaleTimeString();
    logLine.innerHTML = `[${timeStr}] <strong>${agent}</strong> (${role}): ${message}`;
    
    consoleLogs.appendChild(logLine);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// UPDATE ACTIVE AGENT CARD STATUS
function updateAgentUI(agentName, level, message) {
    const isTpl = templateAgentCards && templateAgentCards[agentName];
    const activeGroup = isTpl ? templateAgentCards : agentCards;
    const card = activeGroup[agentName];
    if (!card) return;
    
    // Reset active states for others in this active group
    Object.keys(activeGroup).forEach(name => {
        const otherCard = activeGroup[name];
        if (otherCard && otherCard !== card && otherCard.classList.contains('active')) {
            otherCard.className = 'agent-card success'; // Transition to success after active
        }
    });
    
    // Set current agent class
    if (message.includes("Bypassed") || message.includes("standby") || message.includes("bypassed")) {
        card.className = 'agent-card skipped';
    } else if (level === "ALERT" || message.includes("suspended") || message.includes("Missing") || message.includes("Copyright suspension")) {
        card.className = 'agent-card warning';
        if (message.includes("Copyright suspension")) {
            setSystemStatus('awaiting', 'Copyright Decision Required');
            showCopyrightResolver(message);
        } else {
            setSystemStatus('awaiting', 'Missing Shot Attention Required');
            if (agentName === "Stock & AI Footage Agent" || message.includes("suspended")) {
                showStoryboardResolver();
            }
        }
    } else if (level === "SUCCESS") {
        card.className = 'agent-card success';
    } else {
        card.className = 'agent-card active';
    }
}

function setSystemStatus(state, text) {
    systemStatus = state;
    systemStatusPill.className = `status-pill ${state}`;
    systemStatusText.innerText = text;
}

// SHOW DISCREPANCY INTERACTION VIEW
function showStoryboardResolver() {
    const headerP = document.querySelector('.resolver-header p');
    if (headerP) {
        headerP.innerHTML = `Reference edit contains a close-up of <strong>${currentMissingItem}</strong>. Missing in your footage.`;
    }
    
    const placeholderText = document.querySelector('.placeholder-icon p');
    if (placeholderText) {
        placeholderText.innerText = currentMissingItem.toUpperCase();
    }
    
    // Update reference visual matching vibe
    const refImg = document.querySelector('.comparison-card img');
    if (refImg) {
        if (currentVibe === 'cooking') {
            refImg.src = "/static/assets/ref_chalk_hands.png"; // food preparation placeholder
        } else if (currentVibe === 'tech') {
            refImg.src = "/static/assets/ai_filler_broll.png"; // setup placeholder
        } else {
            refImg.src = "/static/assets/ref_wrist_straps.png";
        }
    }
    
    storyboardResolverBox.classList.remove('hidden');
    // Smooth scroll to resolver box
    storyboardResolverBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// SHOW COPYRIGHT INTERACTION VIEW
function showCopyrightResolver(message) {
    if (copyrightErrorMsg) {
        let cleanMsg = message;
        const prefix = "Copyright suspension. Awaiting user choice for song '";
        if (message.includes(prefix)) {
            const parts = message.split("Message: ");
            if (parts.length > 1) {
                cleanMsg = parts[1];
            }
        }
        copyrightErrorMsg.innerHTML = cleanMsg;
    }
    copyrightResolverBox.classList.remove('hidden');
    copyrightResolverBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSystemStatus('awaiting', 'Copyright Decision Required');
}

async function resolveCopyright(action) {
    copyrightResolverBox.classList.add('hidden');
    
    if (action === 'continue') {
        setSystemStatus('running', 'Synthesizing Edits...');
        const formData = new FormData();
        formData.append('action', 'continue');
        try {
            const response = await fetch('/api/resolve', {
                method: 'POST',
                body: formData
            });
            const res = await response.json();
            if (res.status === 'success') {
                appendLog('User Interaction Agent', 'Client Interface', "User chose to continue with a similar vibe track.", 'SUCCESS');
                renderStatusHeading.innerText = "Finding similar vibe music...";
                playerRenderingSpinner.classList.remove('hidden');
                startLogStream();
            }
        } catch(e) {
            appendLog('System', 'Server Deployment', 'Resolution fail: ' + e.message, 'ERROR');
        }
    } else if (action === 'upload') {
        const formData = new FormData();
        formData.append('action', 'upload');
        try {
            await fetch('/api/resolve', { method: 'POST', body: formData });
        } catch(e) {}
        
        appendLog('User Interaction Agent', 'Client Interface', "Switching to Music tab to upload custom audio track...", 'SUCCESS');
        
        // Switch to Music Tab
        const tabBtnMusic = document.getElementById('tab-btn-music');
        if (tabBtnMusic) tabBtnMusic.click();
        
        // Trigger file input click
        if (inputMusic) {
            inputMusic.click();
            alert("Choose your custom audio track from the file dialog, then click 'Analyze and Edit' to re-compile your video.");
        }
        btnSubmit.disabled = false;
        setSystemStatus('idle', 'Awaiting Custom Audio');
    }
}

// RESOLVE CLIP DISCREPANCY BUTTON CALL
async function resolveDiscrepancy(action) {
    activeAction = action;
    storyboardResolverBox.classList.add('hidden');
    setSystemStatus('running', 'Synthesizing Edits...');
    
    const formData = new FormData();
    formData.append('action', action);
    
    try {
        const response = await fetch('/api/resolve', {
            method: 'POST',
            body: formData
        });
        const res = await response.json();
        
        if (res.status === 'success') {
            appendLog('User Interaction Agent', 'Client Interface', `User choice resolved: '${action}'. Processing timeline adjustments...`, 'SUCCESS');
            
            // Set compiler spinner overlay
            if (action === 'generate') {
                renderStatusHeading.innerText = "Synthesizing AI Video Clip...";
                playerRenderingSpinner.classList.remove('hidden');
            } else if (action === 'upload') {
                renderStatusHeading.innerText = "Buffering Uploaded Shot...";
                playerRenderingSpinner.classList.remove('hidden');
            } else {
                renderStatusHeading.innerText = "Recalculating pacing...";
                playerRenderingSpinner.classList.remove('hidden');
            }
            
            // Re-open log stream to fetch rest of steps
            startLogStream();
        }
    } catch(e) {
        appendLog('System', 'Server Deployment', 'Resolution fail: ' + e.message, 'ERROR');
    }
}

// COMPLETE TIMELINE COMPILE STATE
function completeCompile() {
    playerRenderingSpinner.classList.add('hidden');
    setSystemStatus('completed', 'Rendering Complete');
    
    // Set video elements
    // Cache buster to force video reload
    mainVideoPlayer.src = `/static/edited_output.mp4?cb=${Date.now()}`;
    mainVideoPlayer.load();
    
    // Set grade overlay styling
    playerGradeOverlay.className = 'player-overlay moody-grade';
    
    // 1. Fetch dynamic timeline data from timeline_data.json
    fetch(`/static/timeline_data.json?cb=${Date.now()}`)
        .then(response => response.json())
        .then(timelineData => {
            if (timelineData) {
                videoDuration = timelineData.video_duration || videoDuration;
                timelineVideoClips = timelineData.video_clips || [];
                timelineTransitions = timelineData.transitions || [];
                timelineAudioBeats = timelineData.audio_beats || [];
            }
            
            // Fetch sound effects data
            return updateSfxTimelineData();
        })
        .then(() => {
            // 2. Fetch actual transcribed subtitles from subtitles.json
            return fetch(`/static/subtitles.json?cb=${Date.now()}`);
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.active === true) {
                if (data.captions && data.captions.length > 0) {
                    subtitleTimeline = data.captions;
                } else {
                    // Fallback to vibe-based captions
                    setupStoryboardDetails();
                }
                drawTimeline();
            } else {
                // Captions are disabled (bypassed)! Clear them!
                subtitleTimeline = [];
                drawTimeline();
            }
        })
        .catch(err => {
            console.log("Failed to load compiled timeline/subtitles:", err);
            setupStoryboardDetails();
            drawTimeline();
        });
    
    // Reset submit button
    btnSubmit.disabled = false;
    
    // Show reprompt panel after render
    const repromptPanel = document.getElementById('reprompt-panel');
    if (repromptPanel) {
        repromptPanel.classList.remove('hidden');
        const repromptText = document.getElementById('reprompt-text');
        if (repromptText) repromptText.value = document.getElementById('prompt').value;
    }
    
    // Force active state to Quality Review
    Object.values(agentCards).forEach(card => {
        card.className = 'agent-card success';
    });
    
    // Update the UI label to show the name of the dynamically downloaded music
    updateDynamicMusicLabel();
}

function setupStoryboardDetails() {
    const isSkipped = (activeAction === 'skip');
    // Read the duration directly from the player if loaded, otherwise fallback to standard
    videoDuration = mainVideoPlayer.duration || 12.0;
    
    subtitleTimeline = [];
    let phrases = [];
    
    if (currentVibe === 'cooking') {
        phrases = [
            "FRESH INGREDIENTS", "READY TO COOK", "SLICE AND DICE", 
            "PERFECT SECTIONS", "STIR THE HEAT", "LET IT BLEND", 
            "PLATE IT PRESTIGE", "BON APPETIT", "ENJOY EVERY BITE",
            "CREATIVE COOKING", "MASTER CHEF EDIT", "THANK YOU FOR WATCHING"
        ];
    } else if (currentVibe === 'tech') {
        phrases = [
            "START THE SETUP", "INITIALIZE DEV SCREEN", "WRITE THE CODE", 
            "RESOLVE DEPENDENCIES", "TYPE THE KEYBOARD", "BUILD SUCCESS", 
            "RUN THE COMPILER", "IT WORKS PERFECTLY", "DEPLOY TO PROD",
            "CLEAN INTERFACE", "PREMIUM DESIGN", "LIKE AND SUBSCRIBE"
        ];
    } else if (currentVibe === 'gym') {
        phrases = [
            "FOCUS ON THE GOAL", "NO EXCUSES", "PREPARE THE MIND", 
            "THE BODY WILL FOLLOW", "STRAP IN NOW", "LOCK THE WEIGHTS", 
            "PUSH YOUR LIMITS", "BECOME UNSTOPPABLE", "STAY DISCIPLINED",
            "THE LAST REP", "NO RETREAT NO SURRENDER", "RISE AND GRIND"
        ];
    } else {
        phrases = [
            "WELCOME BACK", "TO THE NEW VLOG", "TODAY WE ARE EDITING", 
            "DIRECT TO TIMELINE", "CHECK THIS AMAZING DETAIL", "TRANSITION GLIDE", 
            "LIKE AND SUBSCRIBE", "THANKS FOR WATCHING", "STAY TUNED FOR MORE",
            "CREATIVE HACKS", "SMOOTH CUTS ACTIVATED", "SEE YOU NEXT TIME"
        ];
    }
    
    // Distribute phrases at natural human-paced intervals: 2.5s duration, 0.8s gap
    let time = 0.0;
    let idx = 0;
    while (time < videoDuration && idx < phrases.length) {
        let duration = Math.min(2.5, videoDuration - time);
        if (duration < 1.0) break; // Skip tiny end clips
        subtitleTimeline.push({
            start: parseFloat(time.toFixed(1)),
            end: parseFloat((time + duration).toFixed(1)),
            text: phrases[idx]
        });
        time += duration + 0.8; // 0.8s gap
        idx++;
    }
}

// DRAW TIMELINE TRACKS DYNAMICALLY
function drawTimeline() {
    // Check if video is compiled and loaded yet
    const isCompiled = mainVideoPlayer.src && !mainVideoPlayer.src.endsWith('index.html') && mainVideoPlayer.src !== '';

    // 1. Time Ruler Ticks
    rulerTicks.innerHTML = '';
    const timelineWidth = 800 * timelineZoom;
    rulerTicks.style.width = `${timelineWidth}px`;
    
    const duration = isCompiled ? videoDuration : 10.0;
    
    // Draw tick labels for each second
    for (let i = 0; i <= duration; i++) {
        const tick = document.createElement('div');
        tick.className = 'time-tick';
        tick.style.left = `${(i / duration) * 100}%`;
        tick.innerText = `${i}s`;
        rulerTicks.appendChild(tick);
    }
    
    // 2. Video Clips Track Blocks
    trackVideoClips.innerHTML = '';
    trackVideoClips.style.width = `${timelineWidth}px`;
    
    let clips = [];
    if (isCompiled && timelineVideoClips.length > 0) {
        clips = timelineVideoClips;
    } else if (isCompiled) {
        const seg = videoDuration / 4;
        
        if (currentVibe === 'gym') {
            clips = [
                { name: "Chalk Hands Setup", start: 0.0, end: seg, color: "var(--color-primary)" },
                { name: "Athlete Mental Prep", start: seg, end: seg * 2, color: "var(--color-primary)" }
            ];
            if (activeAction === 'upload') {
                clips.push({ name: "Uploaded Straps", start: seg * 2, end: seg * 3, color: "var(--color-accent)" });
                clips.push({ name: "Heavy Deadlift Execution", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            } else if (activeAction === 'generate') {
                clips.push({ name: "AI Generated Straps B-Roll", start: seg * 2, end: seg * 3, color: "var(--color-warning)" });
                clips.push({ name: "Heavy Deadlift Execution", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            } else {
                clips.push({ name: "Heavy Deadlift Execution", start: seg * 2, end: videoDuration, color: "var(--color-primary)" });
            }
        } else if (currentVibe === 'cooking') {
            clips = [
                { name: "Wash Ingredients", start: 0.0, end: seg, color: "var(--color-primary)" },
                { name: "Chopping Prep", start: seg, end: seg * 2, color: "var(--color-primary)" }
            ];
            if (activeAction === 'upload') {
                clips.push({ name: "Uploaded Stir Pot Clip", start: seg * 2, end: seg * 3, color: "var(--color-accent)" });
                clips.push({ name: "Plating & Serve", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            } else if (activeAction === 'generate') {
                clips.push({ name: "AI Generated Stirring B-Roll", start: seg * 2, end: seg * 3, color: "var(--color-warning)" });
                clips.push({ name: "Plating & Serve", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            } else {
                clips.push({ name: "Plating & Serve", start: seg * 2, end: videoDuration, color: "var(--color-primary)" });
            }
        } else if (currentVibe === 'tech') {
            clips = [
                { name: "IDE Screen Setup", start: 0.0, end: seg, color: "var(--color-primary)" },
                { name: "Typing Workspace", start: seg, end: seg * 2, color: "var(--color-primary)" }
            ];
            if (activeAction === 'upload') {
                clips.push({ name: "Uploaded Keyboard Clip", start: seg * 2, end: seg * 3, color: "var(--color-accent)" });
                clips.push({ name: "Compiler Run Output", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            } else if (activeAction === 'generate') {
                clips.push({ name: "AI Generated Keypress B-Roll", start: seg * 2, end: seg * 3, color: "var(--color-warning)" });
                clips.push({ name: "Compiler Run Output", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            } else {
                clips.push({ name: "Compiler Run Output", start: seg * 2, end: videoDuration, color: "var(--color-primary)" });
            }
        } else {
            // Generic vlog / direct slice (activeAction is null if no reference was uploaded)
            const hasRef = (activeAction !== null);
            clips = [
                { name: "Vlog Raw Intro", start: 0.0, end: seg, color: "var(--color-primary)" },
                { name: "Primary Discussion", start: seg, end: seg * 2, color: "var(--color-primary)" }
            ];
            if (hasRef) {
                if (activeAction === 'upload') {
                    clips.push({ name: "Uploaded B-Roll Insert", start: seg * 2, end: seg * 3, color: "var(--color-accent)" });
                    clips.push({ name: "Summary Outro", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
                } else if (activeAction === 'generate') {
                    clips.push({ name: "AI Generated Vlog B-Roll", start: seg * 2, end: seg * 3, color: "var(--color-warning)" });
                    clips.push({ name: "Summary Outro", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
                } else {
                    clips.push({ name: "Summary Outro", start: seg * 2, end: videoDuration, color: "var(--color-primary)" });
                }
            } else {
                clips.push({ name: "Detailed Walkthrough", start: seg * 2, end: seg * 3, color: "var(--color-primary)" });
                clips.push({ name: "Closing Remarks Outro", start: seg * 3, end: videoDuration, color: "var(--color-primary)" });
            }
        }
    }
    
    clips.forEach(clip => {
        const block = document.createElement('div');
        block.className = 'video-block';
        block.style.left = `${(clip.start / duration) * 100}%`;
        block.style.width = `${((clip.end - clip.start) / duration) * 100}%`;
        block.style.borderLeftColor = clip.color;
        block.innerHTML = `<span>${clip.name}</span>`;
        trackVideoClips.appendChild(block);
    });

    // 3. Transition Markers
    trackTransitions.innerHTML = '';
    trackTransitions.style.width = `${timelineWidth}px`;
    let transitions = [];
    if (isCompiled && timelineTransitions.length > 0) {
        transitions = timelineTransitions;
    } else if (isCompiled) {
        transitions = [videoDuration * 0.25, videoDuration * 0.5];
        if (activeAction !== 'skip') {
            transitions.push(videoDuration * 0.75);
        }
    }
    transitions.forEach(time => {
        const marker = document.createElement('div');
        marker.className = 'transition-marker';
        marker.style.left = `calc(${(time / duration) * 100}% - 12px)`;
        marker.innerHTML = '<i data-lucide="zap" style="width:10px;height:10px;color:#000;"></i>';
        trackTransitions.appendChild(marker);
    });

    // 4. Captions Track Blocks
    trackCaptions.innerHTML = '';
    trackCaptions.style.width = `${timelineWidth}px`;
    if (isCompiled) {
        subtitleTimeline.forEach((sub, idx) => {
            const block = document.createElement('div');
            block.className = 'caption-block editable';
            block.style.left = `${(sub.start / duration) * 100}%`;
            block.style.width = `${((sub.end - sub.start) / duration) * 100}%`;
            block.innerHTML = `<span style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; padding:0 5px; cursor:pointer;">${sub.text}</span>`;
            block.title = "Click to edit caption text & timing";
            
            // Add click listener to edit this block
            block.addEventListener('click', (e) => {
                e.stopPropagation();
                openSubtitleEditor(idx);
            });
            
            trackCaptions.appendChild(block);
        });
    }

    // 5. Audio Beat Markers
    trackAudioBeats.innerHTML = '';
    trackAudioBeats.parentNode.style.width = `${timelineWidth}px`;
    let beats = [];
    if (isCompiled && timelineAudioBeats.length > 0) {
        beats = timelineAudioBeats;
    } else if (isCompiled) {
        for (let time = 0; time <= videoDuration; time += 1.25) {
            beats.push(time);
        }
    }
    beats.forEach(time => {
        if (time <= duration) {
            const marker = document.createElement('div');
            marker.className = 'beat-marker';
            marker.style.left = `${(time / duration) * 100}%`;
            trackAudioBeats.appendChild(marker);
        }
    });
    // 6. BG Music Track Blocks
    const trackBgMusic = document.getElementById('track-bg-music');
    if (trackBgMusic) {
        trackBgMusic.innerHTML = '';
        trackBgMusic.style.width = `${timelineWidth}px`;
        
        // Ensure relative positioning
        trackBgMusic.style.position = 'relative';

        if (timelineMusicTracks.length > 0) {
            timelineMusicTracks.forEach(t => {
                const block = document.createElement('div');
                block.className = 'music-block';
                block.dataset.id = t.id;
                
                const leftPct = (t.start / duration) * 100;
                const widthPct = ((t.end - t.start) / duration) * 100;
                
                block.style.left = `${leftPct}%`;
                block.style.width = `${widthPct}%`;
                block.style.borderLeftColor = 'var(--color-primary)';
                block.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)';
                
                let trackName = t.track.split('/').pop();
                
                block.innerHTML = `
                    <div class="resize-handle resize-handle-left"></div>
                    <span style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 10px; pointer-events:none;">${trackName} (${Math.round(t.volume * 100)}%)</span>
                    <div class="resize-handle resize-handle-right"></div>
                `;

                // Single click to open editor
                block.addEventListener('click', (e) => {
                    if (block.dataset.dragged === 'true') {
                        block.removeAttribute('data-dragged');
                        return;
                    }
                    openTrackEditor(t.id);
                });

                // Attach drag & resize event listeners
                setupTrackDragResize(block, t);
                
                trackBgMusic.appendChild(block);
            });
        } else {
            trackBgMusic.innerHTML = '<span style="font-size:10px; color:rgba(255,255,255,0.3); padding:8px; display:block;">Click "+" on Backing Track header to add audio</span>';
        }
    }

    // 7. SFX Track Blocks
    const trackSfxBlocks = document.getElementById('track-sfx-blocks');
    if (trackSfxBlocks) {
        trackSfxBlocks.innerHTML = '';
        trackSfxBlocks.style.width = `${timelineWidth}px`;
        
        // Ensure relative positioning
        trackSfxBlocks.style.position = 'relative';

        if (timelineSfxClips.length > 0) {
            timelineSfxClips.forEach(s => {
                const block = document.createElement('div');
                block.className = 'music-block sfx-block';
                block.dataset.id = s.id;
                
                const leftPct = (s.start / duration) * 100;
                const widthPct = ((s.end - s.start) / duration) * 100;
                
                block.style.left = `${leftPct}%`;
                block.style.width = `${widthPct}%`;
                block.style.borderLeftColor = 'var(--color-accent)';
                block.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)';
                
                let trackName = s.track.split('/').pop();
                
                block.innerHTML = `
                    <div class="resize-handle resize-handle-left"></div>
                    <span style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 10px; pointer-events:none;">${trackName} (${Math.round(s.volume * 100)}%)</span>
                    <div class="resize-handle resize-handle-right"></div>
                `;

                // Single click to open editor
                block.addEventListener('click', (e) => {
                    if (block.dataset.dragged === 'true') {
                        block.removeAttribute('data-dragged');
                        return;
                    }
                    openTrackEditor(s.id, 'sfx');
                });

                // Attach drag & resize event listeners
                setupTrackDragResize(block, s, 'sfx');
                
                trackSfxBlocks.appendChild(block);
            });
        } else {
            trackSfxBlocks.innerHTML = '<span style="font-size:10px; color:rgba(255,255,255,0.3); padding:8px; display:block;">Click "+" on Sound FX header to add audio</span>';
        }
    }
    
    // Re-bind Lucide icons inside timeline
    lucide.createIcons();
}

// SETUP TIMELINE ZOOM SCROLLS
function setupTimelineZoom() {
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        if (timelineZoom < 2.5) {
            timelineZoom += 0.25;
            drawTimeline();
            updatePlayheadPosition();
        }
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        if (timelineZoom > 0.5) {
            timelineZoom -= 0.25;
            drawTimeline();
            updatePlayheadPosition();
        }
    });
}

// PREVIEW PLAYER ASPECT RATIO & DISPLAY CONTROLS
let currentPlayerAspectMode = 'auto';
let currentPlayerFitMode = 'contain';

function updatePlayerAspectFromMetadata() {
    const container = document.getElementById('player-container');
    const resText = document.getElementById('player-res-text');
    const aspectText = document.getElementById('player-aspect-text');
    if (!mainVideoPlayer || !container) return;

    const w = mainVideoPlayer.videoWidth;
    const h = mainVideoPlayer.videoHeight;
    if (!w || !h) return;

    if (resText) {
        resText.innerText = `${w} × ${h}`;
    }

    const ratio = w / h;
    let label = 'Auto';
    if (Math.abs(ratio - (9 / 16)) < 0.08) {
        label = '9:16 (Reel)';
    } else if (Math.abs(ratio - (16 / 9)) < 0.08) {
        label = '16:9 (Landscape)';
    } else if (Math.abs(ratio - 1) < 0.08) {
        label = '1:1 (Square)';
    } else if (Math.abs(ratio - (4 / 5)) < 0.08) {
        label = '4:5 (Portrait)';
    } else {
        label = `${ratio.toFixed(2)}:1`;
    }

    if (aspectText) {
        aspectText.innerText = label;
    }

    if (currentPlayerAspectMode === 'auto') {
        container.style.setProperty('--player-aspect-ratio', `${ratio}`);
    }
}

window.setPlayerAspect = function(mode) {
    currentPlayerAspectMode = mode;
    const container = document.getElementById('player-container');
    const aspectText = document.getElementById('player-aspect-text');
    
    // Update button active state
    ['auto', '9-16', '16-9', '1-1'].forEach(m => {
        const btn = document.getElementById('btn-aspect-' + m);
        if (btn) {
            btn.classList.toggle('active', (m === '9-16' && mode === '9:16') ||
                                          (m === '16-9' && mode === '16:9') ||
                                          (m === '1-1' && mode === '1:1') ||
                                          (m === 'auto' && mode === 'auto'));
        }
    });

    if (!container) return;

    if (mode === 'auto') {
        updatePlayerAspectFromMetadata();
    } else if (mode === '9:16') {
        container.style.setProperty('--player-aspect-ratio', '9 / 16');
        if (aspectText) aspectText.innerText = '9:16 (Reel)';
    } else if (mode === '16:9') {
        container.style.setProperty('--player-aspect-ratio', '16 / 9');
        if (aspectText) aspectText.innerText = '16:9 (Landscape)';
    } else if (mode === '1:1') {
        container.style.setProperty('--player-aspect-ratio', '1 / 1');
        if (aspectText) aspectText.innerText = '1:1 (Square)';
    }
};

window.togglePlayerFit = function() {
    const container = document.getElementById('player-container');
    const btn = document.getElementById('btn-player-fit');
    if (!container) return;

    if (currentPlayerFitMode === 'contain') {
        currentPlayerFitMode = 'cover';
        container.classList.add('fit-cover');
        if (btn) btn.innerText = 'Fill: Zoom';
    } else {
        currentPlayerFitMode = 'contain';
        container.classList.remove('fit-cover');
        if (btn) btn.innerText = 'Fit: Full';
    }
};

window.togglePlayerFullscreen = function() {
    const frame = document.getElementById('preview-player-frame') || document.getElementById('player-container');
    if (!frame) return;

    if (!document.fullscreenElement) {
        if (frame.requestFullscreen) {
            frame.requestFullscreen();
        } else if (frame.webkitRequestFullscreen) {
            frame.webkitRequestFullscreen();
        } else if (frame.msRequestFullscreen) {
            frame.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

// PREVIEW PLAYER SETUP CONTROLS
function setupPlayerControls() {
    // Play/Pause Click events
    const togglePlay = () => {
        if (mainVideoPlayer.paused) {
            mainVideoPlayer.play();
            soundtrackAudio.play();
            setPlayState(true);
        } else {
            mainVideoPlayer.pause();
            soundtrackAudio.pause();
            setPlayState(false);
        }
    };
    
    btnPlayPause.addEventListener('click', togglePlay);
    btnPlayPauseOverlay.addEventListener('click', togglePlay);
    mainVideoPlayer.addEventListener('click', togglePlay);
    
    // Listen to video loading and synchronize duration dynamically
    mainVideoPlayer.addEventListener('loadedmetadata', () => {
        videoDuration = mainVideoPlayer.duration;
        playerTimeDisplay.innerText = `00:00 / ${formatTime(videoDuration)}`;
        updatePlayerAspectFromMetadata();
        if (systemStatus === 'idle') {
            setupStoryboardDetails();
        }
        drawTimeline();
    });
    
    // Scrubber movement
    mainVideoPlayer.addEventListener('timeupdate', () => {
        if (!mainVideoPlayer.duration) return;
        
        const current = mainVideoPlayer.currentTime;
        const duration = mainVideoPlayer.duration;
        
        // Match soundtrack audio sync
        if (Math.abs(soundtrackAudio.currentTime - current) > 0.15) {
            soundtrackAudio.currentTime = current;
        }
        
        // Update slider input
        playerProgressBar.value = (current / duration) * 100;
        
        // Update time display
        playerTimeDisplay.innerText = `${formatTime(current)} / ${formatTime(duration)}`;
        
        // Scroll timeline playhead
        updatePlayheadPosition();
        
        // Animate subtitle track
        renderLiveSubtitle(current);
        // Render live text overlays
        renderLiveTextOverlays(current);
    });

    playerProgressBar.addEventListener('input', () => {
        const pct = playerProgressBar.value;
        const targetTime = (pct / 100) * mainVideoPlayer.duration;
        mainVideoPlayer.currentTime = targetTime;
        soundtrackAudio.currentTime = targetTime;
        updatePlayheadPosition();
    });

    // Mute control
    btnVolume.addEventListener('click', () => {
        const isMuted = mainVideoPlayer.muted;
        mainVideoPlayer.muted = !isMuted;
        soundtrackAudio.muted = !isMuted;
        
        if (isMuted) {
            volumeIcon.setAttribute('data-lucide', 'volume-2');
        } else {
            volumeIcon.setAttribute('data-lucide', 'volume-x');
        }
        lucide.createIcons();
    });
}

function setPlayState(isPlaying) {
    if (isPlaying) {
        playIcon.setAttribute('data-lucide', 'pause');
        playIconOverlay.setAttribute('data-lucide', 'pause');
    } else {
        playIcon.setAttribute('data-lucide', 'play');
        playIconOverlay.setAttribute('data-lucide', 'play');
    }
    lucide.createIcons();
}

function updatePlayheadPosition() {
    if (!mainVideoPlayer.duration) return;
    
    const pct = mainVideoPlayer.currentTime / mainVideoPlayer.duration;
    const timelineWidth = 800 * timelineZoom;
    const playheadOffset = 200; // Left padding matching track header
    
    const targetLeft = playheadOffset + (pct * timelineWidth);
    timelinePlayheadLine.style.left = `${targetLeft}px`;
    
    // Auto-scroll timeline container to keep playhead in view
    const scrollContainerWidth = timelineContainer.clientWidth;
    if (targetLeft > scrollContainerWidth - 100) {
        timelineContainer.scrollLeft = targetLeft - scrollContainerWidth + 200;
    } else if (targetLeft < timelineContainer.scrollLeft + playheadOffset) {
        timelineContainer.scrollLeft = targetLeft - playheadOffset;
    }
}

function renderLiveSubtitle(time) {
    const activeSub = subtitleTimeline.find(sub => time >= sub.start && time <= sub.end);
    
    if (activeSub) {
        if (captionText.innerText !== activeSub.text) {
            captionText.innerText = activeSub.text;
            captionText.className = 'caption-word caption-pop';
            // Remove pop class after animation completes
            setTimeout(() => {
                captionText.classList.remove('caption-pop');
            }, 250);
        }
    } else {
        captionText.innerText = '';
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Setup Subtitle Editor Modal and Buttons Action Listeners
function setupSubtitleEditor() {
    // Hide modal on load
    subtitleEditorModal.classList.add('hidden');
    
    // Modal buttons
    btnCancelEdit.addEventListener('click', () => {
        subtitleEditorModal.classList.add('hidden');
    });
    
    btnSaveEdit.addEventListener('click', () => {
        if (currentEditingIndex === -1) return;
        
        const newText = editCaptionText.value.trim();
        const newStart = parseFloat(editCaptionStart.value);
        const newEnd = parseFloat(editCaptionEnd.value);
        
        if (!newText) {
            alert("Caption text cannot be empty.");
            return;
        }
        if (isNaN(newStart) || isNaN(newEnd) || newStart >= newEnd || newStart < 0) {
            alert("Please enter valid start and end times (start must be less than end).");
            return;
        }
        
        // Update model
        subtitleTimeline[currentEditingIndex].text = newText;
        subtitleTimeline[currentEditingIndex].start = newStart;
        subtitleTimeline[currentEditingIndex].end = newEnd;
        
        // Sort timeline by start time
        subtitleTimeline.sort((a, b) => a.start - b.start);
        
        // Redraw timeline and hide modal
        drawTimeline();
        subtitleEditorModal.classList.add('hidden');
        
        appendLog('System', 'Client Interface', `Edited subtitle segment updated locally. Click 'Save Edits' to write to file and sync.`, 'INFO');
    });
    
    // Save Edits Button
    btnSaveTimeline.addEventListener('click', async () => {
        setSystemStatus('running', 'Saving Edits...');
        try {
            const response = await fetch('/api/save-subtitles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ captions: subtitleTimeline })
            });
            const res = await response.json();
            if (res.status === 'success') {
                setSystemStatus('completed', 'Edits Saved');
                appendLog('System', 'Server Deployment', 'Subtitle edits successfully written to server. Refreshing tracks...', 'SUCCESS');
                // Force reload of VTT track in player
                playerTrack.src = `/static/subtitles.vtt?cb=${Date.now()}`;
                // Reload track element inside player to force browser update
                playerTrack.parentNode.replaceChild(playerTrack.cloneNode(true), playerTrack);
            } else {
                throw new Error(res.message);
            }
        } catch(e) {
            setSystemStatus('completed', 'Save Failed');
            appendLog('System', 'Server Deployment', 'Save edits fail: ' + e.message, 'ERROR');
        }
    });
    
    // Download Video warning
    btnDownloadVideo.addEventListener('click', (e) => {
        const isCompiled = mainVideoPlayer.src && !mainVideoPlayer.src.endsWith('index.html') && mainVideoPlayer.src !== '';
        if (!isCompiled) {
            e.preventDefault();
            alert("Please upload raw footage and compile your edit first before downloading.");
        }
    });
    
    // Download VTT warning
    btnDownloadVtt.addEventListener('click', (e) => {
        const isCompiled = mainVideoPlayer.src && !mainVideoPlayer.src.endsWith('index.html') && mainVideoPlayer.src !== '';
        if (!isCompiled) {
            e.preventDefault();
            alert("No subtitle track available to export. Compile your edit first.");
        }
    });
}

// Global scope helper called by caption block click
window.openSubtitleEditor = function(index) {
    if (index < 0 || index >= subtitleTimeline.length) return;
    currentEditingIndex = index;
    const sub = subtitleTimeline[index];
    
    editCaptionText.value = sub.text;
    editCaptionStart.value = sub.start;
    editCaptionEnd.value = sub.end;
    
    subtitleEditorModal.classList.remove('hidden');
};

// TEXT OVERLAY MANAGEMENT
function setupTextOverlays() {
    const btnAdd = document.getElementById('btn-add-text-overlay');
    if (!btnAdd) return;
    btnAdd.addEventListener('click', () => {
        const text = document.getElementById('text-overlay-content').value.trim();
        const start = parseFloat(document.getElementById('text-overlay-start').value) || 0;
        const end = parseFloat(document.getElementById('text-overlay-end').value) || 3;
        const position = document.getElementById('text-overlay-position').value;
        const style = document.getElementById('text-overlay-style').value;
        if (!text) { alert('Please enter text for the overlay.'); return; }
        if (end <= start) { alert('End time must be after start time.'); return; }
        const id = ++assetIdCounter;
        textOverlays.push({ text, start, end, position, style, id });
        renderTextOverlayList();
        document.getElementById('text-overlay-content').value = '';
    });
}

function renderTextOverlayList() {
    const list = document.getElementById('text-overlay-list');
    if (!list) return;
    const emptyEl = document.getElementById('text-empty');
    if (emptyEl) emptyEl.style.display = textOverlays.length ? 'none' : 'flex';
    list.querySelectorAll('.text-overlay-tag').forEach(el => el.remove());
    textOverlays.forEach(overlay => {
        const tag = document.createElement('div');
        tag.className = 'text-overlay-tag';
        tag.innerHTML = `
            <div class="text-overlay-tag-info">
                <div class="text-overlay-tag-text">${overlay.text}</div>
                <div class="text-overlay-tag-meta">${overlay.start}s–${overlay.end}s · ${overlay.position} · ${overlay.style}</div>
            </div>
            <button class="text-overlay-tag-del" onclick="removeTextOverlay(${overlay.id})" type="button" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
        list.appendChild(tag);
    });
}
window.removeTextOverlay = function(id) {
    textOverlays = textOverlays.filter(o => o.id !== id);
    renderTextOverlayList();
};

// REPROMPT SYSTEM
// AI SUPERVISOR REFINEMENT SYSTEM
function setupReprompt() {
    const btnReprompt = document.getElementById('btn-reprompt');
    const btnFresh = document.getElementById('btn-start-fresh');
    const statusBox = document.getElementById('supervisor-status-box');
    if (!btnReprompt || !btnFresh) return;

    // Quick Pill clicks
    document.querySelectorAll('.btn-supervisor-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const txt = document.getElementById('reprompt-text');
            if (txt) {
                const currentVal = txt.value.trim();
                const toAdd = pill.dataset.prompt;
                if (currentVal) {
                    txt.value = currentVal + ', ' + toAdd;
                } else {
                    txt.value = toAdd;
                }
            }
        });
    });

    btnReprompt.addEventListener('click', async () => {
        const newPrompt = document.getElementById('reprompt-text').value.trim();
        if (!newPrompt) { alert('Please enter your feedback or adjustments.'); return; }

        btnReprompt.disabled = true;
        btnReprompt.innerHTML = '<i data-lucide="loader"></i> Supervisor Refining...';
        if (window.lucide) lucide.createIcons();

        if (statusBox) {
            statusBox.classList.remove('hidden');
            statusBox.innerHTML = '⚡ <b>Supervisor AI:</b> Analyzing feedback & re-rendering video...';
        }

        try {
            const res = await fetch('/api/template/supervisor-refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: newPrompt })
            });
            const data = await res.json();
            if (data.status === 'success') {
                if (statusBox) {
                    statusBox.innerHTML = `✨ <b>Supervisor Applied:</b> ${data.explanation || 'Refinements rendered.'}`;
                }
                // Reload video in player
                if (mainVideoPlayer && data.video_url) {
                    mainVideoPlayer.src = data.video_url;
                    mainVideoPlayer.load();
                    mainVideoPlayer.play().catch(() => {});
                }
                const logEl = document.getElementById('console-logs');
                if (logEl) {
                    logEl.innerHTML += `<div class="log-line system">[Supervisor] ${data.explanation}</div>`;
                }
            } else {
                alert('Supervisor refinement failed: ' + (data.detail || data.message));
            }
        } catch(e) {
            alert('Supervisor request failed: ' + e.message);
        } finally {
            btnReprompt.disabled = false;
            btnReprompt.innerHTML = '<i data-lucide="sparkles"></i> Apply AI Refinement';
            if (window.lucide) lucide.createIcons();
        }
    });

    btnFresh.addEventListener('click', () => {
        document.getElementById('reprompt-panel').classList.add('hidden');
        resetWorkspace();
    });

    // Frame-by-Frame Comparison Supervisor Audit
    const btnFrameAudit = document.getElementById('btn-run-frame-audit');
    const compTray = document.getElementById('supervisor-comparison-tray');
    const compSummary = document.getElementById('supervisor-comparison-summary');
    const compCarousel = document.getElementById('supervisor-comparison-carousel');

    if (btnFrameAudit) {
        btnFrameAudit.addEventListener('click', async () => {
            btnFrameAudit.disabled = true;
            btnFrameAudit.innerHTML = '<i data-lucide="loader"></i> Comparing Frames...';
            if (window.lucide) lucide.createIcons();

            if (compTray) compTray.classList.remove('hidden');
            if (compSummary) compSummary.innerHTML = '<div style="font-size:0.75rem; color:#cbd5e1; display:flex; align-items:center; gap:6px;"><i data-lucide="loader" style="width:14px; height:14px;"></i> Extracting key frames & running computer vision comparison...</div>';
            if (window.lucide) lucide.createIcons();

            try {
                const res = await fetch('/api/supervisor/compare');
                const data = await res.json();
                if (data.status === 'success' && data.report) {
                    renderFrameComparisonReport(data.report);
                } else {
                    if (compSummary) compSummary.innerHTML = `<div style="color:#f87171; font-size:0.75rem;">Audit Error: ${data.detail || 'Could not complete frame audit'}</div>`;
                }
            } catch (err) {
                if (compSummary) compSummary.innerHTML = `<div style="color:#f87171; font-size:0.75rem;">Failed to fetch frame comparison: ${err.message}</div>`;
            } finally {
                btnFrameAudit.disabled = false;
                btnFrameAudit.innerHTML = '<i data-lucide="scan"></i> Inspect Frames';
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    // AUTONOMOUS CLOSED-LOOP SELF-HEALING SUPERVISOR
    const btnAutoHeal = document.getElementById('btn-auto-heal-discrepancies');
    if (btnAutoHeal) {
        btnAutoHeal.addEventListener('click', async () => {
            btnAutoHeal.disabled = true;
            btnAutoHeal.innerHTML = '<i data-lucide="loader"></i> Self-Healing...';
            if (window.lucide) lucide.createIcons();

            if (statusBox) {
                statusBox.classList.remove('hidden');
                statusBox.innerHTML = '⚡ <b>Autonomous Supervisor:</b> Auditing discrepancies & auto-correcting parameters in closed loop...';
            }
            if (compTray) compTray.classList.remove('hidden');
            if (compSummary) compSummary.innerHTML = '<div style="font-size:0.75rem; color:#cbd5e1; display:flex; align-items:center; gap:6px;"><i data-lucide="loader" style="width:14px; height:14px;"></i> Running autonomous closed-loop self-correction (audit ➔ prescribe ➔ re-render)...</div>';
            if (window.lucide) lucide.createIcons();

            try {
                const res = await fetch('/api/supervisor/auto-heal', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success') {
                    if (statusBox) {
                        statusBox.innerHTML = `✨ <b>Self-Healing Complete:</b> ${data.explanation}`;
                    }
                    if (mainVideoPlayer && data.video_url) {
                        mainVideoPlayer.src = data.video_url;
                        mainVideoPlayer.load();
                        mainVideoPlayer.play().catch(() => {});
                    }
                    if (data.report) {
                        renderFrameComparisonReport(data.report);
                    }
                    const logEl = document.getElementById('console-logs');
                    if (logEl) {
                        logEl.innerHTML += `<div class="log-line system">[Self-Healing] ${data.explanation}</div>`;
                    }
                } else {
                    alert('Auto-healing failed: ' + (data.detail || data.message));
                }
            } catch (err) {
                alert('Auto-healing request error: ' + err.message);
            } finally {
                btnAutoHeal.disabled = false;
                btnAutoHeal.innerHTML = '<i data-lucide="sparkles"></i> Auto-Heal';
                if (window.lucide) lucide.createIcons();
            }
        });
    }
}

// RENDER FRAME-BY-FRAME COMPARISON REPORT IN SUPERVISOR PANEL
function renderFrameComparisonReport(report) {
    const compTray = document.getElementById('supervisor-comparison-tray');
    const compSummary = document.getElementById('supervisor-comparison-summary');
    const compCarousel = document.getElementById('supervisor-comparison-carousel');
    if (!compTray || !compSummary || !compCarousel) return;

    compTray.classList.remove('hidden');

    const score = report.overall_score || 0;
    const scoreColor = score >= 90 ? '#4ade80' : score >= 80 ? '#fbbf24' : '#f87171';
    const scoreBg = score >= 90 ? 'rgba(34,197,94,0.15)' : score >= 80 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)';

    let selfHealingHtml = '';
    if (report.self_healing && report.self_healing.self_healing_applied) {
        const sh = report.self_healing;
        const acts = (sh.actions_taken || []).map(a => `<li>${a}</li>`).join('');
        selfHealingHtml = `
            <div style="margin-top:8px; padding:6px 10px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:6px; font-size:0.72rem; color:#86efac;">
                <div style="font-weight:700; display:flex; align-items:center; gap:4px;">
                    <span>✨ Autonomous Self-Healing Applied:</span>
                    <span style="color:#fff;">${sh.initial_score}% ➔ ${sh.final_score}% (${sh.iterations_run} cycle${sh.iterations_run > 1 ? 's' : ''})</span>
                </div>
                ${acts ? `<ul style="margin:4px 0 0 16px; padding:0; line-height:1.3; color:#cbd5e1;">${acts}</ul>` : ''}
            </div>
        `;
    }

    compSummary.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="background:${scoreBg}; color:${scoreColor}; font-weight:800; font-size:1.1rem; padding:4px 10px; border-radius:8px; border:1px solid ${scoreColor}40;">
                    ${score}%
                </div>
                <div>
                    <div style="font-size:0.82rem; font-weight:700; color:#fff;">Overall Reference Fidelity</div>
                    <div style="font-size:0.70rem; color:rgba(255,255,255,0.6);">${report.frames_audited || 0} Key Frames Analyzed (Text, Occlusion, Lighting)</div>
                </div>
            </div>
            <span class="badge" style="background:rgba(139,92,246,0.2); color:#c4b5fd; font-size:0.68rem; padding:3px 8px; border-radius:12px;">Automated CV Audit</span>
        </div>
        <div style="font-size:0.73rem; color:#cbd5e1; line-height:1.4; background:rgba(0,0,0,0.25); padding:6px 10px; border-radius:6px; border-left:3px solid ${scoreColor};">
            ${report.verdict || 'Visual alignment verified against reference clip.'}
        </div>
        ${selfHealingHtml}
    `;

    compCarousel.innerHTML = '';
    const frames = report.frame_results || [];
    frames.forEach(f => {
        const frameScore = f.score || 0;
        const fColor = frameScore >= 90 ? '#4ade80' : frameScore >= 80 ? '#fbbf24' : '#f87171';
        const card = document.createElement('div');
        card.className = 'comparison-frame-card';
        card.style.cssText = 'background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px;';

        const refWordsStr = (f.ref_words && f.ref_words.length) ? f.ref_words.join(', ') : 'None / Graphic';
        const outWordsStr = (f.out_words && f.out_words.length) ? f.out_words.join(', ') : 'None / Graphic';

        card.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <button type="button" class="btn-time-jump" onclick="seekPlayerToTime(${f.time})" style="background:rgba(139,92,246,0.25); border:none; border-radius:4px; padding:2px 6px; color:#c4b5fd; font-size:0.72rem; cursor:pointer; font-weight:600;" title="Click to jump player">
                        ⏱️ ${f.time.toFixed(1)}s
                    </button>
                    <span style="font-size:0.72rem; color:rgba(255,255,255,0.5);">Key Frame</span>
                </div>
                <span style="font-size:0.74rem; font-weight:700; color:${fColor}; background:${fColor}15; padding:2px 8px; border-radius:10px; border:1px solid ${fColor}30;">
                    ${frameScore}% Match
                </span>
            </div>
            <div style="position:relative; border-radius:6px; overflow:hidden; border:1px solid rgba(255,255,255,0.12); cursor:pointer;" onclick="window.open('${f.image_url}', '_blank')" title="Click to view high-resolution inspection composite">
                <img src="${f.image_url}?t=${Date.now()}" alt="Comparison at ${f.time}s" style="width:100%; display:block; aspect-ratio: 16/9; object-fit: cover;" loading="lazy">
                <div style="position:absolute; bottom:4px; right:6px; background:rgba(0,0,0,0.7); font-size:0.62rem; color:#cbd5e1; padding:2px 6px; border-radius:4px;">
                    🔍 Click to Enlarge [REF | OUTPUT]
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.68rem; color:rgba(255,255,255,0.7); background:rgba(0,0,0,0.2); padding:6px; border-radius:4px;">
                <div><b>Ref Text:</b> <span style="color:#e2e8f0;">${refWordsStr}</span></div>
                <div><b>Out Text:</b> <span style="color:#e2e8f0;">${outWordsStr}</span></div>
                <div><b>Edge Contrast:</b> ${f.contrast_score}%</div>
                <div><b>Luminance Match:</b> ${f.lum_match}%</div>
            </div>
        `;
        compCarousel.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

window.seekPlayerToTime = function(sec) {
    if (mainVideoPlayer) {
        mainVideoPlayer.currentTime = sec;
        mainVideoPlayer.pause();
    }
};

// LIVE TEXT OVERLAY RENDERER IN PLAYER
function renderLiveTextOverlays(time) {
    document.querySelectorAll('.active-text-overlay').forEach(el => el.remove());
    
    const playerContainer = document.querySelector('.player-container');
    if (!playerContainer || !textOverlays.length) return;
    
    const active = textOverlays.filter(o => time >= o.start && time <= o.end);
    active.forEach(overlay => {
        const el = document.createElement('div');
        el.className = 'active-text-overlay';
        el.textContent = overlay.text;
        
        const posMap = { top: '8%', center: '50%', bottom: '85%' };
        el.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${posMap[overlay.position] || '85%'};
            transform: translateX(-50%) ${overlay.position === 'center' ? 'translateY(-50%)' : ''};
            pointer-events: none;
            z-index: 20;
            padding: 6px 14px;
            border-radius: 6px;
            font-family: var(--font-ui);
            font-size: clamp(12px, 2vw, 18px);
            white-space: nowrap;
            max-width: 90%;
            text-align: center;
        `;
        
        if (overlay.style === 'bold') {
            el.style.fontWeight = '800';
            el.style.textTransform = 'uppercase';
            el.style.color = '#fff';
            el.style.textShadow = '0 2px 6px rgba(0,0,0,0.8)';
        } else if (overlay.style === 'neon') {
            el.style.color = '#a78bfa';
            el.style.textShadow = '0 0 10px #8b5cf6, 0 0 20px #8b5cf6';
            el.style.fontWeight = '700';
        } else if (overlay.style === 'outline') {
            el.style.color = '#fff';
            el.style.webkitTextStroke = '1.5px #000';
            el.style.fontWeight = '700';
        } else {
            el.style.color = '#fff';
            el.style.textShadow = '0 1px 4px rgba(0,0,0,0.6)';
        }
        
        playerContainer.appendChild(el);
    });
}

// UI Credits display helper
function updateCreditsUI(credits) {
    const countEl = document.getElementById('credits-count');
    const exhaustedEl = document.getElementById('credits-exhausted-text');
    const widgetEl = document.getElementById('credits-widget');
    if (!countEl || !widgetEl) return;
    
    countEl.textContent = credits;
    if (credits <= 0) {
        widgetEl.classList.add('exhausted');
        if (exhaustedEl) exhaustedEl.classList.remove('hidden');
    } else {
        widgetEl.classList.remove('exhausted');
        if (exhaustedEl) exhaustedEl.classList.add('hidden');
    }
}

// Restore UI state on page refresh
async function restoreJobState() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        if (data.status === 'success' && data.job_state) {
            const state = data.job_state;
            
            if (state.ai_credits !== undefined) {
                updateCreditsUI(state.ai_credits);
            }
            
            // Restore prompt
            if (state.prompt) {
                document.getElementById('prompt').value = state.prompt;
            }
            
            // If the job was completed previously, restore the video player and subtitles
            if (state.status === 'completed') {
                systemStatus = 'completed';
                systemStatusPill.className = 'status-pill status-success';
                systemStatusText.textContent = 'Rendering Complete';
                
                mainVideoPlayer.src = '/static/edited_output.mp4?cb=' + Date.now();
                mainVideoPlayer.load();
                
                // Show reprompt panel
                const repromptPanel = document.getElementById('reprompt-panel');
                if (repromptPanel) repromptPanel.classList.remove('hidden');
                
                // Fetch dynamic timeline data from timeline_data.json first
                try {
                    const timelineResponse = await fetch(`/static/timeline_data.json?cb=${Date.now()}`);
                    const timelineData = await timelineResponse.json();
                    if (timelineData) {
                        videoDuration = timelineData.video_duration || videoDuration;
                        timelineVideoClips = timelineData.video_clips || [];
                        timelineTransitions = timelineData.transitions || [];
                        timelineAudioBeats = timelineData.audio_beats || [];
                    }
                } catch (err) {
                    console.log('Failed to fetch timeline data on restore:', err);
                }
                
                // Load subtitles and overlays
                try {
                    const subResponse = await fetch('/static/subtitles.json');
                    const subData = await subResponse.json();
                    if (subData.captions) {
                        subtitleTimeline = subData.captions;
                        renderSubtitleTimeline();
                    }
                } catch (err) {
                    console.log('No subtitles found on restore.', err);
                }
                    
                try {
                    const overResponse = await fetch('/static/text_overlays.json');
                    const overData = await overResponse.json();
                    if (Array.isArray(overData)) {
                        textOverlays = overData;
                        renderTextOverlayList();
                    }
                } catch (err) {
                    console.log('No text overlays found on restore.', err);
                }
                
                updateDynamicMusicLabel();
                updateSfxTimelineData().then(() => drawTimeline());
            }
        }
    } catch (e) {
        console.log('Failed to restore job state:', e);
    }
}

function updateDynamicMusicLabel() {
    fetch('/static/music_plan.json?cb=' + Date.now())
        .then(res => res.json())
        .then(musicData => {
            if (musicData && musicData.tracks) {
                timelineMusicTracks = musicData.tracks.map((t, idx) => ({
                    id: idx + 1,
                    track: t.track,
                    volume: t.volume !== undefined ? t.volume : 0.15,
                    start: t.start !== undefined ? t.start : 0.0,
                    end: t.end !== undefined ? t.end : (videoDuration || 12.0)
                }));
                drawTimeline();
            }
            if (musicData && musicData.tracks && musicData.tracks.length > 0 && musicAssets.length === 0) {
                const trackPath = musicData.tracks[0].track;
                let trackName = trackPath.split('/').pop();
                const labelSpan = document.querySelector('.default-track-card .asset-track-name');
                if (labelSpan) {
                    labelSpan.innerHTML = `🎵 ${trackName} (Dynamic Audio)`;
                }
            }
        })
        .catch(e => console.log('Failed to fetch music plan for label update.'));
}

function updateSfxTimelineData() {
    return fetch('/static/sfx_plan.json?cb=' + Date.now())
        .then(res => res.json())
        .then(sfxData => {
            if (sfxData) {
                timelineSfxTracks = sfxData.tracks || [];
                
                if (sfxData.edited_by_user) {
                    timelineSfxClips = (sfxData.placements || []).map((p, idx) => ({
                        id: idx + 1,
                        track: p.track,
                        volume: p.volume !== undefined ? p.volume : 0.30,
                        start: p.start !== undefined ? p.start : 0.0,
                        end: p.end !== undefined ? p.end : 1.0
                    }));
                    timelineSfxPlacements = timelineSfxClips.map(c => c.start);
                } else {
                    let defaultSfxFile = "music/swoosh_soft.wav";
                    if (currentVibe === 'gym') {
                        defaultSfxFile = "music/whip-swoosh.wav";
                    } else if (currentVibe === 'cooking') {
                        defaultSfxFile = "music/fry_sizzle.wav";
                    }
                    
                    timelineSfxPlacements = sfxData.placements || [];
                    timelineSfxClips = timelineSfxPlacements.map((time, idx) => ({
                        id: idx + 1,
                        track: sfxData.tracks && sfxData.tracks.length > 0 ? sfxData.tracks[0].track : defaultSfxFile,
                        volume: sfxData.volume !== undefined ? sfxData.volume : 0.30,
                        start: time,
                        end: time + 1.2  // default 1.2s swoosh duration
                    }));
                }
                drawTimeline();
            }
        })
        .catch(e => console.log('Failed to fetch SFX plan.'));
}

// DRAG AND RESIZE BACKGROUND MUSIC & SFX TRACKS
function setupTrackDragResize(block, track, type = 'music') {
    let startX = 0;
    let startLeft = 0;
    let startWidth = 0;
    let mode = ''; // 'drag', 'resize-left', 'resize-right'
    
    const containerId = type === 'music' ? 'track-bg-music' : 'track-sfx-blocks';
    const container = document.getElementById(containerId);
    
    // Left handle mousedown
    block.querySelector('.resize-handle-left').addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        mode = 'resize-left';
        startX = e.clientX;
        startLeft = parseFloat(block.style.left) || 0;
        startWidth = parseFloat(block.style.width) || 0;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    // Right handle mousedown
    block.querySelector('.resize-handle-right').addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        mode = 'resize-right';
        startX = e.clientX;
        startWidth = parseFloat(block.style.width) || 0;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    // Block body mousedown (drag)
    block.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) return;
        e.stopPropagation();
        e.preventDefault();
        mode = 'drag';
        startX = e.clientX;
        startLeft = parseFloat(block.style.left) || 0;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    function onMouseMove(e) {
        if (!mode) return;
        
        const timelineWidth = 800 * timelineZoom;
        const deltaX = e.clientX - startX;
        const deltaPct = (deltaX / timelineWidth) * 100;
        const duration = videoDuration || 12.0;
        
        if (mode === 'drag') {
            block.setAttribute('data-dragged', 'true');
            let newLeftPct = startLeft + deltaPct;
            const blockWidthPct = parseFloat(block.style.width);
            
            // Boundary constraints
            if (newLeftPct < 0) newLeftPct = 0;
            if (newLeftPct + blockWidthPct > 100) newLeftPct = 100 - blockWidthPct;
            
            block.style.left = `${newLeftPct}%`;
            
            // Update model state
            track.start = (newLeftPct / 100) * duration;
            track.end = track.start + (blockWidthPct / 100) * duration;
        } else if (mode === 'resize-left') {
            let newLeftPct = startLeft + deltaPct;
            let newWidthPct = startWidth - deltaPct;
            
            if (newLeftPct < 0) {
                newWidthPct += newLeftPct;
                newLeftPct = 0;
            }
            // Minimum width constraint
            if (newWidthPct < 2) {
                newLeftPct = startLeft + startWidth - 2;
                newWidthPct = 2;
            }
            
            block.style.left = `${newLeftPct}%`;
            block.style.width = `${newWidthPct}%`;
            
            track.start = (newLeftPct / 100) * duration;
            track.end = track.start + (newWidthPct / 100) * duration;
        } else if (mode === 'resize-right') {
            let newWidthPct = startWidth + deltaPct;
            const leftPct = parseFloat(block.style.left) || 0;
            
            if (leftPct + newWidthPct > 100) {
                newWidthPct = 100 - leftPct;
            }
            // Minimum width constraint
            if (newWidthPct < 2) newWidthPct = 2;
            
            block.style.width = `${newWidthPct}%`;
            
            track.end = track.start + (newWidthPct / 100) * duration;
        }
        
        // Move visual playhead to target start as feedback
        mainVideoPlayer.currentTime = track.start;
        soundtrackAudio.currentTime = track.start;
        updatePlayheadPosition();
    }
    
    function onMouseUp() {
        if (!mode) return;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        mode = '';
        
        // Save plan modifications to backend
        if (type === 'music') {
            saveMusicPlanOnTimelineChange();
        } else {
            saveSfxPlanOnTimelineChange();
        }
    }
}

async function saveMusicPlanOnTimelineChange() {
    try {
        const payload = {
            run_music: timelineMusicTracks.length > 0,
            edited_by_user: true,
            tracks: timelineMusicTracks.map(t => ({
                track: t.track,
                volume: t.volume,
                start: t.start,
                end: t.end
            })),
            beats: timelineAudioBeats,
            vibe: currentVibe
        };
        
        await fetch('/api/save-music-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        appendLog('Music Agent', 'Soundtrack Curation & Beat Detection', 'Timeline background music track configuration successfully synchronized with backend.', 'SUCCESS');
    } catch (e) {
        console.error('Failed to save music plan:', e);
    }
}

async function saveSfxPlanOnTimelineChange() {
    try {
        const payload = {
            run_sfx: timelineSfxClips.length > 0,
            edited_by_user: true,
            placements: timelineSfxClips.map(c => ({
                track: c.track,
                volume: c.volume,
                start: c.start,
                end: c.end
            })),
            tracks: Array.from(new Set(timelineSfxClips.map(c => c.track))).map(t => ({
                track: t,
                volume: 0.30
            }))
        };
        
        await fetch('/api/save-sfx-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        appendLog('Sound Effects Agent', 'Audio Enhancement & SFX Sync', 'Timeline Sound FX configuration successfully synchronized with backend.', 'SUCCESS');
    } catch(e) {
        console.error('Failed to save SFX plan:', e);
    }
}

// EDIT AUDIO BLOCK POPUP MODAL
function openTrackEditor(id, type = 'music') {
    editingTrackId = id;
    editingTrackType = type;
    
    const trackList = type === 'music' ? timelineMusicTracks : timelineSfxClips;
    const track = trackList.find(t => t.id === id);
    if (!track) return;
    
    // Set field values
    document.getElementById('track-edit-name').textContent = track.track.split('/').pop();
    document.getElementById('track-edit-start').value = track.start.toFixed(2);
    document.getElementById('track-edit-end').value = track.end.toFixed(2);
    document.getElementById('track-edit-vol').value = Math.round(track.volume * 100);
    document.getElementById('track-edit-vol-val').textContent = Math.round(track.volume * 100) + '%';
    
    // Open modal
    document.getElementById('track-editor-modal').classList.remove('hidden');
}

function setupTimelineMusicListeners() {
    // Modal buttons
    const btnCancel = document.getElementById('btn-cancel-track-edit');
    const btnSave = document.getElementById('btn-save-track-edit');
    const btnDelete = document.getElementById('btn-delete-track');
    const modal = document.getElementById('track-editor-modal');
    
    btnCancel.addEventListener('click', () => modal.classList.add('hidden'));
    
    btnSave.addEventListener('click', () => {
        const start = parseFloat(document.getElementById('track-edit-start').value) || 0;
        const end = parseFloat(document.getElementById('track-edit-end').value) || 0;
        const vol = parseInt(document.getElementById('track-edit-vol').value) / 100;
        
        if (end <= start) {
            alert('End time must be after start time.');
            return;
        }
        
        const trackList = editingTrackType === 'music' ? timelineMusicTracks : timelineSfxClips;
        const track = trackList.find(t => t.id === editingTrackId);
        if (track) {
            track.start = start;
            track.end = end;
            track.volume = vol;
            drawTimeline();
            
            if (editingTrackType === 'music') {
                saveMusicPlanOnTimelineChange();
            } else {
                saveSfxPlanOnTimelineChange();
            }
        }
        modal.classList.add('hidden');
    });
    
    btnDelete.addEventListener('click', () => {
        if (editingTrackType === 'music') {
            timelineMusicTracks = timelineMusicTracks.filter(t => t.id !== editingTrackId);
        } else {
            timelineSfxClips = timelineSfxClips.filter(s => s.id !== editingTrackId);
        }
        drawTimeline();
        
        if (editingTrackType === 'music') {
            saveMusicPlanOnTimelineChange();
        } else {
            saveSfxPlanOnTimelineChange();
        }
        modal.classList.add('hidden');
    });
    
    // Helper to show dropdown context menu for track additions
    function showTrackAddDropdown(e, type) {
        e.stopPropagation();
        
        // Inject styles if they don't exist in document yet (foolproof stylesheet caching bypass)
        if (!document.getElementById('timeline-dropdown-styles')) {
            const style = document.createElement('style');
            style.id = 'timeline-dropdown-styles';
            style.innerHTML = `
                .timeline-action-dropdown {
                    position: absolute;
                    background: rgba(15, 18, 27, 0.98);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.7), 0 0 15px rgba(139, 92, 246, 0.15);
                    padding: 6px;
                    z-index: 9999;
                    min-width: 190px;
                    backdrop-filter: blur(12px);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    font-family: 'Inter', system-ui, sans-serif;
                }
                .timeline-action-dropdown.active {
                    display: flex;
                }
                .timeline-action-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    font-size: 0.78rem;
                    color: rgba(255, 255, 255, 0.85);
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    width: 100%;
                    box-sizing: border-box;
                }
                .timeline-action-item:hover {
                    background: rgba(139, 92, 246, 0.15) !important;
                    color: #fff !important;
                }
                .timeline-action-item svg {
                    width: 14px;
                    height: 14px;
                    color: #a78bfa;
                    flex-shrink: 0;
                }
            `;
            document.head.appendChild(style);
        }

        // Remove existing dropdowns
        const existing = document.querySelector('.timeline-action-dropdown');
        if (existing) existing.remove();
        
        const dropdown = document.createElement('div');
        dropdown.className = 'timeline-action-dropdown active';
        
        // Populate based on type
        dropdown.innerHTML = type === 'music' ? `
            <button class="timeline-action-item" id="opt-music-ai">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5 5 2 7-7-5-7 5 2-7-5-5h7z"/></svg>
                Generate Background Music
            </button>
            <button class="timeline-action-item" id="opt-music-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Browse Audio Library
            </button>
            <button class="timeline-action-item" id="opt-music-upload">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Upload Audio
            </button>
        ` : `
            <button class="timeline-action-item" id="opt-sfx-ai">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5 5 2 7-7-5-7 5 2-7-5-5h7z"/></svg>
                Generate SFX
            </button>
            <button class="timeline-action-item" id="opt-sfx-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Browse SFX Library
            </button>
            <button class="timeline-action-item" id="opt-sfx-upload">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Upload SFX File
            </button>
        `;
        
        document.body.appendChild(dropdown);
        const rect = e.currentTarget.getBoundingClientRect();
        dropdown.style.left = `${rect.left + window.scrollX}px`;
        dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        const dropdownRect = dropdown.getBoundingClientRect();
        if (rect.left + dropdownRect.width > window.innerWidth) {
            dropdown.style.left = `${rect.right - dropdownRect.width + window.scrollX}px`;
        }
        
        // Add listeners
        if (type === 'music') {
            document.getElementById('opt-music-ai').addEventListener('click', () => {
                dropdown.remove();
                const tabBtn = document.getElementById('tab-btn-music');
                if (tabBtn) tabBtn.click();
                const input = document.getElementById('ai-music-prompt');
                if (input) {
                    input.focus();
                    input.classList.add('input-pulse-highlight');
                    setTimeout(() => input.classList.remove('input-pulse-highlight'), 3000);
                }
            });
            document.getElementById('opt-music-search').addEventListener('click', () => {
                dropdown.remove();
                const tabBtn = document.getElementById('tab-btn-music');
                if (tabBtn) tabBtn.click();
                const input = document.getElementById('music-library-search-input');
                if (input) {
                    input.focus();
                    input.classList.add('input-pulse-highlight');
                    setTimeout(() => input.classList.remove('input-pulse-highlight'), 3000);
                }
            });
            document.getElementById('opt-music-upload').addEventListener('click', () => {
                dropdown.remove();
                if (inputTimelineMusic) inputTimelineMusic.click();
            });
        } else {
            document.getElementById('opt-sfx-ai').addEventListener('click', () => {
                dropdown.remove();
                const tabBtn = document.getElementById('tab-btn-sfx');
                if (tabBtn) tabBtn.click();
                const input = document.getElementById('ai-sfx-prompt');
                if (input) {
                    input.focus();
                    input.classList.add('input-pulse-highlight');
                    setTimeout(() => input.classList.remove('input-pulse-highlight'), 3000);
                }
            });
            document.getElementById('opt-sfx-search').addEventListener('click', () => {
                dropdown.remove();
                const tabBtn = document.getElementById('tab-btn-sfx');
                if (tabBtn) tabBtn.click();
                const input = document.getElementById('sfx-library-search-input');
                if (input) {
                    input.focus();
                    input.classList.add('input-pulse-highlight');
                    setTimeout(() => input.classList.remove('input-pulse-highlight'), 3000);
                }
            });
            document.getElementById('opt-sfx-upload').addEventListener('click', () => {
                dropdown.remove();
                if (inputTimelineSfx) inputTimelineSfx.click();
            });
        }
        
        // Close on body click
        const closeHandler = () => {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
        };
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 10);
    }

    // Add audio button & file input listener for music
    const btnAddBgTrack = document.getElementById('btn-add-bg-track');
    const inputTimelineMusic = document.getElementById('input-timeline-music');
    
    if (btnAddBgTrack && inputTimelineMusic) {
        btnAddBgTrack.addEventListener('click', (e) => {
            showTrackAddDropdown(e, 'music');
        });
        
        inputTimelineMusic.addEventListener('change', async () => {
            const file = inputTimelineMusic.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            appendLog('System', 'Server Deployment', `Uploading backing audio file '${file.name}' to workspace...`, 'INFO');
            
            try {
                const res = await fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.status === 'success') {
                    const relativePath = data.filepath;
                    
                    const newId = timelineMusicTracks.length > 0 ? Math.max(...timelineMusicTracks.map(t => t.id)) + 1 : 1;
                    timelineMusicTracks.push({
                        id: newId,
                        track: relativePath,
                        volume: 0.15,
                        start: 0.0,
                        end: videoDuration || 12.0
                    });
                    
                    drawTimeline();
                    saveMusicPlanOnTimelineChange();
                    appendLog('System', 'Server Deployment', `Audio file '${file.name}' successfully placed on timeline.`, 'SUCCESS');
                } else {
                    alert('Audio upload failed: ' + data.message);
                }
            } catch (e) {
                alert('Audio upload failed: ' + e.message);
            }
            inputTimelineMusic.value = '';
        });
    }

    // Add audio button & file input listener for SFX
    const btnAddSfxTrack = document.getElementById('btn-add-sfx-track');
    const inputTimelineSfx = document.getElementById('input-timeline-sfx');

    if (btnAddSfxTrack && inputTimelineSfx) {
        btnAddSfxTrack.addEventListener('click', (e) => {
            showTrackAddDropdown(e, 'sfx');
        });
        
        inputTimelineSfx.addEventListener('change', async () => {
            const file = inputTimelineSfx.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            appendLog('System', 'Server Deployment', `Uploading SFX file '${file.name}' to workspace...`, 'INFO');
            
            try {
                const res = await fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.status === 'success') {
                    const relativePath = data.filepath;
                    
                    const newId = timelineSfxClips.length > 0 ? Math.max(...timelineSfxClips.map(t => t.id)) + 1 : 1;
                    timelineSfxClips.push({
                        id: newId,
                        track: relativePath,
                        volume: 0.30,
                        start: 0.0,
                        end: Math.min(1.5, videoDuration || 12.0)
                    });
                    
                    drawTimeline();
                    saveSfxPlanOnTimelineChange();
                    appendLog('System', 'Server Deployment', `SFX file '${file.name}' successfully placed on timeline.`, 'SUCCESS');
                } else {
                    alert('SFX upload failed: ' + data.message);
                }
            } catch (e) {
                alert('SFX upload failed: ' + e.message);
            }
            inputTimelineSfx.value = '';
        });
    }
}

// PLAYHEAD DRAG AND SCRUBBING
function setupPlayheadScrubbing() {
    let isDragging = false;

    // Helper to calculate time from clientX and seek
    function seekToPosition(clientX) {
        if (!mainVideoPlayer.duration) return;
        const rect = timelineContainer.getBoundingClientRect();
        // ClientX relative to the scroll container's left border
        const relativeX = clientX - rect.left + timelineContainer.scrollLeft;
        // The tracks start at 200px (header offset)
        const timelineWidth = 800 * timelineZoom;
        const clickXInTracks = relativeX - 200;
        let pct = clickXInTracks / timelineWidth;
        pct = Math.max(0, Math.min(1, pct)); // Clamp between 0 and 1
        
        const targetTime = pct * mainVideoPlayer.duration;
        mainVideoPlayer.currentTime = targetTime;
        soundtrackAudio.currentTime = targetTime;
        updatePlayheadPosition();
    }

    // Ruler ticks scrubbing
    rulerTicks.addEventListener('mousedown', (e) => {
        isDragging = true;
        seekToPosition(e.clientX);
    });

    // Also support dragging on any empty track area to scrub
    const tracksContainer = document.querySelector('.timeline-tracks');
    if (tracksContainer) {
        tracksContainer.addEventListener('mousedown', (e) => {
            // Don't scrub if clicking on an interactive block or handle
            if (e.target.closest('.music-block') || e.target.closest('.caption-block') || e.target.closest('.transition-marker') || e.target.closest('.track-header') || e.target.closest('.btn-add-track')) {
                return;
            }
            isDragging = true;
            seekToPosition(e.clientX);
        });
    }

    // Support dragging the playhead handle directly
    const playheadHandle = timelinePlayheadLine.querySelector('.playhead-handle');
    if (playheadHandle) {
        playheadHandle.style.pointerEvents = 'auto';
        playheadHandle.style.cursor = 'ew-resize';
        
        playheadHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.stopPropagation();
            e.preventDefault();
        });
    }

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            seekToPosition(e.clientX);
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// GLOBAL PREVIEW AUDIO STATE
let previewAudioObj = null;
let activePreviewBtnEl = null;

// SETTINGS MODAL LOGIC
function setupSettingsModal() {
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCancel = document.getElementById('btn-cancel-settings');
    const btnSave = document.getElementById('btn-save-settings');
    const inputElevenLabs = document.getElementById('settings-elevenlabs-key');
    
    if (!btnSettings || !settingsModal) return;
    
    btnSettings.addEventListener('click', () => {
        // Load keys from localStorage
        inputElevenLabs.value = localStorage.getItem('elevenlabs_api_key') || '';
        settingsModal.classList.remove('hidden');
    });
    
    btnCancel.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    
    btnSave.addEventListener('click', () => {
        localStorage.setItem('elevenlabs_api_key', inputElevenLabs.value.trim());
        settingsModal.classList.add('hidden');
        appendLog('System', 'Settings Update', 'API credentials updated successfully.', 'SUCCESS');
    });
}

// LIBRARY PREVIEW & PLAYBACK
window.previewLibrarySound = async function(url, btn) {
    // If clicking the currently playing preview, stop it
    if (previewAudioObj && activePreviewBtnEl === btn) {
        stopLibrarySound();
        return;
    }
    
    // Stop any currently playing audio
    if (previewAudioObj) {
        stopLibrarySound();
    }
    
    activePreviewBtnEl = btn;
    btn.classList.add('active');
    btn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i>';
    lucide.createIcons();
    
    try {
        let streamUrl = url;
        
        // If it's a YouTube preview (denoted by empty/missing URL and an ID)
        const id = btn.dataset.id;
        const source = btn.dataset.source;
        if (source === 'youtube') {
            const resp = await fetch(`/api/library/stream?id=${id}&source=youtube`);
            const data = await resp.json();
            if (data.status === 'success') {
                streamUrl = data.url;
            } else {
                throw new Error("Failed to retrieve streaming link.");
            }
        }
        
        previewAudioObj = new Audio(streamUrl);
        previewAudioObj.volume = 0.5;
        previewAudioObj.addEventListener('ended', () => {
            stopLibrarySound();
        });
        
        await previewAudioObj.play();
        btn.innerHTML = '<i data-lucide="square"></i>';
        lucide.createIcons();
        
    } catch(e) {
        console.error("Preview failed:", e);
        appendLog('System', 'Audio Library', 'Preview playback failed: ' + e.message, 'ERROR');
        stopLibrarySound();
    }
};

function stopLibrarySound() {
    if (previewAudioObj) {
        previewAudioObj.pause();
        previewAudioObj = null;
    }
    if (activePreviewBtnEl) {
        activePreviewBtnEl.classList.remove('active');
        activePreviewBtnEl.innerHTML = '<i data-lucide="play"></i>';
        activePreviewBtnEl = null;
        lucide.createIcons();
    }
}

// ADD LIBRARY SOUND TO TIMELINE
window.addLibrarySoundToTimeline = async function(filepathOrId, title, source, type, licType = 'CC0', author = 'unknown') {
    let finalFilepath = filepathOrId;
    let filename = title || filepathOrId.split('/').pop();
    
    // If it's a YouTube, Freesound, or Jamendo track that needs downloading
    if (source === 'youtube' || source === 'freesound' || source === 'jamendo') {
        appendLog('System', 'Audio Library', `Buffering track "${filename}" onto server... Please wait.`, 'INFO');
        
        try {
            const resp = await fetch('/api/library/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: filepathOrId,
                    source: source,
                    type: type,
                    title: filename,
                    preview_url: filepathOrId
                })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                finalFilepath = data.filepath;
                filename = data.filename;
                appendLog('System', 'Audio Library', `Track "${filename}" successfully buffered.`, 'SUCCESS');
            } else {
                throw new Error(data.message || "Failed to download.");
            }
} catch(e) {
            console.error("Download failed:", e);
            appendLog('System', 'Audio Library', 'Failed to buffer library file: ' + e.message, 'ERROR');
            return;
        }
    }

    // Determine category based on extension
    const ext = filename.split('.').pop().toLowerCase();
    const isSfx = ext === 'wav' || type === 'sfx';
    
    const id = ++assetIdCounter;
    const mockFile = { name: filename };
    
    if (isSfx) {
        sfxAssets.push({ file: mockFile, volume: 0.30, id, filepath: finalFilepath, license: licType, author: author });
        renderSfxList();
        
        // Also place directly on the timeline!
        const newId = timelineSfxClips.length > 0 ? Math.max(...timelineSfxClips.map(t => t.id)) + 1 : 1;
        timelineSfxClips.push({
            id: newId,
            track: finalFilepath,
            volume: 0.30,
            start: 0.0,
            end: Math.min(3.0, videoDuration || 12.0)
        });
        drawTimeline();
        saveSfxPlanOnTimelineChange();
        
        appendLog('System', 'Timeline Layout', `Added library SFX "${filename}" to assets and timeline.`, 'SUCCESS');
    } else {
        musicAssets.push({ file: mockFile, volume: 0.20, id, filepath: finalFilepath, license: licType, author: author });
        renderMusicList();
        
        // Also place directly on the timeline!
        const newId = timelineMusicTracks.length > 0 ? Math.max(...timelineMusicTracks.map(t => t.id)) + 1 : 1;
        timelineMusicTracks.push({
            id: newId,
            track: finalFilepath,
            volume: 0.20,
            start: 0.0,
            end: videoDuration || 12.0
        });
        drawTimeline();
        saveMusicPlanOnTimelineChange();
        
        appendLog('System', 'Timeline Layout', `Added library backing track "${filename}" to assets and timeline.`, 'SUCCESS');
    }
    updateAttributionCredits();
};

// LIBRARY PANEL SEARCH HANDLING
function setupLibraryPanel() {
    // Music search elements
    const musicSearchInput = document.getElementById('music-library-search-input');
    const musicSearchBtn = document.getElementById('btn-music-library-search');
    const musicResultsList = document.getElementById('music-search-results-list');
    
    // SFX search elements
    const sfxSearchInput = document.getElementById('sfx-library-search-input');
    const sfxSearchBtn = document.getElementById('btn-sfx-library-search');
    const sfxResultsList = document.getElementById('sfx-search-results-list');
    
    // AI Generation elements
    const aiSfxPromptInput = document.getElementById('ai-sfx-prompt');
    const aiSfxDurationInput = document.getElementById('ai-sfx-duration');
    const aiSfxGenerateBtn = document.getElementById('btn-generate-ai-sfx');

    // ── AI Music Composer ──────────────────────────────────────────────
    let selectedAiMusicVibe = 'lofi';
    const aiMusicPromptInput = document.getElementById('ai-music-prompt');

    // Vibe button selection sets prompt text automatically to help the user
    document.querySelectorAll('.ai-vibe-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ai-vibe-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAiMusicVibe = btn.dataset.vibe;
            if (aiMusicPromptInput) {
                aiMusicPromptInput.value = btn.textContent.replace(/[\p{Emoji}\s]+/gu, '') + " music";
            }
        });
    });

    // Generate button
    const btnGenerateAiMusic = document.getElementById('btn-generate-ai-music');
    const aiMusicStatus = document.getElementById('ai-music-status');
    const aiMusicStatusText = document.getElementById('ai-music-status-text');
    const aiMusicResults = document.getElementById('ai-music-results');

    if (btnGenerateAiMusic) {
        btnGenerateAiMusic.addEventListener('click', async () => {
            const duration = parseInt(document.getElementById('ai-music-duration').value) || 30;
            const promptVal = aiMusicPromptInput ? aiMusicPromptInput.value.trim() : '';

            // Show status
            aiMusicStatus.style.display = 'flex';
            aiMusicStatusText.textContent = `Composing music for "${promptVal || selectedAiMusicVibe}" (${duration}s)... this may take a moment`;
            btnGenerateAiMusic.disabled = true;
            btnGenerateAiMusic.style.opacity = '0.6';

            try {
                const resp = await fetch('/api/library/generate_ai_music', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vibe: selectedAiMusicVibe, prompt: promptVal, duration })
                });
                const data = await resp.json();

                if (data.status === 'success') {
                    aiMusicStatusText.textContent = `✅ ${data.message}`;
                    setTimeout(() => { aiMusicStatus.style.display = 'none'; }, 3000);

                    const finalLabel = data.vibe_label || (selectedAiMusicVibe.toUpperCase() + ' 🎵');

                    // Add result card to list
                    const card = document.createElement('div');
                    card.className = 'library-item';
                    card.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:2px; flex:1; overflow:hidden;">
                            <span class="lib-item-title" style="font-weight:600; font-size:0.74rem;">🎵 ${data.filename}</span>
                            <span style="font-size:0.62rem; color:rgba(255,255,255,0.4);">${finalLabel} · ${duration}s · Seed: ${data.seed}</span>
                        </div>
                        <div class="lib-item-actions">
                            <button class="btn btn-outline btn-sm btn-lib-preview" onclick="previewLibrarySound('/static/${data.filepath}', this)" type="button"><i data-lucide="play"></i></button>
                            <button class="btn btn-accent btn-sm" onclick="addLibrarySoundToTimeline('${data.filepath}', '${data.filename}', 'local', 'music')" type="button"><i data-lucide="plus"></i> Add</button>
                        </div>
                    `;
                    aiMusicResults.prepend(card);
                    lucide.createIcons();
                    appendLog('System', 'AI Composer', `Generated "${data.filename}" — ${data.message}`, 'SUCCESS');
                } else {
                    aiMusicStatusText.textContent = `❌ Generation failed: ${data.detail || 'unknown error'}`;
                }
            } catch (err) {
                aiMusicStatusText.textContent = `❌ Request failed: ${err.message}`;
            } finally {
                btnGenerateAiMusic.disabled = false;
                btnGenerateAiMusic.style.opacity = '1';
            }
        });
    }
    // ──────────────────────────────────────────────────────────────────


    musicSearchBtn.addEventListener('click', async () => {
        const query = musicSearchInput.value.trim();
        if (!query) return;
        
        musicResultsList.classList.remove('hidden');
        musicResultsList.innerHTML = '<div class="lib-search-loading"><i data-lucide="loader" class="animate-spin"></i> Searching Jamendo...</div>';
        lucide.createIcons();
        
        try {
            const resp = await fetch(`/api/library/search?q=${encodeURIComponent(query)}&type=music`);
            const data = await resp.json();
            
            if (data.status === 'success' && data.results.length > 0) {
                musicResultsList.innerHTML = '';
                const quotaTag = document.getElementById('music-searches-remaining');
                if (quotaTag) {
                    if (data.searches_remaining !== null && data.searches_remaining !== undefined) {
                        quotaTag.textContent = `Searches left: ${data.searches_remaining}`;
                        quotaTag.style.display = 'inline-block';
                    } else {
                        quotaTag.style.display = 'none';
                    }
                }
                data.results.forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'library-item';
                    el.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:2px; flex:1; overflow:hidden;">
                            <span class="lib-item-title" title="${item.title}" style="font-weight:600; font-size:0.75rem;">🎵 ${item.title}</span>
                            <div style="display:flex; gap:6px; align-items:center;">
                                <span class="badge" style="background:rgba(139,92,246,0.15); font-size:0.58rem; padding:1px 4px; color:#c084fc;">CC-BY</span>
                                <span style="font-size:0.62rem; color:rgba(255,255,255,0.4);">by ${item.artist_name}</span>
                            </div>
                        </div>
                        <div class="lib-item-actions">
                            <button class="btn btn-outline btn-sm btn-lib-preview" onclick="previewLibrarySound('${item.preview_url}', this)" type="button"><i data-lucide="play"></i></button>
                            <button class="btn btn-accent btn-sm" onclick="addLibrarySoundToTimeline('${item.preview_url}', '${item.title.replace(/'/g, "\\'")}', 'jamendo', 'music', 'CC-BY', '${item.artist_name.replace(/'/g, "\\'")}')" type="button"><i data-lucide="plus"></i> Add</button>
                        </div>
                    `;
                    musicResultsList.appendChild(el);
                });
                lucide.createIcons();
            } else if (data.status === 'limit_reached') {
                renderPaywallCard(musicResultsList, data.message);
            } else if (data.status === 'error') {
                musicResultsList.innerHTML = `<div class="lib-search-empty">${data.message}</div>`;
            } else {
                musicResultsList.innerHTML = '<div class="lib-search-empty">No results found on Jamendo.</div>';
            }
        } catch(e) {
            musicResultsList.innerHTML = '<div class="lib-search-empty">Search failed.</div>';
        }
    });
    
    // Run SFX search
    sfxSearchBtn.addEventListener('click', async () => {
        const query = sfxSearchInput.value.trim();
        if (!query) return;
        
        const duration = document.getElementById('sfx-filter-duration').value;
        const vibe = document.getElementById('sfx-filter-vibe').value;
        
        sfxResultsList.classList.remove('hidden');
        sfxResultsList.innerHTML = '<div class="lib-search-loading"><i data-lucide="loader" class="animate-spin"></i> Searching Freesound...</div>';
        lucide.createIcons();
        
        try {
            const resp = await fetch(`/api/library/search?q=${encodeURIComponent(query)}&type=sfx&duration=${duration}&vibe=${vibe}`);
            const data = await resp.json();
            
            if (data.status === 'success' && data.results.length > 0) {
                sfxResultsList.innerHTML = '';
                const quotaTag = document.getElementById('sfx-searches-remaining');
                if (quotaTag) {
                    if (data.searches_remaining !== null && data.searches_remaining !== undefined) {
                        quotaTag.textContent = `Searches left: ${data.searches_remaining}`;
                        quotaTag.style.display = 'inline-block';
                    } else {
                        quotaTag.style.display = 'none';
                    }
                }
                data.results.forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'library-item';
                    
                    // Format download count (e.g. 1.2k)
                    const dls = item.downloads >= 1000 ? (item.downloads / 1000).toFixed(1) + 'k' : item.downloads;
                    const isShortlisted = shortlistedSfx.some(s => s.preview_url === item.preview_url);
                    const licColor = item.license === 'CC0' ? '#10b981' : '#c084fc';
                    
                    el.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:2px; flex:1; overflow:hidden;">
                            <span class="lib-item-title" title="${item.title}" style="font-weight:600; font-size:0.75rem;">🔊 ${item.title}</span>
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                <span class="badge" style="background:rgba(255,255,255,0.06); font-size:0.58rem; padding:1px 4px; color:rgba(255,255,255,0.5);">📥 ${dls}</span>
                                <span class="badge" style="background:rgba(245,158,11,0.1); font-size:0.58rem; padding:1px 4px; color:#f59e0b;">⭐ ${item.rating}</span>
                                <span class="badge" style="background:${licColor}20; font-size:0.58rem; padding:1px 4px; color:${licColor};">${item.license}</span>
                                <span style="font-size:0.62rem; color:rgba(255,255,255,0.4);">by ${item.username}</span>
                            </div>
                        </div>
                        <div class="lib-item-actions">
                            <button class="btn btn-outline btn-sm btn-lib-preview" onclick="previewLibrarySound('${item.preview_url}', this)" type="button"><i data-lucide="play"></i></button>
                            <button class="btn btn-accent btn-sm" onclick="addLibrarySoundToTimeline('${item.preview_url}', '${item.title.replace(/'/g, "\\'")}', 'freesound', 'sfx', '${item.license}', '${item.username.replace(/'/g, "\\'")}')" type="button"><i data-lucide="plus"></i> Add</button>
                            <button class="btn-shortlist ${isShortlisted ? 'active' : ''}" onclick="toggleShortlistSfx('${item.preview_url}', '${item.title.replace(/'/g, "\\'")}', '${dls}', '${item.rating}')" type="button" title="Add to Shortlist">
                                <i data-lucide="star"></i>
                            </button>
                        </div>
                    `;
                    sfxResultsList.appendChild(el);
                });
                lucide.createIcons();
            } else if (data.status === 'limit_reached') {
                renderPaywallCard(sfxResultsList, data.message);
            } else if (data.status === 'error') {
                sfxResultsList.innerHTML = `<div class="lib-search-empty">${data.message}</div>`;
            } else {
                sfxResultsList.innerHTML = '<div class="lib-search-empty">No results found on Freesound.</div>';
            }
        } catch(e) {
            sfxResultsList.innerHTML = '<div class="lib-search-empty">Search failed.</div>';
        }
    });
    
    // Debounce timer for real-time search as user types
    let sfxSearchTimeout = null;
    sfxSearchInput.addEventListener('input', () => {
        clearTimeout(sfxSearchTimeout);
        sfxSearchTimeout = setTimeout(() => {
            const query = sfxSearchInput.value.trim();
            if (query.length >= 2 || query === '*') {
                sfxSearchBtn.click();
            } else if (query.length === 0) {
                sfxResultsList.classList.add('hidden');
            }
        }, 300);
    });

    // View All button click handler
    const sfxViewAllBtn = document.getElementById('btn-sfx-view-all');
    if (sfxViewAllBtn) {
        sfxViewAllBtn.addEventListener('click', () => {
            sfxSearchInput.value = '*';
            sfxSearchBtn.click();
        });
    }

    // Auto-retrigger search when characterisation filters change
    const filterDur = document.getElementById('sfx-filter-duration');
    const filterVib = document.getElementById('sfx-filter-vibe');
    if (filterDur && filterVib) {
        [filterDur, filterVib].forEach(sel => {
            sel.addEventListener('change', () => {
                const query = sfxSearchInput.value.trim();
                if (query) {
                    sfxSearchBtn.click();
                }
            });
        });
    }

    // Category pills binding for Music
    const musicPills = document.querySelectorAll('#music-categories .category-pill');
    musicPills.forEach(pill => {
        pill.addEventListener('click', () => {
            musicPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const category = pill.dataset.val;
            
            // Filter offline static list
            filterStaticLibraryList('music', category);
            
            // If API key is set, trigger online search, else hide online results
            const jamendoKey = localStorage.getItem('jamendo_client_id') || '';
            if (category !== 'all') {
                musicSearchInput.value = category;
                if (jamendoKey) {
                    musicSearchBtn.click();
                } else {
                    musicResultsList.classList.add('hidden');
                }
            } else {
                musicSearchInput.value = '';
                musicResultsList.classList.add('hidden');
            }
        });
    });

    // Category pills binding for SFX
    const sfxPills = document.querySelectorAll('#sfx-categories .category-pill');
    sfxPills.forEach(pill => {
        pill.addEventListener('click', () => {
            sfxPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const category = pill.dataset.val;
            
            // Filter offline static list
            filterStaticLibraryList('sfx', category);
            
            // If API key is set, trigger online search, else hide online results
            const freesoundKey = localStorage.getItem('freesound_api_key') || '';
            if (category !== 'all') {
                sfxSearchInput.value = category;
                if (freesoundKey) {
                    sfxSearchBtn.click();
                } else {
                    sfxResultsList.classList.add('hidden');
                }
            } else {
                sfxSearchInput.value = '';
                sfxResultsList.classList.add('hidden');
            }
        });
    });
    
    // Run AI sound generation
    aiSfxGenerateBtn.addEventListener('click', async () => {
        const prompt = aiSfxPromptInput.value.trim();
        if (!prompt) {
            alert('Please enter a sound description.');
            return;
        }
        
        aiSfxGenerateBtn.disabled = true;
        aiSfxGenerateBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Generating...';
        lucide.createIcons();
        appendLog('AI Agent', 'ElevenLabs Engine', `Generating synthesized custom sound effect for: "${prompt}"...`, 'INFO');
        
        const elevenlabsKey = localStorage.getItem('elevenlabs_api_key') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (elevenlabsKey) {
            headers['X-ElevenLabs-Key'] = elevenlabsKey;
        }
        
        try {
            const resp = await fetch('/api/library/generate_ai', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    prompt: prompt,
                    duration: parseFloat(aiSfxDurationInput.value) || 2.0
                })
            });
            const data = await resp.json();
            
            if (data.status === 'success') {
                aiSfxPromptInput.value = '';
                appendLog('AI Agent', 'ElevenLabs Engine', data.message, 'SUCCESS');
                
                // Add the generated track directly to timeline assets
                await addLibrarySoundToTimeline(data.filepath, data.filename, 'local', 'sfx');
            } else {
                throw new Error(data.message || "Failed to generate.");
            }
        } catch(e) {
            appendLog('AI Agent', 'ElevenLabs Engine', 'Generation failed: ' + e.message, 'ERROR');
        } finally {
            aiSfxGenerateBtn.disabled = false;
            aiSfxGenerateBtn.innerHTML = '<i data-lucide="sparkles"></i> Generate AI SFX';
            lucide.createIcons();
        }
    });
    
    // Support search on Enter keypress
    musicSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            musicSearchBtn.click();
        }
    });
    sfxSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sfxSearchBtn.click();
        }
    });
}

// RENDER SHORTLISTED SFX
function renderSfxShortlist() {
    const list = document.getElementById('sfx-shortlist-list');
    if (!list) return;
    const emptyEl = document.getElementById('sfx-shortlist-empty');
    
    // Remove old items (keep empty state)
    list.querySelectorAll('.library-item').forEach(el => el.remove());
    
    if (shortlistedSfx.length === 0) {
        if (emptyEl) emptyEl.style.display = 'flex';
        return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    
    shortlistedSfx.forEach(item => {
        const el = document.createElement('div');
        el.className = 'library-item';
        el.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px; flex:1; overflow:hidden;">
                <span class="lib-item-title" title="${item.title}" style="font-weight:600; font-size:0.75rem;">⭐ ${item.title}</span>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span class="badge" style="background:rgba(255,255,255,0.06); font-size:0.58rem; padding:1px 4px; color:rgba(255,255,255,0.5);">📥 ${item.downloads}</span>
                </div>
            </div>
            <div class="lib-item-actions">
                <button class="btn btn-outline btn-sm btn-lib-preview" onclick="previewLibrarySound('${item.preview_url}', this)" type="button"><i data-lucide="play"></i></button>
                <button class="btn btn-accent btn-sm" onclick="addLibrarySoundToTimeline('${item.preview_url}', '${item.title.replace(/'/g, "\\'")}', 'freesound', 'sfx')" type="button"><i data-lucide="plus"></i> Add</button>
                <button class="btn-shortlist active" onclick="toggleShortlistSfx('${item.preview_url}', '${item.title.replace(/'/g, "\\'")}', '${item.downloads}', '${item.rating}')" type="button" title="Remove Favorite">
                    <i data-lucide="star"></i>
                </button>
            </div>
        `;
        list.appendChild(el);
    });
    lucide.createIcons();
}

// TOGGLE SHORTLIST/FAVORITE SFX
window.toggleShortlistSfx = function(preview_url, title, downloads, rating) {
    const idx = shortlistedSfx.findIndex(s => s.preview_url === preview_url);
    if (idx > -1) {
        shortlistedSfx.splice(idx, 1);
    } else {
        shortlistedSfx.push({ preview_url, title, downloads, rating });
    }
    
    localStorage.setItem('shortlisted_sfx', JSON.stringify(shortlistedSfx));
    renderSfxShortlist();
    
    // Update active states in search results list
    const searchList = document.getElementById('sfx-search-results-list');
    if (searchList) {
        const cards = searchList.querySelectorAll('.library-item');
        cards.forEach(card => {
            const addBtn = card.querySelector('button[onclick*="addLibrarySoundToTimeline"]');
            if (addBtn) {
                if (addBtn.getAttribute('onclick').includes(preview_url)) {
                    const shortlistBtn = card.querySelector('.btn-shortlist');
                    if (shortlistBtn) {
                        const active = shortlistedSfx.some(s => s.preview_url === preview_url);
                        if (active) {
                            shortlistBtn.classList.add('active');
                        } else {
                            shortlistBtn.classList.remove('active');
                        }
                    }
                }
            }
        });
    }
};

// UPGRADE TO PREMIUM PAYWALL CARD
function renderPaywallCard(container, message) {
    container.innerHTML = `
        <div class="api-key-required-card" style="border: 1px solid rgba(236,72,153,0.3); background: rgba(236,72,153,0.03); padding: 18px; margin-top: 5px; box-sizing: border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.886H3.882l4.985 3.62L6.953 18.39 12 14.77l5.047 3.62-1.914-5.884 4.985-3.62h-6.206L12 3Z"/></svg>
            <h5 style="color:#ec4899; margin:0; font-size:0.85rem; font-weight:bold; display:flex; align-items:center; gap:6px;">Daily Quota Exhausted</h5>
            <p style="font-size:0.7rem; line-height:1.4; color:rgba(255,255,255,0.6); margin: 6px 0 12px;">${message || 'Daily limit reached. Upgrade to the Premium Plan to get unlimited searches, downloads, and AI sound synthesis.'}</p>
            <button class="btn btn-accent btn-sm" type="button" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); border: none; font-weight: bold; width: 100%; border-radius: 6px; padding: 8px 12px; cursor: pointer; color:#fff;" onclick="alert('Premium billing portal integration: Subscriptions will be enabled here!')">
                Upgrade to Premium
            </button>
        </div>
    `;
    lucide.createIcons();
}

// OFFLINE CACHED LIST FILTERING
function filterStaticLibraryList(type, category) {
    const listId = type === 'music' ? 'music-static-list' : 'sfx-static-list';
    const list = document.getElementById(listId);
    if (!list) return;
    
    const items = list.querySelectorAll('.library-item');
    items.forEach(item => {
        const filename = item.dataset.filename.toLowerCase();
        let show = false;
        
        if (category === 'all') {
            show = true;
        } else if (type === 'music') {
            if (category === 'lofi' && filename.includes('lofi')) show = true;
            if (category === 'phonk' && filename.includes('phonk')) show = true;
            if (category === 'upbeat' && (filename.includes('gym') || filename.includes('phonk'))) show = true;
            if (category === 'cinematic' && filename.includes('backing')) show = true;
        } else { // sfx
            if (category === 'swoosh' && filename.includes('swoosh')) show = true;
            if (category === 'impact' && filename.includes('boom')) show = true;
            if (category === 'beep' && filename.includes('beep')) show = true;
            if (category === 'nature' && filename.includes('sizzle')) show = true;
        }
        
        if (show) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// DYNAMIC LEGAL ATTRIBUTION CREDITS GENERATOR
function updateAttributionCredits() {
    const creditsPanel = document.getElementById('attribution-credits-panel');
    const creditsText = document.getElementById('attribution-credits-text');
    if (!creditsPanel || !creditsText) return;
    
    const ccByAssets = [];
    
    musicAssets.forEach(a => {
        if (a.license === 'CC-BY') {
            ccByAssets.push({ name: a.file.name, author: a.author || 'Jamendo Artist', source: 'Jamendo.com' });
        }
    });
    
    sfxAssets.forEach(a => {
        if (a.license === 'CC-BY') {
            ccByAssets.push({ name: a.file.name, author: a.author || 'Freesound Contributor', source: 'Freesound.org' });
        }
    });
    
    if (ccByAssets.length === 0) {
        creditsPanel.classList.add('hidden');
        creditsText.value = '';
        return;
    }
    
    let text = "AUDIO ATTRIBUTIONS:\n";
    ccByAssets.forEach(a => {
        text += `- "${a.name}" by ${a.author} (via ${a.source}) / licensed under Creative Commons Attribution (CC-BY)\n`;
    });
    
    creditsText.value = text;
    creditsPanel.classList.remove('hidden');
}

// SETUP COPY TO CLIPBOARD BUTTON FOR ATTRIBUTIONS
function setupAttributionCopy() {
    const btnCopy = document.getElementById('btn-copy-attributions');
    const creditsText = document.getElementById('attribution-credits-text');
    if (!btnCopy || !creditsText) return;
    
    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(creditsText.value)
            .then(() => {
                const originalText = btnCopy.innerHTML;
                btnCopy.innerHTML = '<i data-lucide="check"></i> Copied!';
                lucide.createIcons();
                setTimeout(() => {
                    btnCopy.innerHTML = originalText;
                    lucide.createIcons();
                }, 2000);
            })
            .catch(err => {
                alert('Failed to copy attributions: ' + err);
            });
    });
}

// LICENSE SYSTEM
async function checkLicenseStatus() {
    try {
        const res = await fetch('/api/license/check');
        const data = await res.json();
        const overlay = document.getElementById('license-overlay');
        if (data.valid) {
            if (overlay) overlay.classList.add('hidden');
        } else {
            if (overlay) overlay.classList.remove('hidden');
            setupLicenseActivation();
        }
    } catch (e) {
        console.log('Failed to check license status:', e);
    }
}

function setupLicenseActivation() {
    const btn = document.getElementById('btn-activate-license');
    const input = document.getElementById('input-license-key');
    if (!btn || !input) return;
    
    btn.addEventListener('click', async () => {
        const key = input.value.trim();
        if (!key) { alert('Please enter a license key.'); return; }
        
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="spin-icon"></i> Verifying...';
        lucide.createIcons();
        
        try {
            const res = await fetch('/api/license/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await res.json();
            if (data.valid) {
                document.getElementById('license-overlay').classList.add('hidden');
                alert('Ashtavadhani unlocked successfully! Thank you.');
            } else {
                alert('Invalid or expired license key: ' + data.message);
            }
        } catch (e) {
            alert('License activation request failed: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="key"></i> Verify & Unlock';
            lucide.createIcons();
        }
    });
}

// TEMPLATE MAKER HANDLERS
async function updateLocalAIStatus() {
    try {
        const res = await fetch('/api/template/model-status');
        const json = await res.json();
        if (json.status === 'success') {
            const data = json.data;
            const titleEl = document.getElementById('local-ai-title');
            const descEl = document.getElementById('local-ai-desc');
            const badgeEl = document.getElementById('local-ai-badge');
            const dotEl = document.getElementById('local-ai-dot');
            const cardEl = document.getElementById('local-ai-status-card');

            if (data.active_provider === 'local_ollama') {
                if (titleEl) titleEl.textContent = 'Local PC AI Vision Engine';
                if (descEl) descEl.textContent = `Running 100% on your PC GPU using ${data.active_model}. $0 API cost.`;
                if (badgeEl) { badgeEl.textContent = '100% On-Device'; badgeEl.style.background = 'rgba(34, 197, 94, 0.2)'; badgeEl.style.color = '#4ade80'; }
                if (dotEl) dotEl.style.background = '#22c55e';
                if (cardEl) { cardEl.style.borderColor = 'rgba(34, 197, 94, 0.25)'; cardEl.style.background = 'rgba(34, 197, 94, 0.08)'; }
            } else if (data.active_provider === 'gemini_cloud') {
                if (titleEl) titleEl.textContent = 'Cloud AI Vision (Gemini)';
                if (descEl) descEl.textContent = 'Using connected Gemini API for visual extraction.';
                if (badgeEl) { badgeEl.textContent = 'Cloud API'; badgeEl.style.background = 'rgba(139, 92, 246, 0.2)'; badgeEl.style.color = '#a78bfa'; }
                if (dotEl) dotEl.style.background = '#8b5cf6';
            } else {
                if (titleEl) titleEl.textContent = 'Smart Offline Heuristic';
                if (descEl) descEl.textContent = 'Extracting shots via frame-hash variance analysis.';
                if (badgeEl) { badgeEl.textContent = 'Offline'; badgeEl.style.background = 'rgba(255, 255, 255, 0.1)'; badgeEl.style.color = 'rgba(255,255,255,0.7)'; }
                if (dotEl) dotEl.style.background = '#94a3b8';
            }
        }
    } catch (e) {
        console.warn('Could not fetch local AI status:', e);
    }
}

function setupTemplateHandlers() {
    const dropzoneTemplateRef = document.getElementById('dropzone-template-ref');
    const inputTemplateRef = document.getElementById('input-template-ref');
    const listTemplateRef = document.getElementById('list-template-ref');
    const btnExtractTemplate = document.getElementById('btn-extract-template');
    const btnRenderTemplate = document.getElementById('btn-render-template');

    updateLocalAIStatus();

    if (!dropzoneTemplateRef || !inputTemplateRef || !btnExtractTemplate) return;

    dropzoneTemplateRef.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneTemplateRef.style.borderColor = 'var(--color-primary)';
        dropzoneTemplateRef.style.background = 'rgba(139, 92, 246, 0.05)';
    });
    dropzoneTemplateRef.addEventListener('dragleave', () => {
        dropzoneTemplateRef.style.borderColor = 'var(--border-color)';
        dropzoneTemplateRef.style.background = '';
    });

    inputTemplateRef.addEventListener('change', () => {
        if (inputTemplateRef.files.length) {
            updateFileList(inputTemplateRef, listTemplateRef);
        }
    });

    dropzoneTemplateRef.addEventListener('drop', (e) => {
        e.preventDefault();
        inputTemplateRef.files = e.dataTransfer.files;
        updateFileList(inputTemplateRef, listTemplateRef);
        dropzoneTemplateRef.style.borderColor = 'var(--border-color)';
        dropzoneTemplateRef.style.background = '';
    });

    btnExtractTemplate.addEventListener('click', async () => {
        const file = inputTemplateRef.files[0];
        if (!file) {
            alert('Please select an edit video to extract a template blueprint.');
            return;
        }

        btnExtractTemplate.disabled = true;
        btnExtractTemplate.innerHTML = '<i data-lucide="loader"></i> Extracting Template Blueprint...';
        if (window.lucide) lucide.createIcons();

        appendLog('Blueprint Analyzer', 'Vision & Beat Extractor', 'Extracting template blueprint, visual pacing, cut boundaries, and typography layout from reference video...', 'INFO');
        updateAgentUI('Blueprint Analyzer', 'INFO', 'Analyzing video structure...');

        const formData = new FormData();
        formData.append('template_video', file);

        try {
            const res = await fetch('/api/template/extract', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                currentTemplateBlueprint = data.blueprint;
                renderTemplateSlotsUI(currentTemplateBlueprint);
                const photoSlots = data.blueprint.photo_slots || 0;
                const videoSlots = data.blueprint.video_slots || 0;
                const breakdownMsg = (photoSlots || videoSlots) ? ` (${photoSlots} photos + ${videoSlots} clips)` : '';
                appendLog('Blueprint Analyzer', 'Vision & Beat Extractor', `Template Blueprint extracted: ${data.blueprint.slot_count} placeholder slots identified (${data.blueprint.filter_label} grading, ${data.blueprint.total_duration}s duration).`, 'SUCCESS');
                updateAgentUI('Blueprint Analyzer', 'SUCCESS', 'Extraction complete');
                alert(`Template extracted! Identified ${data.blueprint.slot_count} placeholder slots${breakdownMsg}.\nFilter: ${data.blueprint.filter_label}.`);
            } else {
                appendLog('Blueprint Analyzer', 'Vision & Beat Extractor', 'Template extraction failed: ' + (data.detail || data.message), 'ERROR');
                updateAgentUI('Blueprint Analyzer', 'ERROR', 'Extraction failed');
                alert('Template extraction failed: ' + (data.detail || data.message));
            }
        } catch (e) {
            appendLog('Blueprint Analyzer', 'Vision & Beat Extractor', 'Template extraction request failed: ' + e.message, 'ERROR');
            alert('Template extraction request failed: ' + e.message);
        } finally {
            btnExtractTemplate.disabled = false;
            btnExtractTemplate.innerHTML = '<i data-lucide="sparkles"></i> Extract Template Blueprint';
            if (window.lucide) lucide.createIcons();
        }
    });

    if (btnRenderTemplate) {
        btnRenderTemplate.addEventListener('click', async () => {
            await renderTemplateEdit();
        });
    }
}

function renderTemplateSlotsUI(blueprint) {
    const card = document.getElementById('template-blueprint-card');
    const cardName = document.getElementById('template-card-name');
    const cardInfo = document.getElementById('template-card-info');
    const filterTag = document.getElementById('template-filter-tag');
    const slotsContainer = document.getElementById('template-slots-container');
    const btnRender = document.getElementById('btn-render-template');

    if (!blueprint || !slotsContainer) return;

    if (card) card.classList.remove('hidden');
    if (cardName) cardName.textContent = blueprint.template_name || 'Template Blueprint';

    // Show photo/video slot breakdown in the summary
    const photoCount = blueprint.photo_slots || 0;
    const videoCount = blueprint.video_slots || 0;
    const breakdownStr = (photoCount || videoCount)
        ? ` • 📷 ${photoCount} photo${photoCount !== 1 ? 's' : ''} + 🎬 ${videoCount} clip${videoCount !== 1 ? 's' : ''}`
        : '';
    if (cardInfo) cardInfo.textContent = `${blueprint.slot_count} slots • ${blueprint.total_duration}s${breakdownStr}`;
    if (filterTag) filterTag.textContent = `Filter: ${blueprint.filter_label || 'Natural'}`;

    // Update typography and transition style display
    const style = blueprint.caption_style || {};
    const fontEl = document.getElementById('tb-font-name');
    const layerEl = document.getElementById('tb-layer-mode');
    const transEl = document.getElementById('tb-transition-mode');
    if (fontEl) fontEl.textContent = style.font_family || 'Century Gothic Bold';
    if (layerEl) layerEl.textContent = (style.layer_depth === 'behind_subject' ? 'Behind Subject' : 'Foreground Overlay');
    if (transEl) transEl.textContent = (style.transition === 'fade' ? 'Smooth Fade' : 'Instant Cut');

    // Auto-sync depth controls with blueprint style
    if (style.layer_depth) {
        setLayerDepthMode(style.layer_depth);
    }
    if (style.vertical_pos !== undefined) {
        updateDepthVerticalPos(style.vertical_pos * 100);
    }

    slotsContainer.innerHTML = '';
    templateSlotFiles = {};
    window.templateSlotTimings = {};

    blueprint.placeholders.forEach(slot => {
        window.templateSlotTimings[slot.slot_id] = { 
            start: parseFloat(slot.start) || 0.0, 
            end: parseFloat(slot.end) || (parseFloat(slot.start) + parseFloat(slot.duration)) 
        };
        const isPhoto = slot.recommended_type === 'photo';
        const isVideo = slot.recommended_type === 'video';
        const badgeClass = isPhoto ? 'slot-badge-photo' : (isVideo ? 'slot-badge-video' : 'slot-badge-any');
        const badgeLabel = isPhoto ? '📷 PHOTO' : (isVideo ? '🎬 VIDEO' : '📁 ANY');
        const acceptAttr = isPhoto ? 'image/*' : (isVideo ? 'video/*' : 'video/*,image/*');

        // Default to Keep Original if slot 1 is a title/intro, or allow instant toggle
        const slotCard = document.createElement('div');
        slotCard.className = 'template-slot-card';
        slotCard.id = `template-slot-card-${slot.slot_id}`;
        
        slotCard.innerHTML = `
            <div class="template-slot-header">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-weight:700;">#${slot.slot_id}</span>
                    <span class="slot-type-badge ${badgeClass}">${badgeLabel}</span>
                </div>
                <span id="slot-header-dur-${slot.slot_id}" style="font-size:0.68rem; color:#22d3ee; font-weight:600;">${slot.duration}s</span>
            </div>

            <!-- Mode Toggle: Keep Original vs Replace -->
            <div class="slot-mode-toggle" style="display:flex; gap:4px; margin:4px 0;">
                <button type="button" class="btn-slot-mode active" id="btn-mode-replace-${slot.slot_id}" onclick="setSlotMode(${slot.slot_id}, 'replace')">
                    📤 Replace
                </button>
                <button type="button" class="btn-slot-mode" id="btn-mode-keep-${slot.slot_id}" onclick="setSlotMode(${slot.slot_id}, 'keep')">
                    📌 Keep Original
                </button>
            </div>

            <!-- Replace Upload Input -->
            <div id="slot-replace-box-${slot.slot_id}">
                <input type="file" accept="${acceptAttr}" data-slot="${slot.slot_id}" class="template-slot-input" id="slot-input-${slot.slot_id}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; gap:6px;">
                    <span class="slot-filename" id="slot-name-${slot.slot_id}" style="font-size:0.68rem; color:#a78bfa; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">No file chosen (will keep original)</span>
                    <button type="button" class="btn-crop-slot hidden" id="btn-crop-slot-${slot.slot_id}" onclick="openPhotoCropModal(${slot.slot_id})">
                        <i data-lucide="crop" style="width:11px; height:11px;"></i> ✂️ Crop / Frame
                    </button>
                </div>
            </div>

            <!-- Keep Original Notice (hidden by default) -->
            <div id="slot-keep-box-${slot.slot_id}" class="hidden" style="padding:6px 8px; background:rgba(139,92,246,0.12); border-radius:6px; font-size:0.68rem; color:#c4b5fd;">
                ✓ Preserving original clip from reference edit
            </div>

            <!-- Fine-Tune Timing Slider -->
            <div class="slot-timing-box" style="margin-top:6px; padding:6px 8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.65rem; color:rgba(255,255,255,0.6); margin-bottom:3px;">
                    <span>✂️ Adjust Cut Boundaries:</span>
                    <span id="slot-dur-badge-${slot.slot_id}" style="color:#22d3ee; font-weight:700;">${slot.duration}s</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <div style="display:flex; align-items:center; gap:2px;">
                        <span style="font-size:0.60rem; color:rgba(255,255,255,0.4);">In</span>
                        <input type="number" step="0.05" min="0" max="${blueprint.total_duration}" value="${slot.start}" 
                            id="slot-start-input-${slot.slot_id}" class="slot-num-input"
                            onchange="updateSlotTiming(${slot.slot_id}, this.value, null)">
                    </div>
                    <input type="range" step="0.05" min="${slot.start}" max="${blueprint.total_duration}" value="${slot.end}" 
                        id="slot-end-slider-${slot.slot_id}" class="slot-range-slider" style="flex:1;"
                        oninput="updateSlotTiming(${slot.slot_id}, null, this.value)">
                    <div style="display:flex; align-items:center; gap:2px;">
                        <span style="font-size:0.60rem; color:rgba(255,255,255,0.4);">Out</span>
                        <input type="number" step="0.05" min="0" max="${blueprint.total_duration}" value="${slot.end}" 
                            id="slot-end-input-${slot.slot_id}" class="slot-num-input"
                            onchange="updateSlotTiming(${slot.slot_id}, null, this.value)">
                    </div>
                </div>
            </div>
        `;

        const fileInput = slotCard.querySelector(`#slot-input-${slot.slot_id}`);
        if (fileInput) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    const f = fileInput.files[0];
                    templateSlotRawFiles[slot.slot_id] = f;
                    templateSlotFiles[slot.slot_id] = f;
                    const labelEl = document.getElementById(`slot-name-${slot.slot_id}`);
                    if (labelEl) labelEl.textContent = `✓ ${f.name}`;
                    const cropBtn = document.getElementById(`btn-crop-slot-${slot.slot_id}`);
                    if (cropBtn) cropBtn.classList.remove('hidden');
                    if (window.lucide) lucide.createIcons();
                }
            });
        }

        slotsContainer.appendChild(slotCard);
    });

    // Reveal Depth & Typography Settings Card
    const depthCard = document.getElementById('template-depth-settings-card');
    if (depthCard) depthCard.classList.remove('hidden');

    // Clean up any lyrics box if present
    const existingLyricsBox = document.getElementById('template-lyrics-editor-box');
    if (existingLyricsBox) existingLyricsBox.remove();
    editableTemplateLyrics = [];

    if (btnRender) btnRender.classList.remove('hidden');
}

window.setLayerDepthMode = function(mode) {
    currentTemplateDepthMode = mode;
    const btnBehind = document.getElementById('btn-depth-behind');
    const btnFore = document.getElementById('btn-depth-foreground');
    if (btnBehind && btnFore) {
        if (mode === 'behind_subject') {
            btnBehind.classList.add('active');
            btnFore.classList.remove('active');
        } else {
            btnFore.classList.add('active');
            btnBehind.classList.remove('active');
        }
    }
};

let currentTemplateEngineMode = 'clone';

window.setTemplateEngineMode = function(mode) {
    currentTemplateEngineMode = mode;
    const btnClone = document.getElementById('btn-mode-clone');
    const btnSynth = document.getElementById('btn-mode-synthetic');
    
    if (mode === 'clone') {
        if (btnClone) btnClone.classList.add('active');
        if (btnSynth) btnSynth.classList.remove('active');
    } else {
        if (btnSynth) btnSynth.classList.add('active');
        if (btnClone) btnClone.classList.remove('active');
    }
};

window.setBackdropMode = function(mode) {
    currentTemplateBackdropMode = mode;
    const btnStudio = document.getElementById('btn-backdrop-studio') || document.getElementById('btn-bg-studio');
    const btnPhoto = document.getElementById('btn-backdrop-photo') || document.getElementById('btn-bg-photo');
    if (btnStudio && btnPhoto) {
        if (mode === 'studio_gray') {
            btnStudio.classList.add('active');
            btnPhoto.classList.remove('active');
        } else {
            btnPhoto.classList.add('active');
            btnStudio.classList.remove('active');
        }
    }
};
window.setBackdropStyle = window.setBackdropMode;

window.setTextColorMode = function(color) {
    currentTemplateTextColor = color;
    ['white', 'dark', 'neon'].forEach(c => {
        const btn = document.getElementById(`btn-color-${c}`);
        if (btn) {
            if (c === color) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
};

window.setTemplateAnchorMode = function(mode) {
    currentTemplateAnchorMode = mode;
    ['smart', 'full', 'torso', 'bottom'].forEach(m => {
        const btn = document.getElementById(`btn-anchor-${m}`);
        if (btn) {
            if (m === mode) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
};

window.updateSubjectScale = function(val) {
    currentTemplateSubjectScale = Math.max(0.30, Math.min(1.50, parseFloat(val) || 1.0));
    const slider = document.getElementById('slider-subject-scale');
    if (slider && Math.abs(parseFloat(slider.value) - currentTemplateSubjectScale) > 0.005) {
        slider.value = currentTemplateSubjectScale;
    }
    const numInput = document.getElementById('input-subject-scale-num');
    if (numInput && parseInt(numInput.value) !== Math.round(currentTemplateSubjectScale * 100)) {
        numInput.value = Math.round(currentTemplateSubjectScale * 100);
    }
    const lbl = document.getElementById('label-subject-scale');
    if (lbl) lbl.textContent = `(${currentTemplateSubjectScale.toFixed(2)}x)`;
    updatePlayerTransformBoxUI();
};

window.updatePosXOffset = function(val) {
    currentTemplatePosXOffset = parseInt(val) || 0;
    const slider = document.getElementById('slider-pos-x');
    if (slider && parseInt(slider.value) !== currentTemplatePosXOffset) {
        slider.value = currentTemplatePosXOffset;
    }
    const lbl = document.getElementById('label-pos-x');
    if (lbl) {
        const prefix = currentTemplatePosXOffset > 0 ? `+${currentTemplatePosXOffset}px (Right)` : currentTemplatePosXOffset < 0 ? `${currentTemplatePosXOffset}px (Left)` : '0px (Auto Centered)';
        lbl.textContent = prefix;
    }
    updatePlayerTransformBoxUI();
};

window.updatePosYOffset = function(val) {
    currentTemplatePosYOffset = parseInt(val) || 0;
    const slider = document.getElementById('slider-pos-y');
    if (slider && parseInt(slider.value) !== currentTemplatePosYOffset) {
        slider.value = currentTemplatePosYOffset;
    }
    const lbl = document.getElementById('label-pos-y');
    if (lbl) {
        const prefix = currentTemplatePosYOffset > 0 ? `+${currentTemplatePosYOffset}px (Down)` : currentTemplatePosYOffset < 0 ? `${currentTemplatePosYOffset}px (Up)` : '0px (Auto Eye-Locked)';
        lbl.textContent = prefix;
    }
    updatePlayerTransformBoxUI();
};

window.setSubjectScaleMode = function(scale) {
    currentTemplateSubjectScale = parseFloat(scale);
    const btnBal = document.getElementById('btn-scale-balanced');
    const btnFull = document.getElementById('btn-scale-full');
    if (btnBal && btnFull) {
        if (currentTemplateSubjectScale < 0.98) {
            btnBal.classList.add('active');
            btnFull.classList.remove('active');
        } else {
            btnFull.classList.add('active');
            btnBal.classList.remove('active');
        }
    }
};

window.updateDepthVerticalPos = function(val) {
    const num = parseFloat(val);
    currentTemplateVerticalPos = num / 100.0;
    const slider = document.getElementById('slider-depth-pos');
    if (slider && parseFloat(slider.value) !== num) {
        slider.value = num;
    }
    const lbl = document.getElementById('label-depth-pos');
    if (lbl) {
        let hint = 'Chest / Center - Ref Style';
        if (currentTemplateVerticalPos <= 0.40) hint = 'Behind Neck';
        else if (currentTemplateVerticalPos <= 0.46) hint = 'Upper Chest';
        else if (currentTemplateVerticalPos <= 0.55) hint = 'Chest / Center - Ref Style';
        else hint = 'Lower Torso';
        lbl.textContent = `${num.toFixed(1)}% (${hint})`;
    }
};

function renderEditableLyricsUI(container) {
    const existingBox = document.getElementById('template-lyrics-editor-box');
    if (existingBox) existingBox.remove();
}

window.updateLyricText = function(id, val) {};
window.updateLyricTiming = function(id, newStart, newEnd) {};
window.deleteLyricLine = function(id) {};
window.addLyricLine = function() {};

window.setSlotMode = function(slotId, mode) {
    const btnReplace = document.getElementById(`btn-mode-replace-${slotId}`);
    const btnKeep = document.getElementById(`btn-mode-keep-${slotId}`);
    const replaceBox = document.getElementById(`slot-replace-box-${slotId}`);
    const keepBox = document.getElementById(`slot-keep-box-${slotId}`);
    const fileInput = document.getElementById(`slot-input-${slotId}`);

    if (mode === 'keep') {
        if (btnKeep) btnKeep.classList.add('active');
        if (btnReplace) btnReplace.classList.remove('active');
        if (replaceBox) replaceBox.classList.add('hidden');
        if (keepBox) keepBox.classList.remove('hidden');
        templateSlotFiles[slotId] = '__KEEP_ORIGINAL__';
    } else {
        if (btnReplace) btnReplace.classList.add('active');
        if (btnKeep) btnKeep.classList.remove('active');
        if (replaceBox) replaceBox.classList.remove('hidden');
        if (keepBox) keepBox.classList.add('hidden');
        if (fileInput && fileInput.files.length) {
            templateSlotFiles[slotId] = fileInput.files[0];
        } else {
            delete templateSlotFiles[slotId];
        }
    }
};

window.updateSlotTiming = function(slotId, newStart, newEnd) {
    if (!templateSlotTimings[slotId]) {
        templateSlotTimings[slotId] = { start: 0, end: 1 };
    }

    if (newStart !== null && newStart !== undefined) {
        templateSlotTimings[slotId].start = Math.max(0, parseFloat(newStart) || 0);
    }
    if (newEnd !== null && newEnd !== undefined) {
        templateSlotTimings[slotId].end = Math.max(templateSlotTimings[slotId].start + 0.1, parseFloat(newEnd) || 0);
    }

    const cur = templateSlotTimings[slotId];
    const dur = Math.max(0.1, cur.end - cur.start).toFixed(2);

    // Update UI elements
    const startIn = document.getElementById(`slot-start-input-${slotId}`);
    const endIn = document.getElementById(`slot-end-input-${slotId}`);
    const endSlider = document.getElementById(`slot-end-slider-${slotId}`);
    const badgeEl = document.getElementById(`slot-dur-badge-${slotId}`);
    const headerDurEl = document.getElementById(`slot-header-dur-${slotId}`);

    if (startIn) startIn.value = cur.start.toFixed(2);
    if (endIn) endIn.value = cur.end.toFixed(2);
    if (endSlider) endSlider.value = cur.end;
    if (badgeEl) badgeEl.textContent = `${dur}s`;
    if (headerDurEl) headerDurEl.textContent = `${dur}s`;
};

async function renderTemplateEdit() {
    if (!currentTemplateBlueprint) {
        alert('Please extract a template first.');
        return;
    }

    const btnRender = document.getElementById('btn-render-template');
    btnRender.disabled = true;
    btnRender.innerHTML = '<i data-lucide="loader"></i> Compiling Template Edit...';
    if (window.lucide) lucide.createIcons();

    const formData = new FormData();
    const placeholders = currentTemplateBlueprint.placeholders || [];

    // Ensure every slot has a value (either user file or __KEEP_ORIGINAL__)
    placeholders.forEach(slot => {
        const sid = slot.slot_id;
        const val = templateSlotFiles[sid];
        if (val instanceof File) {
            formData.append(`slot_${sid}`, val);
        } else {
            formData.append(`slot_${sid}`, '__KEEP_ORIGINAL__');
        }
    });

    // Send custom adjusted timing values from the sliders
    formData.append('custom_timings_json', JSON.stringify(templateSlotTimings));

    // Send 3D depth and layout options
    formData.append('layer_depth', currentTemplateDepthMode);
    formData.append('vertical_pos', currentTemplateVerticalPos.toString());
    formData.append('backdrop_style', currentTemplateBackdropMode);
    formData.append('text_color', currentTemplateTextColor);
    formData.append('subject_scale', currentTemplateSubjectScale.toString());
    formData.append('anchor_mode', currentTemplateAnchorMode);
    formData.append('pos_x_offset', currentTemplatePosXOffset.toString());
    formData.append('pos_y_offset', currentTemplatePosYOffset.toString());
    const transType = (currentTemplateBlueprint && currentTemplateBlueprint.caption_style && currentTemplateBlueprint.caption_style.transition) ? currentTemplateBlueprint.caption_style.transition : 'cut';
    formData.append('transition_type', transType);
    formData.append('edit_mode', currentTemplateEngineMode);
    formData.append('aspect_ratio', currentPlayerAspectMode);

    setSystemStatus('running', 'Rendering Template Edit... 0%');
    playerRenderingSpinner.classList.remove('hidden');
    updateRenderProgress(0, 'Initializing Neural Models', 'Preparing assets & hardware acceleration');

    appendLog('System', 'Pipeline Manager', 'Initializing Multi-Model Template Synthesis Engine...', 'INFO');

    try {
        const res = await fetch('/api/template/render', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            startTemplateRenderStream();
        } else {
            alert('Template compilation initiation failed: ' + (data.detail || data.message));
            setSystemStatus('error', 'Compilation Error');
            playerRenderingSpinner.classList.add('hidden');
            btnRender.disabled = false;
            btnRender.innerHTML = '<i data-lucide="play-circle"></i> Render Template Edit';
            if (window.lucide) lucide.createIcons();
        }
    } catch (e) {
        alert('Template render request failed: ' + e.message);
        setSystemStatus('error', 'Network Error');
        playerRenderingSpinner.classList.add('hidden');
        btnRender.disabled = false;
        btnRender.innerHTML = '<i data-lucide="play-circle"></i> Render Template Edit';
        if (window.lucide) lucide.createIcons();
    }
}

function startTemplateRenderStream() {
    if (currentTemplateEventSource) {
        currentTemplateEventSource.close();
    }

    const btnRender = document.getElementById('btn-render-template');
    currentTemplateEventSource = new EventSource('/api/template/stream-render');

    currentTemplateEventSource.onmessage = (event) => {
        const log = JSON.parse(event.data);

        // Update progress if present
        if (log.progress !== undefined && log.progress !== null) {
            let detail = log.message;
            const matchFrames = log.message.match(/\((\d+\/\d+ frames)\)/);
            if (matchFrames) detail = matchFrames[1];
            updateRenderProgress(log.progress, log.agent || 'Rendering', detail);
        }

        // Handle core system triggers
        if (log.message === 'TEMPLATE_COMPILE_SUCCESSFUL') {
            currentTemplateEventSource.close();
            updateRenderProgress(100, 'Render Complete', 'Finished 100%');

            const videoUrl = `/static/edited_output.mp4?cb=${Date.now()}`;
            mainVideoPlayer.src = videoUrl;
            mainVideoPlayer.load();
            try { mainVideoPlayer.play(); } catch(e) {}

            setSystemStatus('success', 'Template Edit Complete!');
            setTimeout(() => {
                playerRenderingSpinner.classList.add('hidden');
                const tplCard = document.getElementById('template-render-progress-card');
                if (tplCard) tplCard.classList.add('hidden');
            }, 1200);

            // Show the result card & direct download button
            const resultCard = document.getElementById('template-result-card');
            const downloadBtn = document.getElementById('btn-download-template-video');
            if (resultCard) resultCard.classList.remove('hidden');
            if (downloadBtn) downloadBtn.href = videoUrl;
            if (window.lucide) lucide.createIcons();

            appendLog('System', 'Pipeline Manager', '3D Depth template edit compiled successfully! Ready to preview & download.', 'SUCCESS');

            if (btnRender) {
                btnRender.disabled = false;
                btnRender.innerHTML = '<i data-lucide="play-circle"></i> Render Template Edit';
                if (window.lucide) lucide.createIcons();
            }

            // Scroll to preview player
            const previewSection = document.querySelector('.panel-preview');
            if (previewSection) {
                previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        if (log.level === 'ERROR') {
            currentTemplateEventSource.close();
            setSystemStatus('idle', 'Error');
            appendLog(log.agent, log.role, log.message, log.level);
            playerRenderingSpinner.classList.add('hidden');
            if (btnRender) {
                btnRender.disabled = false;
                btnRender.innerHTML = '<i data-lucide="play-circle"></i> Render Template Edit';
                if (window.lucide) lucide.createIcons();
            }
            alert('Template render error: ' + log.message);
            return;
        }

        appendLog(log.agent, log.role, log.message, log.level);
        updateAgentUI(log.agent, log.level, log.message);
    };

    currentTemplateEventSource.onerror = (e) => {
        console.warn('Template SSE connection closed or reconnecting...', e);
    };
}

window.focusTemplateAdjustments = function() {
    // Switch to Template tab
    const tabBtnTemplate = document.getElementById('tab-btn-template');
    if (tabBtnTemplate) tabBtnTemplate.click();
    
    // Scroll smoothly to the slots container
    const slotsEl = document.getElementById('template-slots-container');
    if (slotsEl) {
        slotsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// ==========================================
// INTERACTIVE PHOTO CROP & FRAMING MODAL
// ==========================================
let currentCropSlotId = null;
let currentCropImage = null;
let currentCropOriginalFile = null;
let cropState = {
    imgX: 0,
    imgY: 0,
    imgW: 0,
    imgH: 0,
    cropX: 0,
    cropY: 0,
    cropW: 0,
    cropH: 0,
    aspectRatio: 'free',
    isDragging: false,
    dragMode: null,
    startX: 0,
    startY: 0,
    initCrop: {}
};

function setupPhotoCropModal() {
    const canvas = document.getElementById('photo-crop-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', onCropMouseDown);
    window.addEventListener('mousemove', onCropMouseMove);
    window.addEventListener('mouseup', onCropMouseUp);

    // Touch support for mobile/tablets
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            onCropMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
        }
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
        if (cropState.isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            onCropMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }, { passive: false });
    window.addEventListener('touchend', onCropMouseUp);
}

window.openPhotoCropModal = function(slotId) {
    currentCropSlotId = slotId;
    const file = templateSlotRawFiles[slotId] || templateSlotFiles[slotId];
    if (!file || !(file instanceof File)) {
        alert('Please select a photo for this slot first.');
        return;
    }
    currentCropOriginalFile = file;

    const modal = document.getElementById('photo-crop-modal');
    if (modal) modal.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentCropImage = img;
            initCropCanvas(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

window.closePhotoCropModal = function() {
    const modal = document.getElementById('photo-crop-modal');
    if (modal) modal.classList.add('hidden');
    currentCropImage = null;
    cropState.isDragging = false;
};

function initCropCanvas(img) {
    const canvas = document.getElementById('photo-crop-canvas');
    const wrapper = document.getElementById('crop-canvas-wrapper');
    if (!canvas || !wrapper) return;

    const maxW = wrapper.clientWidth - 24 || 640;
    const maxH = wrapper.clientHeight - 24 || 380;

    const imgAspect = img.width / img.height;
    let dispW = maxW;
    let dispH = maxW / imgAspect;
    if (dispH > maxH) {
        dispH = maxH;
        dispW = maxH * imgAspect;
    }

    canvas.width = Math.round(dispW);
    canvas.height = Math.round(dispH);

    cropState.imgX = 0;
    cropState.imgY = 0;
    cropState.imgW = canvas.width;
    cropState.imgH = canvas.height;

    // Default crop box: centered 85% of image
    const initialAspect = cropState.aspectRatio === 'free' ? null : cropState.aspectRatio;
    if (initialAspect) {
        let cw = cropState.imgW * 0.85;
        let ch = cw / initialAspect;
        if (ch > cropState.imgH * 0.90) {
            ch = cropState.imgH * 0.90;
            cw = ch * initialAspect;
        }
        cropState.cropW = Math.round(cw);
        cropState.cropH = Math.round(ch);
    } else {
        cropState.cropW = Math.round(cropState.imgW * 0.85);
        cropState.cropH = Math.round(cropState.imgH * 0.85);
    }
    cropState.cropX = Math.round((cropState.imgW - cropState.cropW) / 2);
    cropState.cropY = Math.round((cropState.imgH - cropState.cropH) / 2);

    drawCropCanvas();
}

window.setCropAspectRatio = function(ratio) {
    cropState.aspectRatio = ratio;
    ['free', '916', '11', '45', 'orig'].forEach(r => {
        const btn = document.getElementById('btn-crop-ratio-' + r);
        if (btn) btn.classList.remove('active');
    });

    let targetRatio = null;
    if (ratio === 9/16) {
        targetRatio = 9/16;
        const b = document.getElementById('btn-crop-ratio-916');
        if (b) b.classList.add('active');
    } else if (ratio === 1/1) {
        targetRatio = 1/1;
        const b = document.getElementById('btn-crop-ratio-11');
        if (b) b.classList.add('active');
    } else if (ratio === 4/5) {
        targetRatio = 4/5;
        const b = document.getElementById('btn-crop-ratio-45');
        if (b) b.classList.add('active');
    } else if (ratio === 'orig' && currentCropImage) {
        targetRatio = currentCropImage.width / currentCropImage.height;
        const b = document.getElementById('btn-crop-ratio-orig');
        if (b) b.classList.add('active');
    } else {
        const b = document.getElementById('btn-crop-ratio-free');
        if (b) b.classList.add('active');
    }

    if (targetRatio) {
        let newW = cropState.cropW;
        let newH = newW / targetRatio;
        if (newH > cropState.imgH) {
            newH = cropState.imgH * 0.9;
            newW = newH * targetRatio;
        }
        cropState.cropW = Math.round(newW);
        cropState.cropH = Math.round(newH);
        cropState.cropX = Math.max(0, Math.min(cropState.imgW - cropState.cropW, cropState.cropX));
        cropState.cropY = Math.max(0, Math.min(cropState.imgH - cropState.cropH, cropState.cropY));
    }
    drawCropCanvas();
};

function drawCropCanvas() {
    const canvas = document.getElementById('photo-crop-canvas');
    if (!canvas || !currentCropImage) return;
    const ctx = canvas.getContext('2d');

    // 1. Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentCropImage, 0, 0, canvas.width, canvas.height);

    // 2. Dark overlay outside crop box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, cropState.cropY);
    ctx.fillRect(0, cropState.cropY + cropState.cropH, canvas.width, canvas.height - (cropState.cropY + cropState.cropH));
    ctx.fillRect(0, cropState.cropY, cropState.cropX, cropState.cropH);
    ctx.fillRect(cropState.cropX + cropState.cropW, cropState.cropY, canvas.width - (cropState.cropX + cropState.cropW), cropState.cropH);

    // 3. Crop box border & rule-of-thirds grid
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropState.cropX, cropState.cropY, cropState.cropW, cropState.cropH);

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cropState.cropX, cropState.cropY + cropState.cropH / 3);
    ctx.lineTo(cropState.cropX + cropState.cropW, cropState.cropY + cropState.cropH / 3);
    ctx.moveTo(cropState.cropX, cropState.cropY + (cropState.cropH * 2) / 3);
    ctx.lineTo(cropState.cropX + cropState.cropW, cropState.cropY + (cropState.cropH * 2) / 3);
    ctx.moveTo(cropState.cropX + cropState.cropW / 3, cropState.cropY);
    ctx.lineTo(cropState.cropX + cropState.cropW / 3, cropState.cropY + cropState.cropH);
    ctx.moveTo(cropState.cropX + (cropState.cropW * 2) / 3, cropState.cropY);
    ctx.lineTo(cropState.cropX + (cropState.cropW * 2) / 3, cropState.cropY + cropState.cropH);
    ctx.stroke();

    // 4. Corner Handles
    const handleSize = 10;
    ctx.fillStyle = '#22d3ee';
    const corners = [
        [cropState.cropX, cropState.cropY],
        [cropState.cropX + cropState.cropW, cropState.cropY],
        [cropState.cropX, cropState.cropY + cropState.cropH],
        [cropState.cropX + cropState.cropW, cropState.cropY + cropState.cropH]
    ];
    corners.forEach(([cx, cy]) => {
        ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    });

    // 5. Update dimension readout
    const scale = currentCropImage.width / canvas.width;
    const realW = Math.round(cropState.cropW * scale);
    const realH = Math.round(cropState.cropH * scale);
    const dimLabel = document.getElementById('crop-dimensions-label');
    if (dimLabel) {
        dimLabel.textContent = `${realW} × ${realH} px (${(realW / realH).toFixed(2)})`;
    }
}

function getCropPointerPos(e) {
    const canvas = document.getElementById('photo-crop-canvas');
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function onCropMouseDown(e) {
    if (!currentCropImage) return;
    const pos = getCropPointerPos(e);
    const hitTolerance = 18;
    const { cropX, cropY, cropW, cropH } = cropState;

    let mode = null;
    if (Math.hypot(pos.x - cropX, pos.y - cropY) <= hitTolerance) mode = 'nw';
    else if (Math.hypot(pos.x - (cropX + cropW), pos.y - cropY) <= hitTolerance) mode = 'ne';
    else if (Math.hypot(pos.x - cropX, pos.y - (cropY + cropH)) <= hitTolerance) mode = 'sw';
    else if (Math.hypot(pos.x - (cropX + cropW), pos.y - (cropY + cropH)) <= hitTolerance) mode = 'se';
    else if (pos.x >= cropX && pos.x <= cropX + cropW && pos.y >= cropY && pos.y <= cropY + cropH) mode = 'move';

    if (mode) {
        if (e.preventDefault) e.preventDefault();
        cropState.isDragging = true;
        cropState.dragMode = mode;
        cropState.startX = pos.x;
        cropState.startY = pos.y;
        cropState.initCrop = { cropX, cropY, cropW, cropH };
    }
}

function onCropMouseMove(e) {
    if (!cropState.isDragging || !currentCropImage) return;
    const pos = getCropPointerPos(e);
    const dx = pos.x - cropState.startX;
    const dy = pos.y - cropState.startY;
    const init = cropState.initCrop;
    const canvas = document.getElementById('photo-crop-canvas');

    if (cropState.dragMode === 'move') {
        cropState.cropX = Math.max(0, Math.min(canvas.width - init.cropW, init.cropX + dx));
        cropState.cropY = Math.max(0, Math.min(canvas.height - init.cropH, init.cropY + dy));
    } else if (cropState.dragMode === 'se') {
        let newW = Math.max(40, Math.min(canvas.width - init.cropX, init.cropW + dx));
        let newH = Math.max(40, Math.min(canvas.height - init.cropY, init.cropH + dy));
        if (cropState.aspectRatio !== 'free' && cropState.aspectRatio) {
            newH = newW / cropState.aspectRatio;
            if (init.cropY + newH > canvas.height) {
                newH = canvas.height - init.cropY;
                newW = newH * cropState.aspectRatio;
            }
        }
        cropState.cropW = Math.round(newW);
        cropState.cropH = Math.round(newH);
    } else if (cropState.dragMode === 'nw') {
        let newW = Math.max(40, init.cropW - dx);
        let newH = Math.max(40, init.cropH - dy);
        let newX = init.cropX + (init.cropW - newW);
        let newY = init.cropY + (init.cropH - newH);
        if (newX < 0) { newW += newX; newX = 0; }
        if (newY < 0) { newH += newY; newY = 0; }
        cropState.cropX = Math.round(newX);
        cropState.cropY = Math.round(newY);
        cropState.cropW = Math.round(newW);
        cropState.cropH = Math.round(newH);
    }
    drawCropCanvas();
}

function onCropMouseUp() {
    cropState.isDragging = false;
    cropState.dragMode = null;
}

window.applyPhotoCrop = function() {
    if (!currentCropImage || currentCropSlotId === null) return;
    const canvas = document.getElementById('photo-crop-canvas');
    if (!canvas) return;

    const scale = currentCropImage.width / canvas.width;
    const srcX = Math.round(cropState.cropX * scale);
    const srcY = Math.round(cropState.cropY * scale);
    const srcW = Math.round(cropState.cropW * scale);
    const srcH = Math.round(cropState.cropH * scale);

    const offscreen = document.createElement('canvas');
    offscreen.width = srcW;
    offscreen.height = srcH;
    const ctx = offscreen.getContext('2d');
    ctx.drawImage(currentCropImage, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    offscreen.toBlob((blob) => {
        if (!blob) return;
        const origName = (currentCropOriginalFile && currentCropOriginalFile.name) ? currentCropOriginalFile.name : 'photo.png';
        const croppedFile = new File([blob], `cropped_${origName}`, { type: 'image/png' });
        templateSlotFiles[currentCropSlotId] = croppedFile;

        const labelEl = document.getElementById(`slot-name-${currentCropSlotId}`);
        if (labelEl) {
            labelEl.textContent = `✂️ Cropped (${srcW}×${srcH}px)`;
            labelEl.style.color = '#22d3ee';
        }

        closePhotoCropModal();
    }, 'image/png');
};

window.resetCropToOriginal = function() {
    if (currentCropSlotId === null || !currentCropOriginalFile) return;
    templateSlotFiles[currentCropSlotId] = currentCropOriginalFile;
    const labelEl = document.getElementById(`slot-name-${currentCropSlotId}`);
    if (labelEl) {
        labelEl.textContent = `✓ ${currentCropOriginalFile.name}`;
        labelEl.style.color = '#a78bfa';
    }
    closePhotoCropModal();
};

// ==========================================
// ON-PLAYER INTERACTIVE TRANSFORM BOX
// ==========================================
let isTransformBoxActive = false;
let isTransformDragging = false;
let transformDragMode = null;
let transformStartX = 0;
let transformStartY = 0;
let transformInitScale = 1.0;
let transformInitX = 0;
let transformInitY = 0;

function setupPlayerTransformBox() {
    const box = document.getElementById('player-transform-box');
    if (!box) return;

    box.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.transform-handle');
        if (handle) {
            transformDragMode = handle.dataset.corner || 'br';
        } else {
            transformDragMode = 'move';
        }
        isTransformDragging = true;
        transformStartX = e.clientX;
        transformStartY = e.clientY;
        transformInitScale = currentTemplateSubjectScale;
        transformInitX = currentTemplatePosXOffset;
        transformInitY = currentTemplatePosYOffset;
        e.preventDefault();
        e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isTransformDragging) return;
        const dx = e.clientX - transformStartX;
        const dy = e.clientY - transformStartY;

        if (transformDragMode === 'move') {
            const newX = Math.round(transformInitX + dx);
            const newY = Math.round(transformInitY + dy);
            updatePosXOffset(newX);
            updatePosYOffset(newY);
        } else {
            const dist = (dx - dy) / 250.0;
            const newScale = Math.max(0.30, Math.min(1.50, transformInitScale + dist));
            updateSubjectScale(newScale);
        }
    });

    window.addEventListener('mouseup', () => {
        isTransformDragging = false;
        transformDragMode = null;
    });
}

window.togglePlayerTransformBox = function() {
    isTransformBoxActive = !isTransformBoxActive;
    const box = document.getElementById('player-transform-box');
    const btn = document.getElementById('btn-toggle-transform-box');
    if (box) {
        if (isTransformBoxActive) {
            box.classList.remove('hidden');
            if (btn) btn.classList.add('active');
            updatePlayerTransformBoxUI();
        } else {
            box.classList.add('hidden');
            if (btn) btn.classList.remove('active');
        }
    }
};

function updatePlayerTransformBoxUI() {
    const box = document.getElementById('player-transform-box');
    const playerContainer = document.getElementById('player-container');
    if (!box || !playerContainer || box.classList.contains('hidden')) return;

    const pw = playerContainer.clientWidth;
    const ph = playerContainer.clientHeight;

    const boxW = Math.round(pw * 0.28 * currentTemplateSubjectScale);
    const boxH = Math.round(ph * 0.70 * currentTemplateSubjectScale);

    const centerX = (pw / 2) + currentTemplatePosXOffset;
    const centerY = (ph / 2) + currentTemplatePosYOffset;

    const left = Math.round(centerX - (boxW / 2));
    const top = Math.round(centerY - (boxH / 2));

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${boxW}px`;
    box.style.height = `${boxH}px`;

    const badge = document.getElementById('transform-badge');
    if (badge) {
        badge.textContent = `Size: ${Math.round(currentTemplateSubjectScale * 100)}% | Pos: (${currentTemplatePosXOffset}, ${currentTemplatePosYOffset})`;
    }
}

// Window Onload triggers
window.addEventListener('load', () => {
    checkLicenseStatus();
    init();
    renderMusicList();
    renderSfxList();
    renderSfxShortlist();
    setupAttributionCopy();
    updateAttributionCredits();
    // Pre-draw an empty timeline
    drawTimeline();
    // Attempt to restore state from backend
    restoreJobState();
});
