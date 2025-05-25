// js/script.js - FINAL CONSOLIDATED VERSION (Part 1)

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
            styles.getPropertyValue('--ts-particle-color1').trim() || '#FFC107', // Fallback colors
            styles.getPropertyValue('--ts-particle-color2').trim() || '#0D6EFD',
            styles.getPropertyValue('--ts-particle-color3').trim() || '#DC3545'
        ];
        const linkColor = styles.getPropertyValue('--ts-link-color').trim() || '#FFFFFF';
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
        if (typeof tsParticles !== "undefined" && document.getElementById('tsparticles-bg')) {
            const options = getTsParticlesOptions();
            if (tsParticlesInstance) {
                try { tsParticlesInstance.destroy(); } catch(e) { console.warn("Error destroying previous tsParticles instance", e); }
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


    // --- General Page Setup ---
    const navbar = document.querySelector('.navbar.fixed-top');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
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

    // --- Form Handlers ---
    const joinSessionForm = document.getElementById('joinSessionForm');
    if (joinSessionForm) {
        joinSessionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const sessionCode = document.getElementById('sessionCode')?.value.trim();
            const joinerName = document.getElementById('joinerName')?.value.trim();
            if (!sessionCode || !joinerName) { alert('Please enter the session code and your name.'); return; }
            const sessionURL = `session.html?sessionId=${encodeURIComponent(sessionCode)}&joinerName=${encodeURIComponent(joinerName)}`;
            console.log(`Attempting to join session: ID=${sessionCode}, Joiner=${joinerName}`);
            window.location.href = sessionURL;
            const joinModalEl = document.getElementById('join-modal');
            if (joinModalEl && typeof bootstrap !== 'undefined') { 
                const joinModal = bootstrap.Modal.getInstance(joinModalEl); 
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
            if (!hostNameInputVal || !sessionNameInputVal) { alert("Please fill in Your Name and Session Name."); return; }
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
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (icon) { icon.classList.remove('bi-eye-fill'); icon.classList.add('bi-eye-slash-fill'); }
            } else {
                passwordInput.type = 'password';
                if (icon) { icon.classList.remove('bi-eye-slash-fill'); icon.classList.add('bi-eye-fill'); }
            }
        });
    }
    const contactPageForm = document.getElementById('contactPageForm');
    if (contactPageForm) { 
        contactPageForm.addEventListener('submit', function(event) {
            event.preventDefault();
            // const contactName = document.getElementById('contactName')?.value.trim(); // Assuming you get values
            // ... other fields ...
            // if (!contactName /* ... || other fields ... */) { alert("Please fill in all fields..."); return; }
            console.log("Contact Form Submitted (Demo)");
            alert(`Thank you! Message received.\n(Demo - no email sent.)`);
            this.reset();
        });
    }

                          // js/script.js - FINAL CONSOLIDATED VERSION (Part 2)

    // === Dashboard Page Logic ===
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
            if (!sessionsContainer) return; 
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

    // === Session Page Specific JavaScript ===
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
        let pendingPermissionRequests = {};

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
        const requestDrawAccessBtn = document.getElementById('requestDrawAccessBtn'); 

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
                myNameInSession = prompt("Please enter your name for this session:", `Guest_${Math.random().toString(36).substring(2, 7)}`) 
                                || `Guest_${Math.random().toString(36).substring(2, 7)}`;
            }
            
            if (!currentSessionIdFromURL) { alert("Error: Session ID is missing..."); window.location.href = 'index.html'; return; }

            if (activeSessionNameEl) activeSessionNameEl.textContent = sessionNameFromURL;
            if (activeHostNameEl) activeHostNameEl.textContent = hostNameFromURL; 
            if (hostParticipantEl) hostParticipantEl.textContent = `Host: ${hostNameFromURL}`;

            resizeCanvas(); 
            window.addEventListener('resize', resizeCanvas);

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

            addCanvasEventListeners(); 
            addToolEventListeners();   

            socket = io('https://whiteboardtest3.onrender.com'); 
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
            socket.on('draw_permission_requested_to_host', handleDrawPermissionRequestedToHost); 
            socket.on('draw_request_denied', handleDrawRequestDenied); 
            socket.on('apply_board_state', handleApplyBoardState); 
            socket.on('permission_request_resolved_for_host', handlePermissionRequestResolvedForHost);

            console.log(`[SESSION PAGE] Initializing. MyName: ${myNameInSession}, HostName from URL: ${hostNameFromURL}, JoinerName from URL: ${joinerNameFromURL}`);
            if (currentSessionIdFromURL && !joinerNameFromURL) { loadSessionById(currentSessionIdFromURL); } 
            else { history = []; historyStep = -1; saveHistory();  }
            updateUndoRedoButtons(); 
            setActiveToolById(currentLocalTool); 
            updateDrawingToolsAccess(); 
            console.log("[SESSION PAGE] initializeSessionPage COMPLETED. Session ID:", currentSessionIdFromURL);
        }
// js/script.js - FINAL CONSOLIDATED VERSION (Part 3)
        
        function resizeCanvas() {
            if (!canvasElement || !ctx) return;
            const container = canvasElement.parentElement;
            if (!container) return;
            let tempImageData = null;
            if (canvasElement.width > 0 && canvasElement.height > 0) {
                try { tempImageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height); }
                catch(e) { console.warn("Could not get imagedata before resize", e); }
            }
            const style = getComputedStyle(container);
            const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            canvasElement.width = container.clientWidth - paddingX;
            canvasElement.height = container.clientHeight - paddingY;
            if (tempImageData) {
                ctx.putImageData(tempImageData, 0, 0);
            } else { redrawHistoryState(); }
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.strokeStyle = currentLocalColor; 
            ctx.lineWidth = currentLocalLineWidth;
        }
        function redrawHistoryState() {
            if (!ctx) return;
            if (history.length > 0 && historyStep >= 0 && history[historyStep]) {
                const img = new Image();
                img.onload = () => { 
                    if (!ctx || !canvasElement) return; // Check again as it's async
                    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); 
                    ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height); 
                };
                img.onerror = () => { console.error("Error loading history image."); if (ctx) ctx.clearRect(0,0,canvasElement.width,canvasElement.height);};
                img.src = history[historyStep];
            } else {
                if (ctx && canvasElement) ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
        }
        function saveHistory() {
            if (!canvasElement || !ctx) return;
            if (historyStep < history.length - 1) history = history.slice(0, historyStep + 1);
            if (history.length >= 20) { history.shift(); if(historyStep > 0) historyStep--; } 
            try { history.push(canvasElement.toDataURL()); historyStep++; }
            catch (e) { console.error("Error saving history:", e); }
            updateUndoRedoButtons();
        }
        function undo() { 
            if (historyStep > 0) { 
                historyStep--; redrawHistoryState(); updateUndoRedoButtons(); 
                if (currentUserCanDraw && isCurrentUserHost && socket && socket.connected) { // Only host syncs their undo
                    console.log("[SESSION PAGE] Host emitting board_state_sync for UNDO");
                    socket.emit('board_state_sync', { sessionId: currentSessionIdFromURL, imageDataUrl: canvasElement.toDataURL() });
                }
            } 
        }
        function redo() { 
            if (historyStep < history.length - 1) { 
                historyStep++; redrawHistoryState(); updateUndoRedoButtons(); 
                if (currentUserCanDraw && isCurrentUserHost && socket && socket.connected) { // Only host syncs their redo
                    console.log("[SESSION PAGE] Host emitting board_state_sync for REDO");
                    socket.emit('board_state_sync', { sessionId: currentSessionIdFromURL, imageDataUrl: canvasElement.toDataURL() });
                }
            } 
        }
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
            saveHistory(); // Save after text is drawn
            // COLLABORATIVE TEXT: Emit text data
            if (currentUserCanDraw && socket && socket.connected) {
                const textData = {
                    type: 'draw_text', // New type for server
                    text: text,
                    x: x, y: y,
                    font: fontStyle,
                    color: color,
                    lineHeight: lineHeight, // For multi-line handling on receiver
                    sessionId: currentSessionIdFromURL, userId: localUserId
                };
                console.log("[SESSION PAGE] Emitting draw_text:", JSON.parse(JSON.stringify(textData)));
                socket.emit('drawing_action', textData);
            }
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
                    if (!ctx || !canvasElement) return;
                    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
                    history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons();
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
            if(canvasElement) canvasElement.style.cursor = (currentLocalTool === 'tool-text') ? 'text' : (currentLocalTool === 'tool-eraser' ? 'grab' : 'crosshair');
             if (currentLocalTool !== 'tool-text' && textToolInput && textToolInput.style.display === 'block') {
                finalizeText(); 
            }
        }

    // js/script.js - FINAL CONSOLIDATED VERSION (Part 4)

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
                    // Ensure only host can save, or if you change logic, reflect here
                    if (!isCurrentUserHost) {
                        alert("Only the host can save the session snapshot.");
                        return;
                    }
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
            if (leaveSessionBtn) { 
                leaveSessionBtn.addEventListener('click', () => { 
                    if (confirm("Leave session?")) {
                        if(socket) socket.disconnect(); 
                        window.location.href = 'index.html'; 
                    }
                });
            }
            if (textToolInput) {
                textToolInput.addEventListener('blur', () => { if (textToolInput.style.display === 'block') finalizeText(); });
                textToolInput.addEventListener('keydown', (e) => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();finalizeText();}});
            }
            if (requestDrawAccessBtn) { // For Request Access model
                requestDrawAccessBtn.addEventListener('click', () => {
                    if (socket && socket.connected && !currentUserCanDraw && !isCurrentUserHost) {
                        console.log("[SESSION PAGE] Emitting request_draw_permission");
                        socket.emit('request_draw_permission', {sessionId: currentSessionIdFromURL }); // Send as object
                        requestDrawAccessBtn.disabled = true;
                        requestDrawAccessBtn.textContent = 'Request Sent...';
                        // Client side: mark that this user has requested
                        if(participantsList[localUserId]) participantsList[localUserId].hasRequestedDraw = true;
                    }
                });
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
               console.log("[SESSION PAGE] HOST/CLIENT handlePointerDown FIRED. currentUserCanDraw:", currentUserCanDraw, "Tool:", currentLocalTool);
            if (!currentUserCanDraw) {
                console.log("[SESSION PAGE] Drawing attempt denied (handlePointerDown). User cannot draw. currentUserCanDraw:", currentUserCanDraw);
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
                try { if (canvasElement.width > 0 && canvasElement.height > 0) localSnapshot = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height); }
                catch (e) { console.error("Snapshot failed:", e); localSnapshot = null; }
            }
        }

        function handlePointerMove(event) {
              console.log("[SESSION PAGE] HOST/CLIENT handlePointerMove FIRED. isDrawingForEmit:", isDrawingForEmit, "isDrawingLocal:", isDrawingLocal, "Tool:", currentLocalTool);
            if (!isDrawingForEmit && currentLocalTool !== 'tool-eraser' && !isDrawingLocal) return; 
            if (!currentUserCanDraw && isDrawingForEmit) { 
                 console.log("[SESSION PAGE] Drawing stopped mid-move due to permission revocation. currentUserCanDraw:", currentUserCanDraw);
                 isDrawingForEmit = false; isDrawingLocal = false; return;
            }
            
            const coords = getCanvasCoordinates(event);
            if (!coords) return;

            if (localSnapshot && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool) && isDrawingLocal) {
                 try { ctx.putImageData(localSnapshot, 0, 0); } catch(e) { console.warn("Error putting snapshot", e); }
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
                    socket.emit('drawing_action', segmentData);
                }
                lastEmitX = coords.x; lastEmitY = coords.y;
            } else if (currentLocalTool === 'tool-eraser' && isDrawingLocal) { // Removed isDrawingForEmit check for eraser
                if (!currentUserCanDraw) return; // Still need permission to erase
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

    // js/script.js - FINAL CONSOLIDATED VERSION (Part 5)

        function handlePointerUp(event) {
            if (!isDrawingLocal && currentLocalTool !== 'tool-text') { // If not drawing locally (shapes/eraser) & not text tool
                isDrawingForEmit = false; // Ensure pencil emit stops if mouse up without moving
                return;
            }

            const coords = getCanvasCoordinates(event) || (isDrawingForEmit ? { x: lastEmitX, y: lastEmitY } : { x: localStartX, y: localStartY });

            if (isDrawingLocal && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool)) {
                if (currentUserCanDraw) {
                    let actionData = {
                        tool: currentLocalTool.replace('tool-', ''),
                        startX: localStartX, startY: localStartY,
                        endX: coords.x, endY: coords.y, 
                        color: currentLocalColor, lineWidth: currentLocalLineWidth,
                        sessionId: currentSessionIdFromURL, userId: localUserId
                    };
                    if (currentLocalTool === 'tool-line') actionData.type = 'draw_shape_line';
                    else if (currentLocalTool === 'tool-rectangle') actionData.type = 'draw_shape_rect';
                    else if (currentLocalTool === 'tool-circle') {
                        actionData.type = 'draw_shape_circle';
                        actionData.radius = Math.sqrt(Math.pow(coords.x - localStartX, 2) + Math.pow(coords.y - localStartY, 2));
                    }
                    if (socket && socket.connected) {
                         console.log("[SESSION PAGE] Emitting shape action:", JSON.parse(JSON.stringify(actionData)));
                         socket.emit('drawing_action', actionData);
                    }
                }
            }
            
            // For eraser, emit full board state on mouseup if host
            if (currentLocalTool === 'tool-eraser' && isDrawingLocal && currentUserCanDraw && isCurrentUserHost && socket && socket.connected) {
                console.log("[SESSION PAGE] Host emitting board_state_sync for ERASER action completion");
                socket.emit('board_state_sync', { sessionId: currentSessionIdFromURL, imageDataUrl: canvasElement.toDataURL() });
            }
            
            isDrawingForEmit = false;
            isDrawingLocal = false;
            localSnapshot = null;

            if (currentLocalTool !== 'tool-text') { // Text tool saves history in finalizeText
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
                case 'draw_text': // NEW CASE for collaborative text
                    ctx.fillStyle = data.color; ctx.font = data.font;
                    ctx.textAlign = "left"; ctx.textBaseline = "top";
                    const lines = data.text.split('\n');
                    lines.forEach((line, index) => ctx.fillText(line, data.x, data.y + (index * data.lineHeight)));
                    break;
                case 'clear_board': 
                    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons();
                    console.log("[SESSION PAGE] Board cleared by remote user:", data.userId);
                    break;
                default:
                    console.warn("[SESSION PAGE] Unknown drawing action type received:", data.type);
            }
            ctx.strokeStyle=oStroke; ctx.lineWidth=oWidth; ctx.fillStyle=oFill; ctx.lineCap=oCap; ctx.lineJoin=oJoin;
        }
        
        function handleApplyBoardState({ imageDataUrl }) { 
            if (!ctx || (isCurrentUserHost && currentUserCanDraw) ) { // Host/drawer initiated this, they don't need to re-apply their own full state sync
                 console.log("[SESSION PAGE] apply_board_state skipped for host/active drawer.");
                 return;
            }
            console.log("[SESSION PAGE] Received board_state_sync. Applying new state.");
            const img = new Image();
            img.onload = () => {
                if (!ctx || !canvasElement) return;
                ctx.clearRect(0,0, canvasElement.width, canvasElement.height);
                ctx.drawImage(img, 0,0);
                history = []; historyStep = -1; 
                saveHistory(); 
                updateUndoRedoButtons();
            };
            img.onerror = () => console.error("Failed to load image for board state sync");
            img.src = imageDataUrl;
        }

        function handleCurrentParticipants(currentUsersArray) {
            console.log('[SESSION PAGE] Received current_participants. Raw data:', JSON.parse(JSON.stringify(currentUsersArray)));
            participantsList = {}; 
            isCurrentUserHost = false; 
            currentUserCanDraw = false; 
            let serverDesignatedHostName = hostNameFromURL; 
            currentUsersArray.forEach(user => {
                participantsList[user.userId] = { name: user.userName, canDraw: user.canDraw, isHost: user.isHost, hasRequestedDraw: pendingPermissionRequests[user.userId] || false };
                if (user.userId === localUserId) { 
                    isCurrentUserHost = user.isHost; currentUserCanDraw = user.canDraw; myNameInSession = user.userName; 
                    console.log(`[SESSION PAGE] My Status Updated from current_participants: localUserId=${localUserId}, Name=${myNameInSession}, IsHost=${isCurrentUserHost}, CanDraw=${currentUserCanDraw}`);
                }
                if (user.isHost) { serverDesignatedHostName = user.userName; }
            });
            if (activeHostNameEl) activeHostNameEl.textContent = serverDesignatedHostName;
            if (hostParticipantEl) hostParticipantEl.textContent = `Host: ${serverDesignatedHostName}`;
            updateParticipantListUI(); updateDrawingToolsAccess(); 
            console.log('[SESSION PAGE] handleCurrentParticipants finished. Final participantsList:', JSON.parse(JSON.stringify(participantsList)));
            console.log(`[SESSION PAGE] Final status after current_participants: IsHost=${isCurrentUserHost}, CanDraw=${currentUserCanDraw}`);
        }

        function handleUserJoined(userData) { 
            console.log('[SESSION PAGE] Received user_joined event. Data:', JSON.parse(JSON.stringify(userData)));
            // This event primarily informs about OTHERS. Own status is best set by 'current_participants'.
            // However, if this client was previously alone and server confirms they are host upon another joining, update.
            if (userData.userId === localUserId && userData.isHost && !isCurrentUserHost) {
                 console.warn(`[SESSION PAGE] My 'isHost' status updated by user_joined to true (likely I was first).`);
                 isCurrentUserHost = true;
                 currentUserCanDraw = true; // Host can always draw
                 updateDrawingToolsAccess();
            }
            participantsList[userData.userId] = { name: userData.userName, canDraw: userData.canDraw, isHost: userData.isHost, hasRequestedDraw: false };
            if (userData.isHost && activeHostNameEl) { 
                activeHostNameEl.textContent = userData.userName; 
                if(hostParticipantEl) hostParticipantEl.textContent = `Host: ${userData.userName}`; 
            }
            updateParticipantListUI(); 
        }
        
        function handleUserLeft(data) { 
            console.log('[SESSION PAGE] User left event:', data.userName, data.userId);
            if (participantsList[data.userId]) { 
                delete participantsList[data.userId];
            }
             if (pendingPermissionRequests[data.userId]) { // Clean up pending request if user leaves
                delete pendingPermissionRequests[data.userId];
            }
            updateParticipantListUI();
        }

    // js/script.js - FINAL CONSOLIDATED VERSION (Part 6)

        function updateParticipantListUI() {
            if (!participantListUl) return;
            console.log(`[SESSION PAGE] updateParticipantListUI called. isCurrentUserHost: ${isCurrentUserHost}. participantsList:`, JSON.parse(JSON.stringify(participantsList)));
            participantListUl.innerHTML = ''; 

            let identifiedHostName = hostNameFromURL; 
            let identifiedHostId = null;
            let hostIsYou = false;

            for (const userId_iter in participantsList) {
                if (participantsList[userId_iter].isHost) {
                    identifiedHostName = participantsList[userId_iter].name;
                    identifiedHostId = userId_iter;
                    if (identifiedHostId === localUserId) hostIsYou = true;
                    break; 
                }
            }
            
            const hostLi = document.createElement('li');
            hostLi.className = 'list-group-item bg-transparent px-1 py-1 d-flex justify-content-between align-items-center';
            const hostNameSpan = document.createElement('span');
            hostNameSpan.className = 'fw-bold';
            hostNameSpan.textContent = `Host: ${identifiedHostName}`;
            if (hostIsYou) hostNameSpan.textContent += ' (You)';
            
            if (identifiedHostId && participantsList[identifiedHostId]?.canDraw) {
                const pencilIcon = document.createElement('i');
                pencilIcon.className = 'bi bi-pencil-fill ms-2 text-success small';
                pencilIcon.title = "Can draw";
                hostNameSpan.appendChild(pencilIcon);
            }
            hostLi.appendChild(hostNameSpan); participantListUl.appendChild(hostLi);

            for (const userId_participant in participantsList) {
                const user = participantsList[userId_participant];
                if (user.isHost) continue; 

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

                if (isCurrentUserHost && userId_participant !== localUserId) { 
                    const controlsDiv = document.createElement('div'); // Container for buttons

                    if (pendingPermissionRequests[userId_participant] || (user.hasRequestedDraw && !user.canDraw)) { 
                        const approveBtn = document.createElement('button');
                        approveBtn.className = 'btn btn-sm py-0 px-1 btn-outline-success me-1';
                        approveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Approve';
                        approveBtn.title = 'Approve drawing request';
                        approveBtn.style.fontSize = '0.7rem';
                        approveBtn.onclick = () => socket.emit('approve_draw_permission', { targetUserId: userId_participant, sessionId: currentSessionIdFromURL });
                        controlsDiv.appendChild(approveBtn);

                        const denyBtn = document.createElement('button');
                        denyBtn.className = 'btn btn-sm py-0 px-1 btn-outline-warning';
                        denyBtn.innerHTML = '<i class="bi bi-x-circle"></i> Deny';
                        denyBtn.title = 'Deny drawing request';
                        denyBtn.style.fontSize = '0.7rem';
                        denyBtn.onclick = () => socket.emit('deny_draw_permission', { targetUserId: userId_participant, sessionId: currentSessionIdFromURL });
                        controlsDiv.appendChild(denyBtn);
                    } else if (user.canDraw) { 
                        const revokeBtn = document.createElement('button');
                        revokeBtn.className = 'btn btn-sm py-0 px-1 btn-outline-danger';
                        revokeBtn.innerHTML = '<i class="bi bi-slash-circle"></i> Revoke';
                        revokeBtn.title = 'Revoke drawing permission';
                        revokeBtn.style.fontSize = '0.7rem';
                        revokeBtn.onclick = () => socket.emit('update_draw_permission', { targetUserId: userId_participant, canDraw: false, sessionId: currentSessionIdFromURL });
                        controlsDiv.appendChild(revokeBtn);
                    }
                    // No direct "Allow" button without a request in this model
                    li.appendChild(controlsDiv);
                }
                participantListUl.appendChild(li);
            }
        }

        function handlePermissionUpdated(data) { 
           console.log('[SESSION PAGE] Received permission_updated event:', data);
            if (participantsList[data.userId]) {
                participantsList[data.userId].canDraw = data.canDraw;
                participantsList[data.userId].hasRequestedDraw = false; // Request is resolved
                pendingPermissionRequests[data.userId] = false; 
            } else { 
                 participantsList[data.userId] = { name: data.userName, canDraw: data.canDraw, isHost: data.isHost, hasRequestedDraw: false };
            }
            if (data.userId === localUserId) { 
                currentUserCanDraw = data.canDraw;
                if (requestDrawAccessBtn) {
                    requestDrawAccessBtn.style.display = currentUserCanDraw ? 'none' : (isCurrentUserHost ? 'none' : 'inline-block');
                    if (!currentUserCanDraw && !isCurrentUserHost) { // Re-enable if still can't draw and not host
                        requestDrawAccessBtn.disabled = false; 
                        requestDrawAccessBtn.textContent = 'Request Draw Access';
                    }
                }
                console.log(`[SESSION PAGE] My drawing permission updated to: ${currentUserCanDraw}`);
                updateDrawingToolsAccess();
            }
            updateParticipantListUI(); 
        }

        function handleDrawPermissionRequestedToHost({ requesterId, requesterName }) { 
            if (!isCurrentUserHost) return;
            console.log(`[SESSION PAGE] Received draw_permission_requested_to_host from ${requesterName} (${requesterId})`);
            pendingPermissionRequests[requesterId] = true; 
            if (participantsList[requesterId]) participantsList[requesterId].hasRequestedDraw = true;
            else participantsList[requesterId] = { name: requesterName, canDraw: false, isHost: false, hasRequestedDraw: true}; 
            updateParticipantListUI(); 
            // alert(`${requesterName} has requested drawing permission.`); // Can be annoying
        }

        function handleDrawRequestDenied({ reason }) { 
            if (localUserId !== this.targetUserId && requestDrawAccessBtn) { // targetUserId not available directly here, assume this is for me
                 console.log(`[SESSION PAGE] My drawing request was denied. Reason: ${reason}`);
                 alert(`Host denied your request to draw. ${reason || ''}`);
                 requestDrawAccessBtn.disabled = false; 
                 requestDrawAccessBtn.textContent = 'Request Draw Access';
                 requestDrawAccessBtn.style.display = (isCurrentUserHost || currentUserCanDraw) ? 'none' : 'inline-block';
                 if (participantsList[localUserId]) participantsList[localUserId].hasRequestedDraw = false;
                 pendingPermissionRequests[localUserId] = false;
            }
        }
        
        function handlePermissionRequestResolvedForHost({targetUserId, granted}) { 
            if (!isCurrentUserHost) return;
            console.log(`[SESSION PAGE] Permission request for ${targetUserId} was resolved by ME. Granted: ${granted}`);
            pendingPermissionRequests[targetUserId] = false;
            if(participantsList[targetUserId]) participantsList[targetUserId].hasRequestedDraw = false;
            updateParticipantListUI(); 
        }

        function updateDrawingToolsAccess() {
            const UIElementsToToggle = [ colorPicker, lineWidthRange, undoBtn, redoBtn, clearBoardBtn, ...toolButtons ];
            console.log(`[SESSION PAGE] updateDrawingToolsAccess. currentUserCanDraw: ${currentUserCanDraw}, isCurrentUserHost: ${isCurrentUserHost}`);

            if (currentUserCanDraw) {
                console.log("[SESSION PAGE] Drawing tools ENABLED for current user.");
                if(canvasElement) { canvasElement.style.pointerEvents = 'auto'; canvasElement.classList.remove('disabled-canvas'); }
                UIElementsToToggle.forEach(el => { if (el) el.disabled = false; });
            } else {
                console.log("[SESSION PAGE] Drawing tools DISABLED for current user.");
                if(canvasElement) { canvasElement.style.pointerEvents = 'none'; canvasElement.classList.add('disabled-canvas'); }
                UIElementsToToggle.forEach(el => { if (el) el.disabled = true; });
            }
            if(leaveSessionBtn) leaveSessionBtn.disabled = false; 
            if(saveSessionBtnOnSessionPage) {
                saveSessionBtnOnSessionPage.disabled = !isCurrentUserHost; 
                console.log(`[SESSION PAGE] Save button. isCurrentUserHost: ${isCurrentUserHost}, button disabled: ${saveSessionBtnOnSessionPage.disabled}`);
            }
            if (requestDrawAccessBtn) { 
                if (isCurrentUserHost || currentUserCanDraw) {
                    requestDrawAccessBtn.style.display = 'none';
                } else {
                    requestDrawAccessBtn.style.display = 'inline-block';
                    const myRequestStillPending = pendingPermissionRequests[localUserId] || (participantsList[localUserId] && participantsList[localUserId].hasRequestedDraw);
                    requestDrawAccessBtn.disabled = myRequestStillPending; 
                    requestDrawAccessBtn.textContent = myRequestStillPending ? 'Request Sent...' : 'Request Draw Access';
                }
            }
        }
        
        function handleClearBoardAndEmit() { 
            if (!ctx) return;
            if (!currentUserCanDraw && !isCurrentUserHost) { /* alert + return */ return; }
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
