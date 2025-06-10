// js/script.js - FULLY RE-INTEGRATED AND CONSOLIDATED WITH COLLABORATIVE FEATURES

document.addEventListener('DOMContentLoaded', function() {
console.log("Main DOMContentLoaded Fired - AR WhiteBoard Scripts Initializing...");
const htmlElement = document.documentElement;

// --- localStorage Helper Functions ---
const SESSIONS_STORAGE_KEY = 'arWhiteboardSessions';
function getSavedSessions() {
    const sessionsJSON = localStorage.getItem(SESSIONS_STORAGE_KEY);
    try { return sessionsJSON ? JSON.parse(sessionsJSON) : []; }
    catch (e) { console.error("Error parsing saved sessions from localStorage:", e); return []; }
}
function saveSessionsToStorage(sessions) {
    try { localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions)); }
    catch (e) { console.error("Error saving sessions to localStorage:", e); alert("Could not save session."); }
}

// --- Theme Toggler & tsParticles Instance & Functions ---
const themeToggler = document.getElementById('themeToggler');
const sunIcon = themeToggler?.querySelector('.icon-sun');
const moonIcon = themeToggler?.querySelector('.icon-moon');
let tsParticlesInstance = null;

function getTsParticlesOptions() {
    const styles = getComputedStyle(document.documentElement);
    const particleColors = [
        styles.getPropertyValue('--ts-particle-color1').trim(),
        styles.getPropertyValue('--ts-particle-color2').trim(),
        styles.getPropertyValue('--ts-particle-color3').trim()
    ];
    const linkColor = styles.getPropertyValue('--ts-link-color').trim();
    return { /* ... Your existing tsParticles options ... */
        autoPlay: true, background: { opacity: 1 }, fullScreen: { enable: true, zIndex: -1 }, fpsLimit: 60,
        interactivity: {
            events: { onClick: { enable: true, mode: "push" }, onHover: { enable: true, mode: "grab" , parallax: { enable: true, force: 60, smooth: 10 } }, resize: true },
            modes: { push: { quantity: 4 }, grab: { distance: 150, links: { opacity: 0.5 } } }
        },
        particles: {
            color: { value: particleColors }, links: { color: { value: linkColor }, distance: 150, enable: true, opacity: 0.3, width: 1 },
            move: { direction: "none", enable: true, outModes: "out", random: true, speed: 1, straight: false },
            number: { density: { enable: true, area: 1000 }, value: 40 },
            opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.8, minimumValue: 0.05, sync: false } },
            shape: { type: ["circle", "triangle"] },
            size: { value: { min: 1, max: 3 }, animation: { enable: true, speed: 1.5, minimumValue: 0.5, sync: false } }
        },
        detectRetina: true,
    };
}
function setupTsParticles() {
    if (typeof tsParticles !== "undefined") {
        const options = getTsParticlesOptions();
        if (tsParticlesInstance) {
            tsParticlesInstance.destroy();
            tsParticlesInstance = null;
        }
        tsParticles.load("tsparticles-bg", options).then(container => {
            tsParticlesInstance = container;
        }).catch(error => {
            console.error("Error loading/refreshing tsParticles:", error);
            tsParticlesInstance = null;
        });
    }
}
function applyTheme(theme) {
    if (theme === 'dark') {
        htmlElement.setAttribute('data-bs-theme', 'dark');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'inline-block';
    } else {
        htmlElement.removeAttribute('data-bs-theme');
        if (sunIcon) sunIcon.style.display = 'inline-block';
        if (moonIcon) moonIcon.style.display = 'none';
    }
    setupTsParticles(); // Refresh particles on theme change
}
if (themeToggler) {
    themeToggler.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let initialTheme = 'light';
if (savedTheme) initialTheme = savedTheme;
else if (prefersDark) initialTheme = 'dark';
applyTheme(initialTheme);


// --- General Page Setup (Navbar Scroll, Animations, Footer Year) ---
const navbar = document.querySelector('.navbar.fixed-top');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}
const animatedElements = document.querySelectorAll('[data-animation]');
if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay) || 0;
                setTimeout(() => entry.target.classList.add('is-visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => observer.observe(el));
}
const currentYearSpan = document.getElementById('currentYear');
if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

// --- Page-Specific Form Handlers ---
const joinSessionForm = document.getElementById('joinSessionForm');
if (joinSessionForm) {
    joinSessionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const sessionCode = document.getElementById('sessionCode')?.value.trim();
        const joinerName = document.getElementById('joinerName')?.value.trim();
        
        if (!sessionCode || !joinerName) {
            alert('Please enter the session code and your name.');
            return;
        }
        const sessionURL = `session.html?sessionId=${encodeURIComponent(sessionCode)}&joinerName=${encodeURIComponent(joinerName)}`;
        console.log(`Attempting to join session: ID=${sessionCode}, Joiner=${joinerName}`);
        window.location.href = sessionURL;

        var joinModalEl = document.getElementById('join-modal');
        if (joinModalEl) {
            var joinModal = bootstrap.Modal.getInstance(joinModalEl);
            if (joinModal) joinModal.hide();
        }
        this.reset();
    });
}

const hostSessionForm = document.getElementById('hostSessionForm');
if (hostSessionForm) {
    hostSessionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const hostNameInputVal = document.getElementById('hostName')?.value.trim();
        const sessionNameInputVal = document.getElementById('sessionName')?.value.trim();
        // const sessionPassword = document.getElementById('sessionPassword')?.value; // Keep for future use
        if (!hostNameInputVal || !sessionNameInputVal) {
            alert("Please fill in Your Name and Session Name."); return;
        }
        
        // --- WITH THESE LINES: ---
        const sanitizedHostName = hostNameInputVal.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10) || 'Host';
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const newSessionId = `${sanitizedHostName}-${randomSuffix}`;
        const sessionURL = `session.html?sessionId=${encodeURIComponent(newSessionId)}&sessionName=${encodeURIComponent(sessionNameInputVal)}&hostName=${encodeURIComponent(hostNameInputVal)}`;
        
        console.log(`New session created: ID=${newSessionId}, Name=${sessionNameInputVal}, Host=${hostNameInputVal}`);
        window.location.href = sessionURL;
    });
}

const togglePasswordVisibilityButton = document.getElementById('togglePasswordVisibility');
const passwordInput = document.getElementById('sessionPassword'); // Make sure this ID exists on host.html
if (togglePasswordVisibilityButton && passwordInput) {
    togglePasswordVisibilityButton.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i')?.classList.toggle('bi-eye-fill');
        this.querySelector('i')?.classList.toggle('bi-eye-slash-fill');
    });
}

const contactPageForm = document.getElementById('contactPageForm');
if (contactPageForm) { /* ... Your existing contact form logic ... */
    contactPageForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const contactName = document.getElementById('contactName')?.value.trim();
        const contactEmail = document.getElementById('contactEmail')?.value.trim();
        const contactSubject = document.getElementById('contactSubject')?.value.trim();
        const contactMessage = document.getElementById('contactMessage')?.value.trim();
        if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
            alert("Please fill in all fields of the contact form."); return;
        }
        console.log("Contact Form Submitted:", { name: contactName, email: contactEmail, subject: contactSubject, message: contactMessage });
        alert(`Thank you, ${contactName}! Message received.\n(Demo - no email sent.)`);
        this.reset();
    });
}

// === Dashboard Page Specific JavaScript ===
const sessionsContainer = document.getElementById('sessionsContainer');
const noSessionsMessage = document.getElementById('noSessionsMessage');
const clearAllSessionsBtn = document.getElementById('clearAllSessionsBtn');

if (sessionsContainer && noSessionsMessage) { /* ... Your existing dashboard logic ... */
    function renderSessionCard(session) {
        const createdDate = new Date(session.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4 session-card-column';
        col.setAttribute('data-session-id', session.id);
        const truncatedSessionName = session.sessionName.length > 30 ? session.sessionName.substring(0, 27) + "..." : session.sessionName;
        const truncatedHostName = session.hostName.length > 20 ? session.hostName.substring(0, 17) + "..." : session.hostName;
        col.innerHTML = `
            <div class="card session-card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-semibold text-truncate" title="${session.sessionName}">${truncatedSessionName}</h5>
                    <p class="card-subtitle mb-2 text-muted small"><i class="bi bi-person-fill me-1"></i>Hosted by: <span title="${session.hostName}">${truncatedHostName}</span></p>
                    <p class="card-text small text-muted flex-grow-1"><i class="bi bi-calendar-check me-1"></i>Saved: ${createdDate}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                        <a href="session.html?sessionId=${session.id}&sessionName=${encodeURIComponent(session.sessionName)}&hostName=${encodeURIComponent(session.hostName)}" class="btn btn-sm btn-primary btn-gradient view-session-btn"><i class="bi bi-eye-fill me-1"></i> View</a>
                        <button class="btn btn-sm btn-outline-danger delete-session-btn" data-session-id="${session.id}" title="Delete"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            </div>`;
        return col;
    }
    function displaySavedSessions() {
        const sessions = getSavedSessions();
        sessionsContainer.innerHTML = '';
        if (sessions.length === 0) {
            noSessionsMessage.style.display = 'block';
            if (clearAllSessionsBtn) clearAllSessionsBtn.style.display = 'none';
        } else {
            noSessionsMessage.style.display = 'none';
            if (clearAllSessionsBtn) clearAllSessionsBtn.style.display = 'inline-block';
            sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            sessions.forEach(session => sessionsContainer.appendChild(renderSessionCard(session)));
            addDashboardEventListeners();
        }
    }
    function addDashboardEventListeners() {
        sessionsContainer.addEventListener('click', function(event) {
            const deleteButton = event.target.closest('.delete-session-btn');
            if (deleteButton) {
                const sessionId = deleteButton.dataset.sessionId;
                if (confirm("Delete this session?")) deleteSession(sessionId);
            }
        });
    }
    function deleteSession(sessionId) {
        let sessions = getSavedSessions();
        sessions = sessions.filter(session => session.id !== sessionId);
        saveSessionsToStorage(sessions);
        displaySavedSessions();
    }
    if (clearAllSessionsBtn) {
        clearAllSessionsBtn.addEventListener('click', function() {
            if (confirm("Delete ALL saved sessions?")) { localStorage.removeItem(SESSIONS_STORAGE_KEY); displaySavedSessions(); }
        });
    }
    displaySavedSessions(); // Initial render
}


// === Session Page Specific JavaScript (on session.html) ===
const canvasElement = document.getElementById('whiteboardCanvas'); // Renamed from 'canvas' to avoid conflict if script runs on other pages.
if (canvasElement) {
    console.log("[SESSION PAGE] Canvas element FOUND. Initializing logic...");

    // --- COLLABORATIVE & SESSION STATE VARIABLES ---
    let socket;
    let localUserId = null;
    let currentSessionIdFromURL = null; // Explicitly from URL
    let sessionNameFromURL = 'Session';
    let hostNameFromURL = 'Host';
    let joinerNameFromURL = null;
    const participantsList = {}; // { userId: userName }

    // --- LOCAL DRAWING & UI STATE VARIABLES (from your original code) ---
    const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    const activeSessionNameEl = document.getElementById('activeSessionName');
    const activeHostNameEl = document.getElementById('activeHostName');
    const hostParticipantEl = document.getElementById('hostParticipant'); // In participant list
    const participantListUl = document.getElementById('participantList'); // The UL itself
    const colorPicker = document.getElementById('toolColor');
    const lineWidthRange = document.getElementById('lineWidth');
    const lineWidthValueEl = document.getElementById('lineWidthValue');
    const toolButtons = document.querySelectorAll('.btn-tool'); // Your existing selector
    const leaveSessionBtn = document.getElementById('leaveSessionBtn');
    const clearBoardBtn = document.getElementById('clearBoardBtn');
    const saveSessionBtnOnSessionPage = document.getElementById('saveSessionBtn');
    const undoBtn = document.getElementById('tool-undo');
    const redoBtn = document.getElementById('tool-redo');
    // const sessionTimerDisplay = document.getElementById('sessionTimerDisplay'); // Your timer display
    const textToolInput = document.getElementById('textToolInput');
   
    const arModeBtn = document.getElementById('arModeBtn');
    const arVideoFeed = document.getElementById('arVideoFeed');
    const bodyElement = document.body;
    let arVideoStream = null; // To hold the camera stream
    let isArCanvasPlaced = false;

    let isDrawingLocal = false; // For local non-pencil drawing states (shapes, text)
    let currentLocalTool = 'tool-pencil'; // Your tool state (e.g. 'tool-pencil', 'tool-line')
    let currentLocalLineWidth = 5;
    let currentLocalColor = '#F57C00';
    let localStartX, localStartY, localSnapshot; // For local drawing of shapes that need snapshot
    let history = [], historyStep = -1; // Your undo/redo
    // let sessionStartTime, sessionTimerInterval; // Your timer variables

    // --- Variables for collaborative emitting (pencil) ---
    let isDrawingForEmit = false; // Separate flag for mouse down state for emitting
    let lastEmitX, lastEmitY;


  function toggleArMode() {
    if (!arModeBtn || !arVideoFeed) return;
    const placementPrompt = document.getElementById('ar-placement-prompt');

    if (bodyElement.classList.contains('ar-mode-active')) {
        // --- EXIT AR MODE ---
        console.log("Exiting AR Mode.");
        if (arVideoStream) {
            arVideoStream.getTracks().forEach(track => track.stop());
            arVideoStream = null;
        }
        arVideoFeed.style.display = 'none';
        bodyElement.classList.remove('ar-mode-active');
        arModeBtn.innerHTML = '<i class="bi bi-camera-video-fill me-1"></i> AR View';
        
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        isArCanvasPlaced = false; // Reset placement state
        if (placementPrompt) placementPrompt.style.display = 'none';

        const canvasWrapper = document.getElementById('canvas-ar-wrapper');
        if(canvasWrapper) canvasWrapper.style.transform = 'none';

    } else {
        // --- ENTER AR MODE ---
        console.log("Attempting to enter AR Mode.");
        const constraints = { video: { facingMode: 'environment' } };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                console.log("Camera access granted.");
                arVideoStream = stream;
                arVideoFeed.srcObject = stream;
                arVideoFeed.style.display = 'block';
                bodyElement.classList.add('ar-mode-active');
                arModeBtn.innerHTML = '<i class="bi bi-x-circle-fill me-1"></i> Exit AR';
                
                // Show the prompt
                if (placementPrompt) placementPrompt.style.display = 'block';
                isArCanvasPlaced = false; // Set initial state
            })
            .catch(err => {
                console.error("Error accessing camera for AR Mode:", err);
                alert("Could not access camera. Please ensure you've given permission.");
            });
    }
}
    function handleDeviceOrientation(event) {
    // ONLY run the motion effect IF the canvas has been "placed".
    if (!isArCanvasPlaced) return; 

    const canvasWrapper = document.getElementById('canvas-ar-wrapper');
    if (!canvasWrapper || !bodyElement.classList.contains('ar-mode-active')) {
        return;
    }

    const maxRotationY = 15;
    const maxRotationX = 15;
    let rotY = (event.gamma / 90) * maxRotationY;
    let rotX = ((event.beta - 90) / 90) * maxRotationX;
    rotY = Math.max(-maxRotationY, Math.min(maxRotationY, rotY));
    rotX = Math.max(-maxRotationX, Math.min(maxRotationX, rotX));
    canvasWrapper.style.transform = `rotateX(${-rotX}deg) rotateY(${rotY}deg) translateZ(-50px)`;
}

    
    function initializeSessionPage() {
        console.log("[SESSION PAGE] initializeSessionPage CALLED");
        const urlParams = new URLSearchParams(window.location.search);
        currentSessionIdFromURL = urlParams.get('sessionId');
        sessionNameFromURL = urlParams.get('sessionName') || sessionNameFromURL;
        hostNameFromURL = urlParams.get('hostName') || hostNameFromURL; // Expect 'hostName'
        joinerNameFromURL = urlParams.get('joinerName');

        if (!currentSessionIdFromURL) {
            alert("Error: Session ID is missing. Returning to homepage.");
            window.location.href = 'index.html';
            return;
        }

        if (activeSessionNameEl) activeSessionNameEl.textContent = sessionNameFromURL;
        if (activeHostNameEl) activeHostNameEl.textContent = hostNameFromURL;
        if (hostParticipantEl) hostParticipantEl.textContent = `Host: ${hostNameFromURL}`; // Initial host display

        resizeCanvas(); // Use your resizeCanvas
        window.addEventListener('resize', resizeCanvas);

        if (joinerNameFromURL && arModeBtn) {
        arModeBtn.style.display = 'block'; // Show the button
        arModeBtn.addEventListener('click', toggleArMode);
        }

        if (colorPicker) {
            currentLocalColor = colorPicker.value;
            colorPicker.addEventListener('input', (e) => { currentLocalColor = e.target.value; });
        }
        if (lineWidthRange && lineWidthValueEl) {
            currentLocalLineWidth = parseInt(lineWidthRange.value);
            lineWidthValueEl.textContent = currentLocalLineWidth;
            lineWidthRange.addEventListener('input', (e) => {
                currentLocalLineWidth = parseInt(e.target.value);
                lineWidthValueEl.textContent = currentLocalLineWidth;
            });
        }

        addCanvasEventListeners(); // Your event listeners
        addToolEventListeners();   // Your event listeners
        // startSessionTimer();    // Your timer

        // Socket.IO Connection
        socket = io('https://whiteboardtest3.onrender.com');
        socket.on('connect', () => {
            console.log('[SESSION PAGE] Connected to Socket.IO server with ID:', socket.id);
            localUserId = socket.id;
            const myNameForSession = joinerNameFromURL || hostNameFromURL;
            socket.emit('join_session', currentSessionIdFromURL, myNameForSession);
        });
        socket.on('connect_error', (error) => {
            console.error('[SESSION PAGE] Socket.IO connection error:', error);
            alert('Could not connect to the whiteboard server. Ensure server is running and HTTPS is trusted.');
        });
        socket.on('drawing_action_broadcast', handleDrawingActionBroadcast);
        socket.on('user_joined', handleUserJoined);
        socket.on('user_left', handleUserLeft);
        socket.on('current_participants', handleCurrentParticipants);
        socket.on('ar_pointer_broadcast', handleArPointerBroadcast);


        // Load from localStorage if not a joiner and sessionId exists
        if (currentSessionIdFromURL && !joinerNameFromURL) {
            loadSessionById(currentSessionIdFromURL); // Your existing function
        } else { // New session or joiner
            history = []; historyStep = -1; // Reset local history
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            saveHistory(); // Save initial blank state
        }
        updateUndoRedoButtons(); // Your existing function
        canvasElement.style.cursor = 'crosshair';
        setActiveToolById(currentLocalTool); // Set initial tool active state
        console.log("[SESSION PAGE] initializeSessionPage COMPLETED. Session ID:", currentSessionIdFromURL);
    }
    

    function resizeCanvas() {
        const container = canvasElement.parentElement;
        if (!container) return;
        const style = getComputedStyle(container);
        const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        canvasElement.width = container.clientWidth - paddingX;
        canvasElement.height = container.clientHeight - paddingY;
        redrawHistoryState(); // This will redraw the current history step
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; // Re-apply these
    }
    function redrawHistoryState() {
        if (history.length > 0 && historyStep >= 0 && history[historyStep]) {
            const img = new Image();
            img.onload = () => { ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height); };
            img.onerror = () => { console.error("Error loading history image."); ctx.clearRect(0,0,canvasElement.width,canvasElement.height);};
            img.src = history[historyStep];
        } else {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
    }
    function saveHistory() {
        if (historyStep < history.length - 1) history = history.slice(0, historyStep + 1);
        if (history.length >= 20) { history.shift(); historyStep--; } // Limit history size
        try { history.push(canvasElement.toDataURL()); historyStep++; }
        catch (e) { console.error("Error saving history:", e); }
        updateUndoRedoButtons();
    }
    function undo() { if (historyStep > 0) { historyStep--; redrawHistoryState(); updateUndoRedoButtons(); } }
    function redo() { if (historyStep < history.length - 1) { historyStep++; redrawHistoryState(); updateUndoRedoButtons(); } }
    function updateUndoRedoButtons() {
        if(undoBtn) undoBtn.disabled = historyStep <= 0;
        if(redoBtn) redoBtn.disabled = historyStep >= history.length - 1;
    }
    // function startSessionTimer() { /* ... (Your Timer logic) ... */ }
    // function updateTimerDisplay() { /* ... (Your Timer logic) ... */ }
    function getCanvasCoordinates(event) { // Your existing excellent coordinate function
        const rect = canvasElement.getBoundingClientRect();
        const clientX = event.clientX ?? event.touches?.[0]?.clientX;
        const clientY = event.clientY ?? event.touches?.[0]?.clientY;
        if (clientX === undefined || clientY === undefined) return null;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }
    function activateTextTool(x, y) { /* ... Your existing text tool activation ... */ 
        if (!textToolInput) { console.error("textToolInput not found in activateTextTool"); return; }
        const fontSize = Math.max(12, currentLocalLineWidth * 2 + 8); // Use currentLocalLineWidth
        const lineHeight = fontSize * 1.2;
        textToolInput.style.display = 'block';
        textToolInput.style.left = `${x}px`; textToolInput.style.top = `${y}px`;
        textToolInput.style.font = `${fontSize}px Poppins`;
        textToolInput.style.color = currentLocalColor; // Use currentLocalColor
        textToolInput.style.lineHeight = `${lineHeight}px`;
        textToolInput.style.width = 'auto'; textToolInput.style.minWidth = '100px';
        textToolInput.style.height = `${lineHeight + 4}px`;
        textToolInput.value = '';
        textToolInput.focus();
        textToolInput.oninput = function() { this.style.height = 'auto'; this.style.height = `${this.scrollHeight}px`; };
    }
    function finalizeText() { /* ... Your existing text finalization ... */ 
        if (!textToolInput || textToolInput.style.display === 'none') return;
        const text = textToolInput.value;
        if (text.trim() === "") { textToolInput.style.display = 'none'; textToolInput.value = ''; return; }
        const x = parseFloat(textToolInput.style.left) + 2; const y = parseFloat(textToolInput.style.top) + 2;
        const fontStyle = textToolInput.style.font; const color = textToolInput.style.color;
        const lines = text.split('\n'); const lineHeight = parseFloat(textToolInput.style.lineHeight);
        ctx.fillStyle = color; ctx.font = fontStyle;
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        lines.forEach((line, index) => ctx.fillText(line, x, y + (index * lineHeight)));
        textToolInput.style.display = 'none'; textToolInput.value = '';
        saveHistory();
    }
    function loadSessionById(idToLoad) { /* ... Your existing session load logic ... */ 
        console.log(`[SESSION PAGE] loadSessionById: Attempting to load ${idToLoad}`);
        const sessions = getSavedSessions();
        const sessionToLoad = sessions.find(s => s.id === idToLoad);
        if (sessionToLoad && sessionToLoad.imageDataUrl) {
            if(activeSessionNameEl) activeSessionNameEl.textContent = sessionToLoad.sessionName;
            if(activeHostNameEl) activeHostNameEl.textContent = sessionToLoad.hostName;
            // currentSessionIdFromURL should already be this id if called correctly
            sessionNameFromURL = sessionToLoad.sessionName; // Update global session name
            hostNameFromURL = sessionToLoad.hostName; // Update global host name


            const img = new Image();
            img.onload = () => {
                console.log(`[SESSION PAGE] Image for session ${idToLoad} LOADED by loadSessionById.`);
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
                history = []; historyStep = -1;
                saveHistory(); 
                updateUndoRedoButtons();
                console.log(`[SESSION PAGE] Session ${idToLoad} drawn.`);
            };
            img.onerror = () => { console.error(`Error loading image for ${idToLoad}.`); history=[];historyStep=-1;saveHistory();updateUndoRedoButtons();};
            img.src = sessionToLoad.imageDataUrl;
        } else {
            console.warn(`Session ${idToLoad} not found or no image data. Starting fresh for this ID.`);
            history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons();
        }  
    }
    function setActiveToolById(toolId) { // Helper to manage active class on tool buttons
        currentLocalTool = toolId; // Update the local tool state
        toolButtons.forEach(btn => {
            if (btn.id === toolId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        canvasElement.style.cursor = (currentLocalTool === 'tool-text') ? 'text' : 'crosshair';
         if (currentLocalTool === 'tool-text' && textToolInput && textToolInput.style.display === 'block') {
            finalizeText(); // Finalize any pending text if switching away
        }
    }

    function addToolEventListeners() { // Modified to use setActiveToolById
         toolButtons.forEach(button => {
            button.addEventListener('click', function() {
                setActiveToolById(this.id);
            });
        });
        if (undoBtn) undoBtn.addEventListener('click', undo);
        if (redoBtn) redoBtn.addEventListener('click', redo);
        if (clearBoardBtn) clearBoardBtn.addEventListener('click', handleClearBoardAndEmit); // MODIFIED
        if (saveSessionBtnOnSessionPage) { /* ... Your existing save button logic, ensure it uses currentSessionIdFromURL ... */ 
            saveSessionBtnOnSessionPage.addEventListener('click', () => {
                const imageDataUrl = canvasElement.toDataURL('image/png');
                // Use the sessionName and hostName currently displayed or derived from URL params
                const sName = activeSessionNameEl?.textContent || sessionNameFromURL || 'Untitled Session';
                const hName = activeHostNameEl?.textContent || hostNameFromURL || 'Host';
                const sessionToSave = {
                    id: currentSessionIdFromURL, // Crucial: use the active session ID
                    sessionName: sName, hostName: hName,
                    createdAt: new Date().toISOString(), imageDataUrl: imageDataUrl
                };
                let sessions = getSavedSessions();
                const existingIndex = sessions.findIndex(s => s.id === currentSessionIdFromURL);
                if (existingIndex > -1) sessions[existingIndex] = sessionToSave;
                else sessions.push(sessionToSave);
                saveSessionsToStorage(sessions);
                alert(`Session "${sName}" saved! Redirecting to dashboard.`);
                window.location.href = 'dashboard.html';
            });
        }
        if (leaveSessionBtn) leaveSessionBtn.addEventListener('click', () => { 
            if (confirm("Leave session?")) {
                if(socket) socket.disconnect(); // Disconnect socket before leaving
                window.location.href = 'index.html'; 
            }
        });
    }

    // --- EVENT HANDLERS FOR DRAWING (local rendering + emitting collaborative actions) ---
   function addCanvasEventListeners() {
    console.log("[SESSION PAGE] Attaching canvas drawing event listeners.");
    canvasElement.addEventListener('mousedown', handlePointerDown);
    canvasElement.addEventListener('mousemove', handlePointerMove);
    canvasElement.addEventListener('mouseup', handlePointerUp);
    canvasElement.addEventListener('mouseout', handlePointerUp);
    canvasElement.addEventListener('touchstart', (e) => { e.preventDefault(); handlePointerDown(e.touches[0]); }, { passive: false });
    canvasElement.addEventListener('touchmove', (e) => { e.preventDefault(); handlePointerMove(e.touches[0]); }, { passive: false });
    canvasElement.addEventListener('touchend', (e) => { e.preventDefault(); handlePointerUp(e.changedTouches[0]); }, { passive: false });
    canvasElement.addEventListener('touchcancel', (e) => { e.preventDefault(); handlePointerUp(e.changedTouches[0]); }, { passive: false });

    // This handles the new "Tap to Place" logic.
    canvasElement.addEventListener('click', function(event) {
        if (bodyElement.classList.contains('ar-mode-active') && !isArCanvasPlaced) {
            event.preventDefault();
            event.stopPropagation();
            
            console.log("AR Canvas has been placed.");
            isArCanvasPlaced = true;
            document.getElementById('ar-placement-prompt').style.display = 'none';
            
            // Start listening for motion events ONLY after placement.
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleDeviceOrientation, true);
            } else {
                console.warn("DeviceOrientationEvent not supported on this device.");
            }
        }
    }, true); // Use capture phase to handle this click before anything else.
}


    
function handleArPointerClick(event) {
    // Only run this logic if we are in AR mode
    if (!bodyElement.classList.contains('ar-mode-active')) {
        return;
    }

    // Prevent it from trying to draw
    event.preventDefault();
    event.stopPropagation();

    const coords = getCanvasCoordinates(event);
    if (!coords || !socket || !socket.connected) return;

    // Send relative coordinates (0 to 1) for cross-device compatibility
    const relativeX = coords.x / canvasElement.width;
    const relativeY = coords.y / canvasElement.height;

    const pointerData = {
        x: relativeX,
        y: relativeY,
        sessionId: currentSessionIdFromURL,
        userId: localUserId
    };

    socket.emit('ar_pointer_action', pointerData);
    
    // Show local visual feedback immediately for the AR user
    handleArPointerBroadcast({ x: relativeX, y: relativeY, userId: 'local' });
}

    function handleArPointerBroadcast(data) {
        const pointerEffect = document.createElement('div');
        pointerEffect.className = 'ar-pointer-effect';

        const x = data.x * canvasElement.width;
        const y = data.y * canvasElement.height;

        pointerEffect.style.left = `${canvasElement.offsetLeft + x}px`;
        pointerEffect.style.top = `${canvasElement.offsetTop + y}px`;

    // Give a unique color to each user's pointer
        if (data.userId !== 'local') {
            let hash = 0;
            for (let i = 0; i < data.userId.length; i++) {
                hash = data.userId.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            pointerEffect.style.borderColor = "#" + "00000".substring(0, 6 - c.length) + c;
        }

        document.body.appendChild(pointerEffect);

        setTimeout(() => {
            pointerEffect.remove();
        }, 600); // Animation duration
    }
    
    function handlePointerDown(event) {
    
        const coords = getCanvasCoordinates(event);
        if (!coords || (event.buttons && event.buttons !== 1 && event.type.startsWith('mouse'))) return; // Only left mouse button

        isDrawingForEmit = true; // Start emitting sequence
        lastEmitX = coords.x;
        lastEmitY = coords.y;

        // Your local drawing logic:
        isDrawingLocal = true; // For your shape previews etc.
        localStartX = coords.x;
        localStartY = coords.y;

        if (currentLocalTool === 'tool-text') {
            if (textToolInput && textToolInput.style.display === 'block') finalizeText();
            activateTextTool(localStartX, localStartY);
            isDrawingForEmit = false; isDrawingLocal = false; // Text tool doesn't "draw" in the same way
            return;
        }
        
        ctx.beginPath();
        ctx.moveTo(localStartX, localStartY);
        ctx.lineWidth = currentLocalLineWidth;
        ctx.strokeStyle = currentLocalColor;
        ctx.fillStyle = currentLocalColor; // For dot
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentLocalTool === 'tool-pencil') {
            // Draw local dot
            ctx.beginPath(); // Ensure a new path for the dot
            ctx.arc(lastEmitX, lastEmitY, currentLocalLineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
            // Emit dot
            const dotData = {
                type: 'draw_dot', tool: 'pencil_dot',
                x: lastEmitX, y: lastEmitY,
                color: currentLocalColor, lineWidth: currentLocalLineWidth,
                sessionId: currentSessionIdFromURL, userId: localUserId
            };
            if (socket && socket.connected) socket.emit('drawing_action', dotData);
        } else if (['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool)) {
            try { localSnapshot = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height); }
            catch (e) { console.error("Snapshot failed:", e); localSnapshot = null; }
        }
    }

    function handlePointerMove(event) {
        if (!isDrawingForEmit && currentLocalTool !== 'tool-eraser') return; // If not drawing for emit (pencil) and not eraser
        
        const coords = getCanvasCoordinates(event);
        if (!coords) return;

        // Handle local shape preview (your existing logic)
        if (localSnapshot && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool) && isDrawingLocal) {
             ctx.putImageData(localSnapshot, 0, 0);
        }
        
        ctx.lineWidth = currentLocalLineWidth;
        ctx.strokeStyle = currentLocalColor;
        ctx.fillStyle = currentLocalColor;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        if (currentLocalTool === 'tool-pencil' && isDrawingForEmit) {
            // Local drawing of segment
            ctx.beginPath(); // Start new path for the segment
            ctx.moveTo(lastEmitX, lastEmitY);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            // Emit segment
            const segmentData = {
                type: 'draw_segment', tool: 'pencil',
                startX: lastEmitX, startY: lastEmitY,
                endX: coords.x, endY: coords.y,
                color: currentLocalColor, lineWidth: currentLocalLineWidth,
                sessionId: currentSessionIdFromURL, userId: localUserId
            };
            if (socket && socket.connected) socket.emit('drawing_action', segmentData);
            lastEmitX = coords.x; lastEmitY = coords.y;
        } else if (currentLocalTool === 'tool-eraser' && (isDrawingForEmit || (event.buttons && event.buttons === 1))) {
            // Your local eraser logic - COLLABORATIVE ERASER NOT IMPLEMENTED YET
            if (!isDrawingLocal) { // Start drawing for eraser if not already
                isDrawingLocal = true; 
                ctx.beginPath(); ctx.moveTo(coords.x, coords.y);
            }
            const bg = getComputedStyle(canvasElement).backgroundColor;
            ctx.strokeStyle = (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : '#FFFFFF'; // Eraser color
            ctx.lineTo(coords.x, coords.y); ctx.stroke();
        } else if (isDrawingLocal && currentLocalTool === 'tool-line') {
            ctx.beginPath(); ctx.moveTo(localStartX, localStartY); ctx.lineTo(coords.x, coords.y); ctx.stroke();
        } else if (isDrawingLocal && currentLocalTool === 'tool-rectangle') {
            ctx.beginPath(); ctx.strokeRect(localStartX, localStartY, coords.x - localStartX, coords.y - localStartY);
        } else if (isDrawingLocal && currentLocalTool === 'tool-circle') {
            ctx.beginPath(); let r = Math.sqrt(Math.pow(coords.x - localStartX, 2) + Math.pow(coords.y - localStartY, 2));
            ctx.arc(localStartX, localStartY, r, 0, 2 * Math.PI); ctx.stroke();
        }
    }

    function handlePointerUp(event) {
        if (!isDrawingForEmit && !isDrawingLocal && currentLocalTool !== 'tool-text') return;

        const coords = getCanvasCoordinates(event) || { x: lastEmitX, y: lastEmitY }; // Use last known if event has no coords (e.g. mouseout)

        if (isDrawingLocal && ['tool-line', 'tool-rectangle', 'tool-circle', 'tool-eraser'].includes(currentLocalTool)) {
             // Emit final shape/eraser path if it's one of these tools
            let actionData = {
                tool: currentLocalTool.replace('tool-', ''),
                startX: localStartX, startY: localStartY,
                endX: coords.x, endY: coords.y, // Final coords
                color: currentLocalColor, // Eraser will use background color effectively
                lineWidth: currentLocalLineWidth,
                sessionId: currentSessionIdFromURL, userId: localUserId
            };

            if (currentLocalTool === 'tool-line') actionData.type = 'draw_shape_line';
            else if (currentLocalTool === 'tool-rectangle') actionData.type = 'draw_shape_rect';
            else if (currentLocalTool === 'tool-circle') {
                actionData.type = 'draw_shape_circle';
                actionData.radius = Math.sqrt(Math.pow(coords.x - localStartX, 2) + Math.pow(coords.y - localStartY, 2));
            } else if (currentLocalTool === 'tool-eraser') {
                // For eraser, we might need to send a series of points if it's freehand
                // This simple model sends start/end, which isn't great for freehand eraser.
                // COLLABORATIVE ERASER NEEDS MORE WORK. For now, local only.
                // To make it somewhat work, we could send it like a thick line:
                // actionData.type = 'erase_segment_collab'; // A new type
                // if (socket && socket.connected) socket.emit('drawing_action', actionData);
            }
            
            if (socket && socket.connected && currentLocalTool !== 'tool-eraser') { // Don't emit eraser yet
                 socket.emit('drawing_action', actionData);
            }
        }
        
        isDrawingForEmit = false;
        isDrawingLocal = false;
        localSnapshot = null;

        if (currentLocalTool === 'tool-text') {
            // Finalize text if mouseup outside text input
            if (textToolInput && textToolInput.style.display === 'block' && document.activeElement !== textToolInput) {
                 // finalizeText(); // This is called on blur, might be enough
            }
        } else {
             saveHistory(); // Save state after any local drawing operation is complete
        }
    }

    // --- SOCKET.IO EVENT HANDLERS (Receiving and Rendering Collaborative Actions) ---
    function handleDrawingActionBroadcast(data) {
        if (!ctx || data.userId === localUserId) return; // Don't redraw own actions if server echoes (it shouldn't with socket.to())
        // console.log('[SESSION PAGE] Received broadcast:', data);

        const oStroke = ctx.strokeStyle, oWidth = ctx.lineWidth, oFill = ctx.fillStyle, oCap = ctx.lineCap, oJoin = ctx.lineJoin;
        ctx.strokeStyle = data.color; ctx.lineWidth = data.lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        switch (data.type) {
            case 'draw_segment':
                if (data.tool === 'pencil') { ctx.beginPath(); ctx.moveTo(data.startX, data.startY); ctx.lineTo(data.endX, data.endY); ctx.stroke(); }
                break;
            case 'draw_dot':
                if (data.tool === 'pencil_dot') { ctx.fillStyle = data.color; ctx.beginPath(); ctx.arc(data.x, data.y, data.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); }
                break;
            case 'draw_shape_line':
                ctx.beginPath(); ctx.moveTo(data.startX, data.startY); ctx.lineTo(data.endX, data.endY); ctx.stroke();
                break;
            case 'draw_shape_rect':
                ctx.beginPath(); ctx.strokeRect(data.startX, data.startY, data.endX - data.startX, data.endY - data.startY);
                break;
            case 'draw_shape_circle':
                ctx.beginPath(); ctx.arc(data.startX, data.startY, data.radius, 0, 2 * Math.PI); ctx.stroke();
                break;
            case 'clear_board':
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons(); // Reset local history too
                console.log("[SESSION PAGE] Board cleared by remote user:", data.userId);
                break;
        }
        ctx.strokeStyle=oStroke; ctx.lineWidth=oWidth; ctx.fillStyle=oFill; ctx.lineCap=oCap; ctx.lineJoin=oJoin;
        // Do NOT call saveHistory() here for every remote stroke, or undo becomes unmanageable quickly.
        // The canvas is updated visually. If a full "sync state" save is needed, it's a different mechanism.
    }

    function updateParticipantListUI() {
        if (!participantListUl) return;
        participantListUl.innerHTML = '';

        const hostLi = document.createElement('li');
        hostLi.className = 'list-group-item bg-transparent px-1 py-1 fw-bold';
        let actualHostName = hostNameFromURL; // Default to URL param

        // Try to find if any current participant IS the host (e.g. if host refreshed)
        // This is a heuristic. Server should ideally confirm host.
        if (localUserId && participantsList[localUserId] === hostNameFromURL) {
            actualHostName = participantsList[localUserId]; // It's me, the host
            hostLi.textContent = `Host: ${actualHostName} (You)`;
        } else {
             // Check if another participant in the list is the host
            const hostInList = Object.entries(participantsList).find(([id, name]) => name === hostNameFromURL);
            if (hostInList) actualHostName = hostInList[1];
            hostLi.textContent = `Host: ${actualHostName}`;
        }
        participantListUl.appendChild(hostLi);

        for (const userId in participantsList) {
            if (participantsList[userId] === actualHostName && (userId === localUserId || Object.keys(participantsList).find(id => participantsList[id] === actualHostName) === userId) ) {
                // Avoid listing host twice if they are 'You' or already identified.
                if(userId === localUserId && participantsList[userId] === actualHostName) continue; // Already handled by (You) on hostLi
                if(participantsList[userId] === actualHostName && hostLi.textContent.includes(actualHostName) && !hostLi.textContent.includes('(You)')) continue; // Already listed as host

            }
            const li = document.createElement('li');
            li.className = 'list-group-item bg-transparent px-1 py-1';
            li.textContent = `${participantsList[userId]}${userId === localUserId ? ' (You)' : ''}`;
            participantListUl.appendChild(li);
        }
    }
    function handleUserJoined(data) {
        console.log('[SESSION PAGE] User joined event:', data.userName, data.userId);
        participantsList[data.userId] = data.userName;
        updateParticipantListUI();
    }
    function handleUserLeft(data) {
        console.log('[SESSION PAGE] User left event:', data.userName, data.userId);
        delete participantsList[data.userId];
        updateParticipantListUI();
    }
    function handleCurrentParticipants(currentUsersList) {
        console.log('[SESSION PAGE] Received current participants:', currentUsersList);
        // participantsList = {}; // Don't reset if we want to merge, but server sends full list
        currentUsersList.forEach(user => { participantsList[user.userId] = user.userName; });
        updateParticipantListUI();
    }
    function handleClearBoardAndEmit() { // New function to call from clear button
        if (!ctx) return;
        if (confirm("Are you sure you want to clear the entire board for everyone? This cannot be undone.")) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons(); // Reset local history
            const clearData = { type: 'clear_board', sessionId: currentSessionIdFromURL, userId: localUserId };
            if (socket && socket.connected) socket.emit('drawing_action', clearData);
            console.log("[SESSION PAGE] Board cleared locally and clear action emitted.");
        }
    }

    initializeSessionPage(); // Initialize session page logic
}

console.log("AR WhiteBoard Scripts Fully Initialized! (End of DOMContentLoaded)");


});
