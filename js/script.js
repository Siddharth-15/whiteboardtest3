
// js/script.js - FULLY RE-INTEGRATED AND CONSOLIDATED
document.addEventListener('DOMContentLoaded', function() {
    console.log("Main DOMContentLoaded Fired - AR WhiteBoard Scripts Initializing...");
    const htmlElement = document.documentElement;
    // --- localStorage Helper Functions (defined once at a higher scope within DOMContentLoaded) ---
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
        return {
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
        setupTsParticles();
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
            const hostName = document.getElementById('hostName')?.value.trim();
            const sessionName = document.getElementById('sessionName')?.value.trim();
            const sessionPassword = document.getElementById('sessionPassword')?.value;
            if (!hostName || !sessionName) {
                alert("Please fill in Your Name and Session Name."); return;
            }
            const newSessionId = `ARW-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
            const sessionURL = `session.html?
            sessionId=${encodeURIComponent(newSessionId)}&sessionName=${encodeURIComponent(sessionName)}&hostName=${encodeURIComponent(hostName)}`;
            console.log(`New session created: ID=${newSessionId}, Name=${sessionName}, Host=${hostName}`);
             window.location.href = sessionURL;
        });
    }
    const togglePasswordVisibilityButton = document.getElementById('togglePasswordVisibility');
    const passwordInput = document.getElementById('sessionPassword');
    if (togglePasswordVisibilityButton && passwordInput) {
        togglePasswordVisibilityButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i')?.classList.toggle('bi-eye-fill');
            this.querySelector('i')?.classList.toggle('bi-eye-slash-fill');
        });
    }
    const contactPageForm = document.getElementById('contactPageForm');
    if (contactPageForm) {
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
    if (sessionsContainer && noSessionsMessage) {
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
                            <a href="session.html?sessionId=${session.id}" class="btn btn-sm btn-primary btn-gradient view-session-btn"><i class="bi bi-eye-fill me-1"></i> View</a>
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
        displaySavedSessions();
    }
    // === Session Page Specific JavaScript (on session.html) ===
    const canvas = document.getElementById('whiteboardCanvas');
    if (canvas) {
        console.log("[SESSION PAGE] Canvas element FOUND. Initializing logic...");
        let socket; // Socket.IO instance
        let localUserId = null; // This client's socket ID
        // currentSessionId is already declared later by you, we will use that
        let hostNameFromURLParam = 'Host'; // To store hostName from URL
        let sessionNameFromURLParam = 'Session'; // To store sessionName from URL
        let joinerNameFromURLParam = null; // To store joinerName from URL
    
        let isDrawingCollaborative = false; // Use this instead of your 'isDrawing' for collaborative actions
        let lastXCollaborative, lastYCollaborative; // For collaborative drawing points
        const participantsList = {};
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const activeSessionNameEl = document.getElementById('activeSessionName');
        const activeHostNameEl = document.getElementById('activeHostName');
        const hostParticipantEl = document.getElementById('hostParticipant');
        const colorPicker = document.getElementById('toolColor');
        const lineWidthRange = document.getElementById('lineWidth');
        const lineWidthValueEl = document.getElementById('lineWidthValue');
        const toolButtons = document.querySelectorAll('.btn-tool');
        const leaveSessionBtn = document.getElementById('leaveSessionBtn');
        const clearBoardBtn = document.getElementById('clearBoardBtn');
        const saveSessionBtnOnSessionPage = document.getElementById('saveSessionBtn');
        const undoBtn = document.getElementById('tool-undo');
        const redoBtn = document.getElementById('tool-redo');
        const sessionTimerDisplay = document.getElementById('sessionTimerDisplay');
        const textToolInput = document.getElementById('textToolInput');
        let isDrawing = false, currentTool = 'tool-pencil', currentLineWidth = 5, currentColor = '#F57C00';
        let startX, startY, snapshot;
        let history = [], historyStep = -1;
        let sessionStartTime, sessionTimerInterval;
        let currentSessionId = null; // To store the ID for the current session instance
        // let socket = null; // For future Socket.IO integration
        function initializeSessionPage() {
            console.log("[SESSION PAGE] initializeSessionPage CALLED");
            const urlParams = new URLSearchParams(window.location.search);
            const sessionIdFromUrl = urlParams.get('sessionId');
            sessionNameFromURLParam = urlParams.get('sessionName') || 'New Session';
            hostNameFromURLParam = urlParams.get('hostName') || 'Host'; // Expecting 'hostName'
            joinerNameFromURLParam = urlParams.get('joinerName'); // New: get joiner's name
    
            currentSessionId = sessionIdFromUrl; // You correctly assign this
            
            if (!currentSessionId) { // Your existing check, good
            alert("Error: Session ID is missing. Returning to homepage.");
            window.location.href = 'index.html';
            return;
            }
            // Set initial names, may be overridden by loadSessionById
            if (activeSessionNameEl) activeSessionNameEl.textContent = sessionNameFromURLParam;
            if (activeHostNameEl) activeHostNameEl.textContent = hostNameFromURLParam;
            if (hostParticipantEl) hostParticipantEl.textContent = `Host: ${hostNameFromURLParam}`;
    
             
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            if (colorPicker) {
                currentColor = colorPicker.value;
                colorPicker.addEventListener('input', (e) => { currentColor = e.target.value; });
            }
            if (lineWidthRange && lineWidthValueEl) {
                currentLineWidth = parseInt(lineWidthRange.value);
                lineWidthValueEl.textContent = currentLineWidth;
                lineWidthRange.addEventListener('input', (e) => {
                    currentLineWidth = parseInt(e.target.value);
                    lineWidthValueEl.textContent = currentLineWidth;
                });
            }
            
          socket = io('https://localhost:3001', { /* transports: ['websocket'] */ });
          socket.on('connect', () => {
          console.log('[SESSION PAGE] Connected to Socket.IO server with ID:', socket.id);
          localUserId = socket.id;
          const myNameForSession = joinerNameFromURLParam || hostNameFromURLParam; // If I'm host, use hostName, else joinerName
          socket.emit('join_session', currentSessionId, myNameForSession);
          });
          socket.on('connect_error', (error) => {
          console.error('[SESSION PAGE] Socket.IO connection error:', error);
          alert('Could not connect to the whiteboard server. Ensure server is running and HTTPS is trusted.');
        });
          // Register event handlers for Socket.IO messages (defined as separate functions later)
          socket.on('drawing_action_broadcast', handleDrawingActionBroadcast);
          socket.on('user_joined', handleUserJoined);
          socket.on('user_left', handleUserLeft);
          socket.on('current_participants', handleCurrentParticipants);
            addCanvasEventListeners();
            addToolEventListeners();
            startSessionTimer();
            if (sessionIdFromUrl) {
                loadSessionById(sessionIdFromUrl);
            } else {
                saveHistory(); // Save initial blank state for a brand new session
            }
            updateUndoRedoButtons();
            canvas.style.cursor = 'crosshair';
            console.log("[SESSION PAGE] initializeSessionPage COMPLETED");
        }
        function resizeCanvas() {
            const container = canvas.parentElement;
            if (!container) return;
            const style = getComputedStyle(container);
            const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            canvas.width = container.clientWidth - paddingX;
            canvas.height = container.clientHeight - paddingY;
            redrawHistoryState();
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        }
        function redrawHistoryState() {
            if (history.length > 0 && historyStep >= 0 && history[historyStep]) {
                const img = new Image();
                img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
                img.onerror = () => { console.error("Error loading history image."); ctx.clearRect(0,0,canvas.width,canvas.height);};
                img.src = history[historyStep];
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        function saveHistory() {
            if (historyStep < history.length - 1) history = history.slice(0, historyStep + 1);
            if (history.length >= 20) { history.shift(); historyStep--; }
            try { history.push(canvas.toDataURL()); historyStep++; }
            catch (e) { console.error("Error saving history:", e); }
            updateUndoRedoButtons();
        }
        function undo() { if (historyStep > 0) { historyStep--; redrawHistoryState(); updateUndoRedoButtons(); } }
        function redo() { if (historyStep < history.length - 1) { historyStep++; redrawHistoryState(); updateUndoRedoButtons(); } }
        function updateUndoRedoButtons() {
            if(undoBtn) undoBtn.disabled = historyStep <= 0;
            if(redoBtn) redoBtn.disabled = historyStep >= history.length - 1;
        }
        function startSessionTimer() { /* ... (Timer logic) ... */ }
        function updateTimerDisplay() { /* ... (Timer logic) ... */ }
        function addCanvasEventListeners() {
            console.log("[SESSION PAGE] Attaching canvas drawing event listeners.");
            canvas.addEventListener('mousedown', handlePointerDown);
            canvas.addEventListener('mousemove', handlePointerMove);
            canvas.addEventListener('mouseup', handlePointerUp);
            canvas.addEventListener('mouseout', handlePointerUp);
            canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handlePointerDown(e.touches[0]); }, { passive: false });
            canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handlePointerMove(e.touches[0]); }, { passive: false });
            canvas.addEventListener('touchend', (e) => { e.preventDefault(); handlePointerUp(e.changedTouches[0]); }, { passive: false });
            canvas.addEventListener('touchcancel', (e) => { e.preventDefault(); handlePointerUp(e.changedTouches[0]); }, { passive: false });
        }
        function addToolEventListeners() {
             toolButtons.forEach(button => {
                button.addEventListener('click', function() {
                    if (currentTool === 'tool-text' && textToolInput && textToolInput.style.display === 'block') finalizeText();
                    toolButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    currentTool = this.id;
                    canvas.style.cursor = (currentTool === 'tool-text') ? 'text' : 'crosshair';
                });
            });
            if (undoBtn) undoBtn.addEventListener('click', undo);
            if (redoBtn) redoBtn.addEventListener('click', redo);
            if (clearBoardBtn) clearBoardBtn.addEventListener('click', () => {
                if (confirm("Clear board?")) { ctx.clearRect(0, 0, canvas.width, canvas.height); saveHistory(); }
            });
            if (saveSessionBtnOnSessionPage) {
                saveSessionBtnOnSessionPage.addEventListener('click', () => {
                    const imageDataUrl = canvas.toDataURL('image/png');
                    const sessionName = activeSessionNameEl?.textContent || 'Untitled Session'; // Use current displayed name
                    const hostName = activeHostNameEl?.textContent || 'Host';         // Use current displayed host
                    const sessionToSave = {
                        id: currentSessionId, // Use the active session ID for this page instance
                        sessionName: sessionName, hostName: hostName,
                        createdAt: new Date().toISOString(), imageDataUrl: imageDataUrl
                    };
                    let sessions = getSavedSessions();
                    const existingIndex = sessions.findIndex(s => s.id === currentSessionId);
                    if (existingIndex > -1) sessions[existingIndex] = sessionToSave;
                    else sessions.push(sessionToSave);
                    saveSessionsToStorage(sessions);
                    alert(`Session "${sessionName}" saved! Redirecting to dashboard.`);
                    window.location.href = 'dashboard.html';
                });
            }
            if (leaveSessionBtn) leaveSessionBtn.addEventListener('click', () => { if (confirm("Leave session?")) window.location.href = 'index.html'; });
        }
        
        function getCanvasCoordinates(event) {
            const rect = canvas.getBoundingClientRect();
            const clientX = event.clientX ?? event.touches?.[0]?.clientX;
            const clientY = event.clientY ?? event.touches?.[0]?.clientY;
            if (clientX === undefined || clientY === undefined) return null;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }
        function handlePointerDown(event) {
            // console.log(`[SESSION PAGE] PointerDown - Tool: ${currentTool}`);
            const coords = getCanvasCoordinates(event);
            if (!coords) return;
            startX = coords.x; startY = coords.y;
            if (currentTool === 'tool-text') {
                if (textToolInput && textToolInput.style.display === 'block') finalizeText();
                activateTextTool(startX, startY);
                isDrawing = false; return;
            }
            isDrawing = true;
            ctx.beginPath(); ctx.moveTo(startX, startY);
            ctx.lineWidth = currentLineWidth; ctx.strokeStyle = currentColor; ctx.fillStyle = currentColor;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentTool)) {
                try { snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); }
                catch (e) { console.error("Snapshot failed:", e); snapshot = null; }
            }
        }
        function handlePointerMove(event) {
            if (!isDrawing && !(snapshot && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentTool))) {
                if (currentTool === 'tool-eraser' && event.buttons) {} else return;
            }
            if (currentTool === 'tool-eraser' && event.buttons && !isDrawing) { isDrawing = true; const ec=getCanvasCoordinates(event); if(ec){ctx.beginPath();ctx.moveTo(ec.x,ec.y);} }
            if (!isDrawing && currentTool === 'tool-eraser' && !event.buttons) return;
            const coords = getCanvasCoordinates(event);
            if (!coords) return;
            if (snapshot && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentTool)) ctx.putImageData(snapshot, 0, 0);
            
            ctx.lineWidth = currentLineWidth; ctx.strokeStyle = currentColor; ctx.fillStyle = currentColor;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (currentTool === 'tool-pencil') { ctx.lineTo(coords.x, coords.y); ctx.stroke(); }
            else if (currentTool === 'tool-eraser') {
                if (!isDrawing) return;
                const bg = getComputedStyle(canvas).backgroundColor;
                ctx.strokeStyle = (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : '#FFFFFF';
                ctx.lineTo(coords.x, coords.y); ctx.stroke();
            }
            else if (isDrawing && currentTool === 'tool-line') { ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(coords.x, coords.y); ctx.stroke(); }
            else if (isDrawing && currentTool === 'tool-rectangle') { ctx.beginPath(); ctx.strokeRect(startX, startY, coords.x - startX, coords.y - startY); }
            else if (isDrawing && currentTool === 'tool-circle') {
                ctx.beginPath(); let r=Math.sqrt(Math.pow(coords.x-startX,2)+Math.pow(coords.y-startY,2));
                ctx.arc(startX, startY, r, 0, 2 * Math.PI); ctx.stroke();
            }
        }
        function handlePointerUp() {
            if (!isDrawing) {
                if (currentTool === 'tool-text' && textToolInput && textToolInput.style.display==='block' && textToolInput.value.trim()==='') textToolInput.style.display = 'none';
                return;
            }
            isDrawing = false; snapshot = null;
            saveHistory();
        }
        
        function activateTextTool(x, y) {
            if (!textToolInput) { console.error("textToolInput not found in activateTextTool"); return; }
            const fontSize = Math.max(12, currentLineWidth * 2 + 8);
            const lineHeight = fontSize * 1.2;
            textToolInput.style.display = 'block';
            textToolInput.style.left = `${x}px`; textToolInput.style.top = `${y}px`;
            textToolInput.style.font = `${fontSize}px Poppins`;
            textToolInput.style.color = currentColor;
            textToolInput.style.lineHeight = `${lineHeight}px`;
            textToolInput.style.width = 'auto'; textToolInput.style.minWidth = '100px';
            textToolInput.style.height = `${lineHeight + 4}px`;
            textToolInput.value = '';
            textToolInput.focus();
            textToolInput.oninput = function() { this.style.height = 'auto'; this.style.height = `${this.scrollHeight}px`; };
        }
        function finalizeText() {
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
        if (textToolInput) {
            textToolInput.addEventListener('blur', () => { if (textToolInput.style.display === 'block') finalizeText(); });
            textToolInput.addEventListener('keydown', (e) => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();finalizeText();}});
        }
        
        function loadSessionById(idToLoad) {
            console.log(`[SESSION PAGE] loadSessionById: Attempting to load ${idToLoad}`);
            const sessions = getSavedSessions();
            const sessionToLoad = sessions.find(s => s.id === idToLoad);
            if (sessionToLoad && sessionToLoad.imageDataUrl) {
                if(activeSessionNameEl) activeSessionNameEl.textContent = sessionToLoad.sessionName; // Update names first
                if(activeHostNameEl) activeHostNameEl.textContent = sessionToLoad.hostName;
                currentSessionId = sessionToLoad.id; // Ensure currentSessionId is set to the loaded one
                const img = new Image();
                img.onload = () => {
                    console.log(`[SESSION PAGE] Image for session ${idToLoad} LOADED by loadSessionById.`);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    history = []; historyStep = -1;
                    saveHistory(); // Save loaded image as first history state
                    updateUndoRedoButtons();
                    console.log(`[SESSION PAGE] Session ${idToLoad} drawn.`);
                };
                img.onerror = () => { console.error(`Error loading image for ${idToLoad}.`); history=[];historyStep=-1;saveHistory();updateUndoRedoButtons();};
                img.src = sessionToLoad.imageDataUrl;
            } else {
                console.warn(`Session ${idToLoad} not found or no image data.`);
                // If not found, it's effectively a new session with the passed name/host (if any)
                // or the defaults. The currentSessionId would have been set earlier.
                history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons();
            }  
        }
        
        initializeSessionPage(); // Crucial call to start everything on session page
    }
    
    console.log("AR WhiteBoard Scripts Fully Initialized! (End of DOMContentLoaded)");
});
