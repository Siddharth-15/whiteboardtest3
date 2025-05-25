// js/script.js - FULLY RE-INTEGRATED AND CONSOLIDATED WITH COLLABORATIVE FEATURES & PERMISSIONS

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
        if (document.getElementById('tsparticles-bg')) { // Only setup if element exists
             setupTsParticles();
        }
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
    applyTheme(initialTheme); // Apply initial theme


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
            
            if (!hostNameInputVal || !sessionNameInputVal) {
                alert("Please fill in Your Name and Session Name."); return;
            }
            
            const sanitizedHostName = hostNameInputVal.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10) || 'Host';
            const randomSuffix = Math.random().toString(36).substring(2, 7);
            const newSessionId = `${sanitizedHostName}-${randomSuffix}`;
            const sessionURL = `session.html?sessionId=${encodeURIComponent(newSessionId)}&sessionName=${encodeURIComponent(sessionNameInputVal)}&hostName=${encodeURIComponent(hostNameInputVal)}`;
            
            console.log(`New session created: ID=${newSessionId}, Name=${sessionNameInputVal}, Host=${hostNameInputVal}`);
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
                            <a href="session.html?sessionId=${session.id}&sessionName=${encodeURIComponent(session.sessionName)}&hostName=${encodeURIComponent(session.hostName)}" class="btn btn-sm btn-primary btn-gradient view-session-btn"><i class="bi bi-eye-fill me-1"></i> View</a>
                            <button class="btn btn-sm btn-outline-danger delete-session-btn" data-session-id="${session.id}" title="Delete"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>`;
            return col;
        }
        function displaySavedSessions() {
            const sessions = getSavedSessions();
            if (!sessionsContainer) return; // Guard against null
            sessionsContainer.innerHTML = '';
            if (sessions.length === 0) {
                if (noSessionsMessage) noSessionsMessage.style.display = 'block';
                if (clearAllSessionsBtn) clearAllSessionsBtn.style.display = 'none';
            } else {
                if (noSessionsMessage) noSessionsMessage.style.display = 'none';
                if (clearAllSessionsBtn) clearAllSessionsBtn.style.display = 'inline-block';
                sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                sessions.forEach(session => sessionsContainer.appendChild(renderSessionCard(session)));
                addDashboardEventListeners();
            }
        }
        function addDashboardEventListeners() {
            if (!sessionsContainer) return;
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
    const canvasElement = document.getElementById('whiteboardCanvas');
    if (canvasElement) {
        console.log("[SESSION PAGE] Canvas element FOUND. Initializing logic...");

        let socket;
        let localUserId = null;
        let currentSessionIdFromURL = null; 
        let sessionNameFromURL = 'Session';
        let hostNameFromURL = 'Host';      
        let myNameInSession = null;         
        let joinerNameFromURL = null;       
        
        let isCurrentUserHost = false;      
        let currentUserCanDraw = false;     
        let participantsList = {}; 

        const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        const activeSessionNameEl = document.getElementById('activeSessionName');
        const activeHostNameEl = document.getElementById('activeHostName');
        const hostParticipantEl = document.getElementById('hostParticipant'); 
        const participantListUl = document.getElementById('participantList'); 
        const colorPicker = document.getElementById('toolColor');
        const lineWidthRange = document.getElementById('lineWidth');
        const lineWidthValueEl = document.getElementById('lineWidthValue');
        const toolButtons = document.querySelectorAll('.btn-tool'); 
        const leaveSessionBtn = document.getElementById('leaveSessionBtn');
        const clearBoardBtn = document.getElementById('clearBoardBtn');
        const saveSessionBtnOnSessionPage = document.getElementById('saveSessionBtn');
        const undoBtn = document.getElementById('tool-undo');
        const redoBtn = document.getElementById('tool-redo');
        const textToolInput = document.getElementById('textToolInput');

        let isDrawingLocal = false; 
        let currentLocalTool = 'tool-pencil'; 
        let currentLocalLineWidth = 5;
        let currentLocalColor = '#F57C00';
        let localStartX, localStartY, localSnapshot; 
        let history = [], historyStep = -1; 

        let isDrawingForEmit = false; 
        let lastEmitX, lastEmitY;

        function initializeSessionPage() {
            console.log("[SESSION PAGE] initializeSessionPage CALLED");
            const urlParams = new URLSearchParams(window.location.search);
            currentSessionIdFromURL = urlParams.get('sessionId');
            sessionNameFromURL = urlParams.get('sessionName') || sessionNameFromURL;
            hostNameFromURL = urlParams.get('hostName') || hostNameFromURL; 
            joinerNameFromURL = urlParams.get('joinerName');

            if (joinerNameFromURL) {
                myNameInSession = joinerNameFromURL;
            } else if (hostNameFromURL) { 
                myNameInSession = hostNameFromURL;
            } else {
                myNameInSession = `Guest_${Math.random().toString(36).substring(2, 7)}`;
            }
            
            if (!currentSessionIdFromURL) {
                alert("Error: Session ID is missing. Returning to homepage.");
                window.location.href = 'index.html';
                return;
            }

            if (activeSessionNameEl) activeSessionNameEl.textContent = sessionNameFromURL;
            if (activeHostNameEl) activeHostNameEl.textContent = hostNameFromURL;
            if (hostParticipantEl) hostParticipantEl.textContent = `Host: ${hostNameFromURL}`;

            resizeCanvas(); 
            window.addEventListener('resize', resizeCanvas);

            if (colorPicker) {
                currentLocalColor = colorPicker.value; // Ensure this is set before listeners
                colorPicker.addEventListener('input', (e) => { currentLocalColor = e.target.value; });
            }
            if (lineWidthRange && lineWidthValueEl) {
                currentLocalLineWidth = parseInt(lineWidthRange.value); // Ensure this is set
                lineWidthValueEl.textContent = currentLocalLineWidth;
                lineWidthRange.addEventListener('input', (e) => {
                    currentLocalLineWidth = parseInt(e.target.value);
                    lineWidthValueEl.textContent = currentLocalLineWidth;
                });
            }

            addCanvasEventListeners(); 
            addToolEventListeners();   

            socket = io('https://whiteboardtest3.onrender.com'); // Your Render URL
            socket.on('connect', () => {
                console.log('[SESSION PAGE] Connected to Socket.IO server with ID:', socket.id);
                localUserId = socket.id;
                socket.emit('join_session', currentSessionIdFromURL, myNameInSession);
            });
            socket.on('connect_error', (error) => {
                console.error('[SESSION PAGE] Socket.IO connection error:', error);
                alert('Could not connect to the whiteboard server. Ensure server is running and HTTPS is trusted.');
            });
            
            socket.on('drawing_action_broadcast', handleDrawingActionBroadcast);
            socket.on('user_joined', handleUserJoined);       
            socket.on('user_left', handleUserLeft);         
            socket.on('current_participants', handleCurrentParticipants); 
            socket.on('permission_updated', handlePermissionUpdated); 

            console.log(`[SESSION PAGE] Initializing. MyName: ${myNameInSession}, HostName from URL: ${hostNameFromURL}, JoinerName from URL: ${joinerNameFromURL}`);

            if (currentSessionIdFromURL && !joinerNameFromURL) {
                loadSessionById(currentSessionIdFromURL); 
            } else { 
                history = []; historyStep = -1; 
                saveHistory(); 
            }
            updateUndoRedoButtons(); 
            canvasElement.style.cursor = 'crosshair';
            setActiveToolById(currentLocalTool); 
            updateDrawingToolsAccess(); // Initial check
            console.log("[SESSION PAGE] initializeSessionPage COMPLETED. Session ID:", currentSessionIdFromURL);
        }
        
        function resizeCanvas() {
            if (!canvasElement || !ctx) return;
            const container = canvasElement.parentElement;
            if (!container) return;

            // Save current canvas content before resizing
            let tempImageData = null;
            if (canvasElement.width > 0 && canvasElement.height > 0) { // Only if canvas has dimensions
                try { tempImageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height); }
                catch(e) { console.warn("Could not get imagedata before resize", e); }
            }
            
            const style = getComputedStyle(container);
            const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            canvasElement.width = container.clientWidth - paddingX;
            canvasElement.height = container.clientHeight - paddingY;
            
            // Restore canvas content if it was saved
            if (tempImageData) {
                ctx.putImageData(tempImageData, 0, 0);
            } else {
                redrawHistoryState(); // Fallback to history if snapshot failed
            }
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.strokeStyle = currentLocalColor; // Re-apply current color and width
            ctx.lineWidth = currentLocalLineWidth;
        }
        function redrawHistoryState() {
            if (!ctx) return;
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
            if (!canvasElement) return;
            if (historyStep < history.length - 1) history = history.slice(0, historyStep + 1);
            if (history.length >= 20) { history.shift(); if(historyStep > 0) historyStep--; } 
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
        function getCanvasCoordinates(event) { 
            if (!canvasElement) return null;
            const rect = canvasElement.getBoundingClientRect();
            const clientX = event.clientX ?? event.touches?.[0]?.clientX;
            const clientY = event.clientY ?? event.touches?.[0]?.clientY;
            if (clientX === undefined || clientY === undefined) return null;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }
        function activateTextTool(x, y) {  
            if (!textToolInput || !ctx) { console.error("textToolInput or ctx not found in activateTextTool"); return; }
            const fontSize = Math.max(12, currentLocalLineWidth * 2 + 8); 
            const lineHeight = fontSize * 1.2;
            textToolInput.style.display = 'block';
            textToolInput.style.left = `${x}px`; textToolInput.style.top = `${y}px`;
            textToolInput.style.font = `${fontSize}px Poppins`;
            textToolInput.style.color = currentLocalColor; 
            textToolInput.style.lineHeight = `${lineHeight}px`;
            textToolInput.style.width = 'auto'; textToolInput.style.minWidth = '100px';
            textToolInput.style.height = `${lineHeight + 4}px`;
            textToolInput.value = '';
            textToolInput.focus();
            textToolInput.oninput = function() { this.style.height = 'auto'; this.style.height = `${this.scrollHeight}px`; };
        }
        function finalizeText() {  
            if (!textToolInput || textToolInput.style.display === 'none' || !ctx) return;
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
        function loadSessionById(idToLoad) { 
            if (!ctx) return;
            console.log(`[SESSION PAGE] loadSessionById: Attempting to load ${idToLoad}`);
            const sessions = getSavedSessions();
            const sessionToLoad = sessions.find(s => s.id === idToLoad);
            if (sessionToLoad && sessionToLoad.imageDataUrl) {
                if(activeSessionNameEl) activeSessionNameEl.textContent = sessionToLoad.sessionName;
                if(activeHostNameEl) activeHostNameEl.textContent = sessionToLoad.hostName;
                sessionNameFromURL = sessionToLoad.sessionName; 
                hostNameFromURL = sessionToLoad.hostName; 

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
        function setActiveToolById(toolId) { 
            currentLocalTool = toolId; 
            toolButtons.forEach(btn => {
                if (btn.id === toolId) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            if(canvasElement) canvasElement.style.cursor = (currentLocalTool === 'tool-text') ? 'text' : 'crosshair';
             if (currentLocalTool !== 'tool-text' && textToolInput && textToolInput.style.display === 'block') { // Changed condition
                finalizeText(); 
            }
        }
        function addToolEventListeners() { 
             toolButtons.forEach(button => {
                button.addEventListener('click', function() {
                    setActiveToolById(this.id);
                });
            });
            if (undoBtn) undoBtn.addEventListener('click', undo);
            if (redoBtn) redoBtn.addEventListener('click', redo);
            if (clearBoardBtn) clearBoardBtn.addEventListener('click', handleClearBoardAndEmit);
            if (saveSessionBtnOnSessionPage) { 
                saveSessionBtnOnSessionPage.addEventListener('click', () => {
                    if (!canvasElement) return;
                    const imageDataUrl = canvasElement.toDataURL('image/png');
                    const sName = activeSessionNameEl?.textContent || sessionNameFromURL || 'Untitled Session';
                    const hName = activeHostNameEl?.textContent || hostNameFromURL || 'Host';
                    const sessionToSave = {
                        id: currentSessionIdFromURL, 
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
                    if(socket) socket.disconnect(); 
                    window.location.href = 'index.html'; 
                }
            });
            if (textToolInput) { // Moved textToolInput listeners here
                textToolInput.addEventListener('blur', () => { if (textToolInput.style.display === 'block') finalizeText(); });
                textToolInput.addEventListener('keydown', (e) => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();finalizeText();}});
            }
        }
        function addCanvasEventListeners() { 
            console.log("[SESSION PAGE] Attaching canvas drawing event listeners.");
            if (!canvasElement) return;
            canvasElement.addEventListener('mousedown', handlePointerDown);
            canvasElement.addEventListener('mousemove', handlePointerMove);
            canvasElement.addEventListener('mouseup', handlePointerUp);
            canvasElement.addEventListener('mouseout', handlePointerUp); 
            canvasElement.addEventListener('touchstart', (e) => { e.preventDefault(); handlePointerDown(e.touches[0]); }, { passive: false });
            canvasElement.addEventListener('touchmove', (e) => { e.preventDefault(); handlePointerMove(e.touches[0]); }, { passive: false });
            canvasElement.addEventListener('touchend', (e) => { e.preventDefault(); handlePointerUp(e.changedTouches[0]); }, { passive: false });
            canvasElement.addEventListener('touchcancel', (e) => { e.preventDefault(); handlePointerUp(e.changedTouches[0]); }, { passive: false });
        }
        
        function handlePointerDown(event) {
            if (!currentUserCanDraw) {
                console.log("[SESSION PAGE] Drawing attempt denied. User cannot draw.");
                return; 
            }
            const coords = getCanvasCoordinates(event);
            if (!coords || (event.buttons && event.buttons !== 1 && event.type.startsWith('mouse'))) return; 

            isDrawingForEmit = true; 
            lastEmitX = coords.x;
            lastEmitY = coords.y;

            isDrawingLocal = true; 
            localStartX = coords.x;
            localStartY = coords.y;

            if (currentLocalTool === 'tool-text') {
                if (textToolInput && textToolInput.style.display === 'block') finalizeText();
                activateTextTool(localStartX, localStartY);
                isDrawingForEmit = false; isDrawingLocal = false; 
                return;
            }
            
            ctx.beginPath();
            ctx.moveTo(localStartX, localStartY);
            ctx.lineWidth = currentLocalLineWidth;
            ctx.strokeStyle = currentLocalColor;
            ctx.fillStyle = currentLocalColor; 
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (currentLocalTool === 'tool-pencil') {
                ctx.beginPath(); 
                ctx.arc(lastEmitX, lastEmitY, currentLocalLineWidth / 2, 0, Math.PI * 2);
                ctx.fill();
                const dotData = {
                    type: 'draw_dot', tool: 'pencil_dot',
                    x: lastEmitX, y: lastEmitY,
                    color: currentLocalColor, lineWidth: currentLocalLineWidth,
                    sessionId: currentSessionIdFromURL, userId: localUserId
                };
                if (socket && socket.connected) {
                      console.log("[SESSION PAGE] Emitting draw_dot:", JSON.parse(JSON.stringify(dotData))); 
                    socket.emit('drawing_action', dotData);
                }
            } else if (['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool)) {
                try { localSnapshot = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height); }
                catch (e) { console.error("Snapshot failed:", e); localSnapshot = null; }
            }
        }

        function handlePointerMove(event) {
            if (!isDrawingForEmit && currentLocalTool !== 'tool-eraser' && !isDrawingLocal) return; 
            if (!currentUserCanDraw && isDrawingForEmit) { 
                 isDrawingForEmit = false; isDrawingLocal = false; return;
            }
            
            const coords = getCanvasCoordinates(event);
            if (!coords) return;

            if (localSnapshot && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool) && isDrawingLocal) {
                 ctx.putImageData(localSnapshot, 0, 0);
            }
            
            ctx.lineWidth = currentLocalLineWidth;
            ctx.strokeStyle = currentLocalColor;
            ctx.fillStyle = currentLocalColor;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';

            if (currentLocalTool === 'tool-pencil' && isDrawingForEmit) {
                ctx.beginPath(); 
                ctx.moveTo(lastEmitX, lastEmitY);
                ctx.lineTo(coords.x, coords.y);
                ctx.stroke();
                const segmentData = {
                    type: 'draw_segment', tool: 'pencil',
                    startX: lastEmitX, startY: lastEmitY,
                    endX: coords.x, endY: coords.y,
                    color: currentLocalColor, lineWidth: currentLocalLineWidth,
                    sessionId: currentSessionIdFromURL, userId: localUserId
                };
                if (socket && socket.connected){
                      console.log("[SESSION PAGE] Emitting draw_segment:", JSON.parse(JSON.stringify(segmentData)));
                    socket.emit('drawing_action', segmentData);
                }
                lastEmitX = coords.x; lastEmitY = coords.y;
            } else if (currentLocalTool === 'tool-eraser' && (isDrawingForEmit || (event.buttons && event.buttons === 1))) {
                // Server-side check will prevent emitting if !currentUserCanDraw
                if (!isDrawingLocal) { 
                    isDrawingLocal = true; 
                    ctx.beginPath(); ctx.moveTo(coords.x, coords.y);
                }
                const bg = getComputedStyle(canvasElement).backgroundColor;
                ctx.strokeStyle = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') ? bg : '#FFFFFF'; 
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
            // If not drawing anything (pencil or local shape/eraser) and not text tool, nothing to do.
            if (!isDrawingForEmit && !isDrawingLocal && currentLocalTool !== 'tool-text') return;

            // Get final coordinates, fallback if event doesn't have them (e.g. mouseout)
            const coords = getCanvasCoordinates(event) || (isDrawingForEmit ? { x: lastEmitX, y: lastEmitY } : { x: localStartX, y: localStartY });

            // This block is for shapes and eraser - local drawing is done, now emit.
            if (isDrawingLocal && ['tool-line', 'tool-rectangle', 'tool-circle', 'tool-eraser'].includes(currentLocalTool)) {
                // Only emit if user has permission (though server also checks)
                if (currentUserCanDraw) {
                    let actionData = {
                        tool: currentLocalTool.replace('tool-', ''),
                        startX: localStartX, startY: localStartY,
                        endX: coords.x, endY: coords.y, 
                        color: currentLocalColor, 
                        lineWidth: currentLocalLineWidth,
                        sessionId: currentSessionIdFromURL, userId: localUserId
                    };

                    if (currentLocalTool === 'tool-line') actionData.type = 'draw_shape_line';
                    else if (currentLocalTool === 'tool-rectangle') actionData.type = 'draw_shape_rect';
                    else if (currentLocalTool === 'tool-circle') {
                        actionData.type = 'draw_shape_circle';
                        actionData.radius = Math.sqrt(Math.pow(coords.x - localStartX, 2) + Math.pow(coords.y - localStartY, 2));
                    } else if (currentLocalTool === 'tool-eraser') {
                        // COLLABORATIVE ERASER - basic segment. More complex needed for true path.
                        // actionData.type = 'erase_segment'; // Server needs to handle this type
                        // For now, we decided not to emit eraser:
                        // if (socket && socket.connected) socket.emit('drawing_action', actionData); 
                    }
                    
                    // Don't emit eraser for now, as it's only local
                    if (socket && socket.connected && currentLocalTool !== 'tool-eraser') {
                         console.log("[SESSION PAGE] Emitting shape action:", JSON.parse(JSON.stringify(actionData)));
                         socket.emit('drawing_action', actionData);
                    }
                }
            }
            
            isDrawingForEmit = false;
            isDrawingLocal = false;
            localSnapshot = null;

            if (currentLocalTool === 'tool-text') {
                // Finalize text if mouseup outside text input AND text tool is active.
                // The blur and Enter keydown handlers in addToolEventListeners usually cover this.
            } else {
                 saveHistory(); 
            }
        }

        function handleDrawingActionBroadcast(data) {
            if (!ctx || data.userId === localUserId) return;
              console.log('[SESSION PAGE] Received drawing_action_broadcast. Data:', JSON.parse(JSON.stringify(data)), 'My localUserId:', localUserId);

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
                history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons()
                console.log("[SESSION PAGE] Board cleared by remote user:", data.userId);
                break;
                default:
                    console.warn("[SESSION PAGE] Unknown drawing action type received:", data.type);
            }
            ctx.strokeStyle=oStroke; ctx.lineWidth=oWidth; ctx.fillStyle=oFill; ctx.lineCap=oCap; ctx.lineJoin=oJoin;
        }

        function handleCurrentParticipants(currentUsersArray) {
            console.log('[SESSION PAGE] Received current_participants event. Data:',JSON.parse(JSON.stringify(currentUsersArray)));
            // --- OR simply reassign if it was declared with let:
            participantsList = {}; // This is fine if participantsList was declared with 'let' at the higher scope
            isCurrentUserHost = false; // Reset before re-evaluating
            currentUserCanDraw = false; // Reset before re-evaluating
            
            currentUsersArray.forEach(user => {
                participantsList[user.userId] = { 
                    name: user.userName, 
                    canDraw: user.canDraw, 
                    isHost: user.isHost 
                };
                if (user.userId === localUserId) {
                    isCurrentUserHost = user.isHost;
                    currentUserCanDraw = user.canDraw;
                     console.log(`[SESSION PAGE] My status set from current_participants: localUserId=${localUserId}, isCurrentUserHost=${isCurrentUserHost}, currentUserCanDraw=${currentUserCanDraw}, myNameInSession=${myNameInSession}`);
                }
                if (user.isHost && activeHostNameEl) { 
                    activeHostNameEl.textContent = user.userName;
                    if(hostParticipantEl) hostParticipantEl.textContent = `Host: ${user.userName}`;
                }
            });
            updateParticipantListUI();
            updateDrawingToolsAccess();
            console.log('[SESSION PAGE] handleCurrentParticipants finished. Updated participantsList:', JSON.parse(JSON.stringify(participantsList))); // Log final state
        }

        function handleUserJoined(userData) {
             console.log('[SESSION PAGE] Received user_joined event. Data:', JSON.parse(JSON.stringify(userData)));
            participantsList[userData.userId] = { 
                name: userData.userName, 
                canDraw: userData.canDraw, 
                isHost: userData.isHost 
            };
            if (userData.isHost && activeHostNameEl) { 
                 activeHostNameEl.textContent = userData.userName;
                 if(hostParticipantEl) hostParticipantEl.textContent = `Host: ${userData.userName}`;
            }
            updateParticipantListUI();
            console.log('[SESSION PAGE] handleUserJoined finished for', userData.userId, '. Updated participantsList:', JSON.parse(JSON.stringify(participantsList))); // Log final state
        }
        
        function handleUserLeft(data) { 
            console.log('[SESSION PAGE] User left event:', data.userName, data.userId);
            if (participantsList[data.userId]) { // Check if user exists before deleting
                delete participantsList[data.userId];
            }
            updateParticipantListUI();
        }

                   function updateParticipantListUI() {
            if (!participantListUl) return;
            console.log(`[SESSION PAGE] updateParticipantListUI called. isCurrentUserHost: ${isCurrentUserHost}. participantsList:`, JSON.parse(JSON.stringify(participantsList)));
            
            participantListUl.innerHTML = ''; // Clear the list before rebuilding

            let actualHostNameForDisplay = hostNameFromURL; // Fallback to name from URL if no host is in the list yet
            let actualHostId = null;
            let isThisClientTheHostInList = false;

            // Step 1: Find the host details from the current participantsList
            for (const uid in participantsList) { // Use a different variable name like uid to avoid confusion
                if (participantsList[uid].isHost) {
                    actualHostNameForDisplay = participantsList[uid].name;
                    actualHostId = uid;
                    if (actualHostId === localUserId) {
                        isThisClientTheHostInList = true;
                    }
                    break; // Found the host
                }
            }
            
            // Step 2: Display the Host information
            const hostLi = document.createElement('li');
            hostLi.className = 'list-group-item bg-transparent px-1 py-1 d-flex justify-content-between align-items-center';
            const hostNameSpan = document.createElement('span');
            hostNameSpan.className = 'fw-bold';
            hostNameSpan.textContent = `Host: ${actualHostNameForDisplay}`;
            if (isThisClientTheHostInList) {
                hostNameSpan.textContent += ' (You)';
            }
            // If the host can draw (which they always should by server logic), show pencil icon
            if (actualHostId && participantsList[actualHostId] && participantsList[actualHostId].canDraw) {
                const pencilIcon = document.createElement('i');
                pencilIcon.className = 'bi bi-pencil-fill ms-2 text-success small';
                pencilIcon.title = "Can draw";
                hostNameSpan.appendChild(pencilIcon);
            }
            hostLi.appendChild(hostNameSpan);
            participantListUl.appendChild(hostLi);

            // Step 3: Display other (non-host) participants
            for (const userId_participant in participantsList) { // Use a distinct variable name
                const user = participantsList[userId_participant];
                
                // Skip if this user is the host (already displayed)
                if (user.isHost) { 
                    continue; 
                }

                const li = document.createElement('li');
                li.className = 'list-group-item bg-transparent px-1 py-1 d-flex justify-content-between align-items-center';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = `${user.name}${userId_participant === localUserId ? ' (You)' : ''}`;
                if (user.canDraw) { 
                    const pencilIcon = document.createElement('i');
                    pencilIcon.className = 'bi bi-pencil-fill ms-2 text-success small';
                    pencilIcon.title = "Can draw";
                    nameSpan.appendChild(pencilIcon);
                }
                li.appendChild(nameSpan);

                // Permission toggle button: Show if current user IS THE HOST, 
                // AND this list item is NOT the host (already covered by the if(user.isHost) continue),
                // AND this list item is not the current user (host shouldn't set their own permission here)
                if (isCurrentUserHost && userId_participant !== localUserId) { 
                    const toggleBtn = document.createElement('button');
                    console.log(`[SESSION PAGE] Creating permission button for ${user.name} (ID: ${userId_participant}). Their current canDraw status from participantsList: ${user.canDraw}`);
                    
                    toggleBtn.className = `btn btn-sm py-0 px-1 ${user.canDraw ? 'btn-outline-danger' : 'btn-outline-success'}`;
                    toggleBtn.innerHTML = user.canDraw ? '<i class="bi bi-slash-circle"></i> Revoke' : '<i class="bi bi-check-circle"></i> Allow';
                    toggleBtn.title = user.canDraw ? 'Revoke drawing permission' : 'Grant drawing permission';
                    toggleBtn.style.fontSize = '0.7rem';
                    toggleBtn.addEventListener('click', () => {
                        if (!socket || !socket.connected) { console.error("Socket not connected for permission toggle"); return; }
                        console.log(`[SESSION PAGE] Host (localUserId: ${localUserId}) emitting update_draw_permission for targetUserId: ${userId_participant}. Setting canDraw to: ${!user.canDraw}`);
                        socket.emit('update_draw_permission', {
                            targetUserId: userId_participant,
                            canDraw: !user.canDraw, 
                            sessionId: currentSessionIdFromURL
                        });
                    });
                    li.appendChild(toggleBtn);
                }
                participantListUl.appendChild(li);
            }
        }

        function handlePermissionUpdated(data) { // data: { userId, userName, canDraw, isHost, updatedByHostId }
           console.log('[SESSION PAGE] Received permission_updated event. Data:', JSON.parse(JSON.stringify(data))); // Log incoming data
            if (participantsList[data.userId]) {
               console.log(`[SESSION PAGE] Permission for ${data.userId} (${participantsList[data.userId].name}) BEFORE update: canDraw = ${participantsList[data.userId].canDraw}`);
                participantsList[data.userId].canDraw = data.canDraw;
                 // isHost status of a participant should not change via this event, only drawing permission
                 console.log(`[SESSION PAGE] Permission for ${data.userId} (${participantsList[data.userId].name}) AFTER update: canDraw = ${participantsList[data.userId].canDraw}`);
            } else {
                console.warn(`[SESSION PAGE] Received permission_updated for unknown user: ${data.userId}, full participantsList:`, JSON.parse(JSON.stringify(participantsList)));
               
            }
            if (data.userId === localUserId) { // If this client's permission was changed
                currentUserCanDraw = data.canDraw;
                console.log(`[SESSION PAGE] My drawing permission updated to: ${currentUserCanDraw}`);
                updateDrawingToolsAccess();
            }
            updateParticipantListUI(); 
             console.log('[SESSION PAGE] handlePermissionUpdated finished. Updated participantsList:', JSON.parse(JSON.stringify(participantsList)));
        }

        function updateDrawingToolsAccess() {
             console.log("[SESSION PAGE] Rebuilding participant list. Current Host:", isCurrentUserHost, "Full list:", JSON.parse(JSON.stringify(participantsList))); // Log full list state
            const UIElementsToToggle = [ 
                colorPicker, lineWidthRange, 
                undoBtn, redoBtn, clearBoardBtn, // Also toggle clearBoardBtn based on draw permission
                ...toolButtons 
            ];

            if (currentUserCanDraw) {
                console.log("[SESSION PAGE] Drawing tools ENABLED for current user.");
                if(canvasElement) {
                    canvasElement.style.pointerEvents = 'auto'; 
                    canvasElement.classList.remove('disabled-canvas'); 
                }
                UIElementsToToggle.forEach(el => { if (el) el.disabled = false; });
            } else {
                console.log("[SESSION PAGE] Drawing tools DISABLED for current user.");
                if(canvasElement) {
                    canvasElement.style.pointerEvents = 'none'; 
                    canvasElement.classList.add('disabled-canvas'); 
                }
                UIElementsToToggle.forEach(el => { if (el) el.disabled = true; });
                
                // Always enable leave button
                if(leaveSessionBtn) leaveSessionBtn.disabled = false; 
                // Save session button: decide your logic (e.g., only host can save, or anyone if they can draw)
                if(saveSessionBtnOnSessionPage) {
                    saveSessionBtnOnSessionPage.disabled = !isCurrentUserHost; // Example: only host can save
                    console.log(`[SESSION PAGE] Save button. isCurrentUserHost: ${isCurrentUserHost}, button disabled: ${saveSessionBtnOnSessionPage.disabled}`);
                }
            }
        }
        
        function handleClearBoardAndEmit() { 
            if (!ctx) return;
            // Permission check for clearing: either current user can draw OR is the host
            if (!currentUserCanDraw && !isCurrentUserHost) {
                alert("You don't have permission to clear the board.");
                console.log("[SESSION PAGE] Clear board denied. currentUserCanDraw:", currentUserCanDraw, "isCurrentUserHost:", isCurrentUserHost);
                return;
            }
            if (confirm("Are you sure you want to clear the entire board for everyone? This cannot be undone.")) {
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons(); 
                const clearData = { type: 'clear_board', sessionId: currentSessionIdFromURL, userId: localUserId };
                if (socket && socket.connected) socket.emit('drawing_action', clearData);
                console.log("[SESSION PAGE] Board cleared locally and clear action emitted.");
            }
        }

        initializeSessionPage(); 
    }
    
    console.log("AR WhiteBoard Scripts Fully Initialized! (End of DOMContentLoaded)");
});
