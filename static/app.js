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
            document.getElementById('tab-' + tabId).classList.add('active');
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
            renderStatusHeading.innerText = `Rendering Video... ${pct}%`;
            playerRenderingSpinner.classList.remove('hidden');
        }
        
        // Handle core system triggers
        if (log.message === "VIDEO_COMPILE_SUCCESSFUL") {
            currentEventSource.close();
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
    const card = agentCards[agentName];
    if (!card) return;
    
    // Reset active states for others (unless they are marked skipped)
    Object.keys(agentCards).forEach(name => {
        const otherCard = agentCards[name];
        if (otherCard.classList.contains('active')) {
            otherCard.className = 'agent-card success'; // Transition to success after active
        }
    });
    
    // Set current agent class
    if (message.includes("Bypassed")) {
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
function setupReprompt() {
    const btnReprompt = document.getElementById('btn-reprompt');
    const btnFresh = document.getElementById('btn-start-fresh');
    if (!btnReprompt || !btnFresh) return;
    
    btnReprompt.addEventListener('click', async () => {
        const newPrompt = document.getElementById('reprompt-text').value.trim();
        if (!newPrompt) { alert('Please enter new instructions.'); return; }
        
        btnReprompt.disabled = true;
        btnReprompt.innerHTML = '<i data-lucide="loader"></i> Re-editing...';
        lucide.createIcons();
        
        try {
            const payload = { 
                prompt: newPrompt,
                default_music_volume: defaultMusicVolume,
                default_sfx_volume: defaultSfxVolume,
                music_config_json: JSON.stringify(musicAssets.map(a => ({ filename: a.file.name, volume: a.volume }))),
                sfx_config_json: JSON.stringify(sfxAssets.map(a => ({ filename: a.file.name, volume: a.volume })))
            };
            
            const res = await fetch('/api/reprompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                document.getElementById('prompt').value = newPrompt;
                document.getElementById('reprompt-panel').classList.add('hidden');
                consoleLogs.innerHTML = '<div class="log-line system">[System] Reprompt accepted. Re-running agent pipeline...</div>';
                setSystemStatus('running', 'Re-Analyzing...');
                playerRenderingSpinner.classList.remove('hidden');
                renderStatusHeading.innerText = 'Re-processing with new instructions...';
                Object.values(agentCards).forEach(card => { card.className = 'agent-card idle'; });
                restoreJobState();
                startLogStream();
            } else {
                alert('Reprompt failed: ' + (data.detail || data.message));
            }
        } catch(e) {
            alert('Reprompt request failed: ' + e.message);
        } finally {
            btnReprompt.disabled = false;
            btnReprompt.innerHTML = '<i data-lucide="refresh-cw"></i> Re-Edit with Changes';
            lucide.createIcons();
        }
    });
    
    btnFresh.addEventListener('click', () => {
        document.getElementById('reprompt-panel').classList.add('hidden');
        resetWorkspace();
    });
}

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

// Window Onload triggers
window.addEventListener('load', () => {
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
