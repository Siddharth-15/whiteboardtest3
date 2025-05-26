// js/script.js - SIMPLIFIED - Everyone Can Draw

document.addEventListener('DOMContentLoaded', function() {
    console.log("Main DOMContentLoaded Fired - AR WhiteBoard Scripts Initializing...");
    const htmlElement = document.documentElement;

    // --- localStorage Helper Functions ---
    const SESSIONS_STORAGE_KEY = 'arWhiteboardSessions';
    function getSavedSessions() { /* Your existing implementation */ }
    function saveSessionsToStorage(sessions) { /* Your existing implementation */ }

    // --- Theme Toggler & tsParticles ---
    // (Keep your existing theme and tsParticles setup code here - it's independent)
    const themeToggler = document.getElementById('themeToggler');
    const sunIcon = themeToggler?.querySelector('.icon-sun');
    const moonIcon = themeToggler?.querySelector('.icon-moon');
    let tsParticlesInstance = null;
    function getTsParticlesOptions() { /* Your existing implementation */ }
    function setupTsParticles() { /* Your existing implementation */ }
    function applyTheme(theme) { /* Your existing implementation, ensure setupTsParticles is called */ }
    if (themeToggler) { /* Your existing listener */ }
    // Apply initial theme (your existing logic)


    // --- General Page Setup ---
    const navbar = document.querySelector('.navbar.fixed-top');
    if (navbar) { /* Your existing scroll listener */ }
    const animatedElements = document.querySelectorAll('[data-animation]');
    if (animatedElements.length > 0) { /* Your existing animation observer */ }
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // --- Form Handlers ---
    const joinSessionForm = document.getElementById('joinSessionForm');
    if (joinSessionForm) { /* Your existing join form logic */ }
    const hostSessionForm = document.getElementById('hostSessionForm');
    if (hostSessionForm) { /* Your existing host form logic (HostName-RandomString ID) */ }
    const togglePasswordVisibilityButton = document.getElementById('togglePasswordVisibility');
    if (togglePasswordVisibilityButton) { /* Your existing password toggle logic */ }
    const contactPageForm = document.getElementById('contactPageForm');
    if (contactPageForm) { /* Your existing contact form logic */ }

    // === Dashboard Page Logic ===
    const sessionsContainer = document.getElementById('sessionsContainer');
    const noSessionsMessage = document.getElementById('noSessionsMessage');
    const clearAllSessionsBtn = document.getElementById('clearAllSessionsBtn');
    if (sessionsContainer && noSessionsMessage) { /* Your full existing dashboard logic */ }

    // === Session Page Specific JavaScript ===
    const canvasElement = document.getElementById('whiteboardCanvas');
    if (canvasElement) {
        console.log("[SESSION PAGE - SIMPLIFIED] Canvas element FOUND.");

        let socket;
        let localUserId = null;
        let currentSessionIdFromURL = null; 
        let myNameInSession = null;   
        
        // Simplified participantsList: { userId: 'userName' }
        let participantsList = {}; 

        const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        const activeSessionNameEl = document.getElementById('activeSessionName');
        const activeHostNameEl = document.getElementById('activeHostName'); // Will just display the original host's name
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
        // REMOVE: const requestDrawAccessBtn = document.getElementById('requestDrawAccessBtn');

        // LOCAL DRAWING STATE (Keep your existing)
        let isDrawingLocal = false; 
        let currentLocalTool = 'tool-pencil'; 
        let currentLocalLineWidth = 5;
        let currentLocalColor = '#F57C00';
        let localStartX, localStartY, localSnapshot; 
        let history = [], historyStep = -1; 
        let isDrawingForEmit = false; 
        let lastEmitX, lastEmitY;

        function initializeSessionPage() {
            console.log("[SESSION PAGE - SIMPLIFIED] initializeSessionPage CALLED");
            const urlParams = new URLSearchParams(window.location.search);
            currentSessionIdFromURL = urlParams.get('sessionId');
            const sessionNameFromURL = urlParams.get('sessionName') || 'Session';
            const hostNameFromURLParam = urlParams.get('hostName'); 
            const joinerNameFromURLParam = urlParams.get('joinerName');

            if (joinerNameFromURLParam) {
                myNameInSession = joinerNameFromURLParam;
            } else if (hostNameFromURLParam) { 
                myNameInSession = hostNameFromURLParam;
            } else { myNameInSession = `Guest_${Math.random().toString(36).substring(2, 7)}`; }
            
            if (!currentSessionIdFromURL) { alert("Error: Session ID missing..."); window.location.href = 'index.html'; return; }

            if (activeSessionNameEl) activeSessionNameEl.textContent = sessionNameFromURL;
            // Display original host name, but everyone is equal in terms of drawing
            if (activeHostNameEl) activeHostNameEl.textContent = hostNameFromURLParam || 'Host'; 
            // No need for hostParticipantEl in the list if everyone is equal

            resizeCanvas(); window.addEventListener('resize', resizeCanvas);
            if (colorPicker) { /* ... init ... */ } if (lineWidthRange && lineWidthValueEl) { /* ... init ... */ }
            addCanvasEventListeners(); addToolEventListeners();   

            socket = io('https://whiteboardtest3.onrender.com'); // Your Render URL
            socket.on('connect', () => {
                console.log('[SESSION PAGE - SIMPLIFIED] Connected. My ID:', socket.id);
                localUserId = socket.id;
                socket.emit('join_session', currentSessionIdFromURL, myNameInSession);
            });
            socket.on('connect_error', (error) => { /* ... */ });
            
            socket.on('drawing_action_broadcast', handleDrawingActionBroadcast);
            socket.on('user_joined', handleUserJoined);       
            socket.on('user_left', handleUserLeft);         
            socket.on('current_participants', handleCurrentParticipants); 
            socket.on('apply_board_state', handleApplyBoardState); 

            if (currentSessionIdFromURL && !joinerNameFromURLParam) { loadSessionById(currentSessionIdFromURL); } 
            else { history = []; historyStep = -1; saveHistory();  }
            updateUndoRedoButtons(); 
            setActiveToolById(currentLocalTool); 
            // ALL TOOLS ARE ALWAYS ENABLED NOW
            if(canvasElement) canvasElement.style.pointerEvents = 'auto';
            toolButtons.forEach(btn => btn.disabled = false);
            if(colorPicker) colorPicker.disabled = false;
            if(lineWidthRange) lineWidthRange.disabled = false;
            if(clearBoardBtn) clearBoardBtn.disabled = false;
            if(saveSessionBtnOnSessionPage) saveSessionBtnOnSessionPage.disabled = false; // Everyone can save locally
            if(undoBtn) undoBtn.disabled = historyStep <= 0; // Initial state
            if(redoBtn) redoBtn.disabled = historyStep >= history.length - 1; // Initial state


            console.log("[SESSION PAGE - SIMPLIFIED] initializeSessionPage COMPLETED.");
        }

    // js/script.js - SIMPLIFIED (Part 2)
        
        // --- LOCAL DRAWING & UI HELPERS ---
        function resizeCanvas() { /* Your full implementation */ }
        function redrawHistoryState() { /* Your full implementation */ }
        function saveHistory() { /* Your full implementation */ }
        function undo() { 
            if (historyStep > 0) { 
                historyStep--; redrawHistoryState(); updateUndoRedoButtons(); 
                if (socket && socket.connected) { // Any user can trigger board sync on their undo
                    console.log("[SESSION PAGE] Emitting board_state_sync for UNDO by user:", localUserId);
                    socket.emit('board_state_sync', { sessionId: currentSessionIdFromURL, imageDataUrl: canvasElement.toDataURL(), userId: localUserId });
                }
            } 
        }
        function redo() { 
            if (historyStep < history.length - 1) { 
                historyStep++; redrawHistoryState(); updateUndoRedoButtons(); 
                if (socket && socket.connected) { // Any user can trigger board sync on their redo
                    console.log("[SESSION PAGE] Emitting board_state_sync for REDO by user:", localUserId);
                    socket.emit('board_state_sync', { sessionId: currentSessionIdFromURL, imageDataUrl: canvasElement.toDataURL(), userId: localUserId });
                }
            } 
        }
        function updateUndoRedoButtons() { /* Your full implementation */ }
        function getCanvasCoordinates(event) { /* Your full implementation */ }
        function activateTextTool(x, y) { /* Your full implementation */ }
        function finalizeText() { 
            /* Your full implementation, but ensure it calls emit for collaborative text */
            if (!textToolInput || textToolInput.style.display === 'none' || !ctx) return;
            const text = textToolInput.value;
            // ... (your drawing logic) ...
            saveHistory(); // Local save
            if (socket && socket.connected) {
                const textData = {
                    type: 'draw_text', text: text, x: parseFloat(textToolInput.style.left) + 2, y: parseFloat(textToolInput.style.top) + 2,
                    font: textToolInput.style.font, color: textToolInput.style.color,
                    lineHeight: parseFloat(textToolInput.style.lineHeight),
                    sessionId: currentSessionIdFromURL, userId: localUserId
                };
                console.log("[SESSION PAGE] Emitting draw_text:", JSON.parse(JSON.stringify(textData)));
                socket.emit('drawing_action', textData);
            }
        }
        function loadSessionById(idToLoad) { /* Your full implementation */ }
        function setActiveToolById(toolId) { /* Your full implementation */ }
        
        function addToolEventListeners() { 
            toolButtons.forEach(button => button.addEventListener('click', function() { setActiveToolById(this.id); }));
            if (undoBtn) undoBtn.addEventListener('click', undo);
            if (redoBtn) redoBtn.addEventListener('click', redo);
            if (clearBoardBtn) clearBoardBtn.addEventListener('click', handleClearBoardAndEmit);
            if (saveSessionBtnOnSessionPage) { /* your save listener - should work for everyone */ }
            if (leaveSessionBtn) { /* your leave listener */ }
            if (textToolInput) { /* your text input listeners */ }
            // REMOVE: requestDrawAccessBtn listener
        }
        function addCanvasEventListeners() { /* Your full implementation */ }
        
        // --- DRAWING EVENT HANDLERS (Permission checks removed, everyone can draw) ---
        function handlePointerDown(event) {
            // NO currentUserCanDraw check needed here anymore
            const coords = getCanvasCoordinates(event);
            if (!coords || (event.buttons && event.buttons !== 1 && event.type.startsWith('mouse'))) return; 
            isDrawingForEmit = true; lastEmitX = coords.x; lastEmitY = coords.y;
            isDrawingLocal = true; localStartX = coords.x; localStartY = coords.y;

            if (currentLocalTool === 'tool-text') { /* ... your logic ... */ return; }
            ctx.beginPath(); ctx.moveTo(localStartX, localStartY);
            ctx.lineWidth = currentLocalLineWidth; ctx.strokeStyle = currentLocalColor; ctx.fillStyle = currentLocalColor; 
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (currentLocalTool === 'tool-pencil') { /* ... your dot drawing and emit logic ... */ }
            else if (['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool)) { /* ... your snapshot logic ... */ }
        }

        function handlePointerMove(event) {
            // NO currentUserCanDraw check needed for emitting pencil
            if (!isDrawingForEmit && currentLocalTool !== 'tool-eraser' && !isDrawingLocal) return; 
            const coords = getCanvasCoordinates(event);
            if (!coords) return;
            if (localSnapshot && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool) && isDrawingLocal) { /* ... putImageData ... */ }
            ctx.lineWidth = currentLocalLineWidth; ctx.strokeStyle = currentLocalColor; /* ... set styles ... */

            if (currentLocalTool === 'tool-pencil' && isDrawingForEmit) { /* ... your pencil segment drawing and emit logic ... */ }
            else if (currentLocalTool === 'tool-eraser' && isDrawingLocal) { // Eraser is local draw + board_state_sync on mouseup
                const bg = getComputedStyle(canvasElement).backgroundColor;
                ctx.strokeStyle = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') ? bg : '#FFFFFF'; 
                ctx.lineTo(coords.x, coords.y); ctx.stroke();
            } 
            else if (isDrawingLocal && currentLocalTool === 'tool-line') { /* ... */ }
            else if (isDrawingLocal && currentLocalTool === 'tool-rectangle') { /* ... */ }
            else if (isDrawingLocal && currentLocalTool === 'tool-circle') { /* ... */ }
        }

    // js/script.js - SIMPLIFIED (Part 3)

        function handlePointerUp(event) {
            if (!isDrawingLocal && currentLocalTool !== 'tool-text') { // Simplified check
                isDrawingForEmit = false; 
                return;
            }
            const coords = getCanvasCoordinates(event) || (isDrawingForEmit ? { x: lastEmitX, y: lastEmitY } : { x: localStartX, y: localStartY });

            if (isDrawingLocal && ['tool-line', 'tool-rectangle', 'tool-circle'].includes(currentLocalTool)) {
                // Everyone can draw, so always emit if connected
                let actionData = { /* ... create actionData for shapes ... */ };
                 if (currentLocalTool === 'tool-line') actionData.type = 'draw_shape_line';
                 else if (currentLocalTool === 'tool-rectangle') actionData.type = 'draw_shape_rect';
                 else if (currentLocalTool === 'tool-circle') { /* ... set radius ... */ actionData.type = 'draw_shape_circle'; }
                
                if (socket && socket.connected) {
                     console.log("[SESSION PAGE] Emitting shape action:", JSON.parse(JSON.stringify(actionData)));
                     socket.emit('drawing_action', actionData);
                }
            }
            
            if (currentLocalTool === 'tool-eraser' && isDrawingLocal && socket && socket.connected) {
                console.log("[SESSION PAGE] User emitting board_state_sync for ERASER action completion");
                socket.emit('board_state_sync', { sessionId: currentSessionIdFromURL, imageDataUrl: canvasElement.toDataURL(), userId: localUserId });
            }
            
            isDrawingForEmit = false; isDrawingLocal = false; localSnapshot = null;
            if (currentLocalTool !== 'tool-text') { saveHistory(); }
        }

        // --- SOCKET.IO EVENT HANDLERS ---
        function handleDrawingActionBroadcast(data) { /* Your full switch statement implementation */ }
        
        function handleApplyBoardState({ imageDataUrl, initiatorId }) { 
            if (!ctx) return; 
            // Don't re-apply if I was the one who initiated this sync
            if (initiatorId === localUserId) {
                console.log("[SESSION PAGE] apply_board_state skipped for initiator.");
                return;
            }
            console.log("[SESSION PAGE] Received board_state_sync from another user. Applying new state.");
            const img = new Image();
            img.onload = () => { /* ... clear and drawImage ... */ history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons(); };
            img.onerror = () => console.error("Failed to load image for board state sync");
            img.src = imageDataUrl;
        }

        function handleCurrentParticipants(currentUsersArray) {
            console.log('[SESSION PAGE - SIMPLIFIED] Received current_participants:', JSON.parse(JSON.stringify(currentUsersArray)));
            participantsList = {}; 
            let serverDesignatedHostName = hostNameFromURL; // From URL initially
            let originalHostFoundInList = false;

            currentUsersArray.forEach(user => {
                participantsList[user.userId] = user.userName; // Just store name
                if (user.userName === hostNameFromURL) { // Simple check if this user is the original host by name
                    originalHostFoundInList = true;
                    serverDesignatedHostName = user.userName;
                }
                if (user.userId === localUserId) {
                     myNameInSession = user.userName; // Update my name from server
                }
            });
            // Update navbar host display
            if (activeHostNameEl) activeHostNameEl.textContent = serverDesignatedHostName;
            updateParticipantListUI(); 
            // No need to call updateDrawingToolsAccess as tools are always enabled
            console.log('[SESSION PAGE - SIMPLIFIED] handleCurrentParticipants finished. participantsList:', JSON.parse(JSON.stringify(participantsList)));
        }

        function handleUserJoined(userData) { 
            console.log('[SESSION PAGE - SIMPLIFIED] User joined:', userData);
            participantsList[userData.userId] = userData.userName; // Just store name
            // If a user joins with the original hostNameFromURL, update display
            if (userData.userName === hostNameFromURL && activeHostNameEl) {
                 activeHostNameEl.textContent = userData.userName;
            }
            updateParticipantListUI(); 
        }
        
        function handleUserLeft(data) { 
            console.log('[SESSION PAGE - SIMPLIFIED] User left:', data);
            if (participantsList[data.userId]) { delete participantsList[data.userId]; }
            updateParticipantListUI();
        }

        // REMOVE: handlePermissionUpdated, handleDrawPermissionRequestedToHost, 
        // handleDrawRequestDenied, handlePermissionRequestResolvedForHost, handleHostLeftSession

        function updateParticipantListUI() { // SIMPLIFIED
            if (!participantListUl) return;
            console.log(`[SESSION PAGE - SIMPLIFIED] updateParticipantListUI. participantsList:`, JSON.parse(JSON.stringify(participantsList)));
            participantListUl.innerHTML = ''; 

            // Display original host name (from URL param) if still relevant or found
            let displayHostName = hostNameFromURL;
            Object.values(participantsList).forEach(name => {
                if (name === hostNameFromURL) displayHostName = name; // Confirm from current list
            });

            const hostLiDisplay = document.createElement('li');
            hostLiDisplay.className = 'list-group-item bg-transparent px-1 py-1 fw-bold';
            hostLiDisplay.textContent = `Host: ${displayHostName}`; // Just display name, no special "You" or controls
            participantListUl.appendChild(hostLiDisplay);

            // Display all other participants
            for (const userId in participantsList) {
                const userName = participantsList[userId];
                // Avoid re-listing if this user was considered the "displayHostName" and it's not "You"
                if (userName === displayHostName && !(userId === localUserId && myNameInSession === displayHostName) ) {
                    // This logic is to prevent listing the "Host" twice if they are in the list
                    // but not the current user. If the current user IS the host, they get listed once.
                    let alreadyListedAsHost = false;
                    participantListUl.querySelectorAll('li').forEach(liItem => {
                        if (liItem.textContent.includes(`Host: ${userName}`) && !liItem.textContent.includes('(You)')) {
                            alreadyListedAsHost = true;
                        }
                    });
                    if(alreadyListedAsHost) continue;
                }


                const li = document.createElement('li');
                li.className = 'list-group-item bg-transparent px-1 py-1';
                li.textContent = `${userName}${userId === localUserId ? ' (You)' : ''}`;
                // No permission buttons or icons needed
                participantListUl.appendChild(li);
            }
        }

    // js/script.js - SIMPLIFIED (Part 4)

        function updateDrawingToolsAccess() { // SIMPLIFIED - Tools always enabled
            console.log("[SESSION PAGE - SIMPLIFIED] updateDrawingToolsAccess called - all tools should be enabled.");
            const UIElementsToToggle = [ colorPicker, lineWidthRange, undoBtn, redoBtn, clearBoardBtn, ...toolButtons ];
            
            if(canvasElement) { 
                canvasElement.style.pointerEvents = 'auto'; 
                canvasElement.classList.remove('disabled-canvas'); 
            }
            UIElementsToToggle.forEach(el => { if (el) el.disabled = false; });
            
            if(leaveSessionBtn) leaveSessionBtn.disabled = false; 
            if(saveSessionBtnOnSessionPage) {
                saveSessionBtnOnSessionPage.disabled = false; // Everyone can save locally
                console.log(`[SESSION PAGE - SIMPLIFIED] Save button enabled for everyone.`);
            }
            // REMOVE: requestDrawAccessBtn logic
        }
        
        function handleClearBoardAndEmit() { 
            if (!ctx) return;
            // No client-side permission check, server will handle if necessary (but currently doesn't restrict clear)
            if (confirm("Are you sure you want to clear the entire board for everyone? This cannot be undone.")) {
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                history = []; historyStep = -1; saveHistory(); updateUndoRedoButtons(); 
                const clearData = { type: 'clear_board', sessionId: currentSessionIdFromURL, userId: localUserId };
                if (socket && socket.connected) socket.emit('drawing_action', clearData);
                console.log("[SESSION PAGE - SIMPLIFIED] Board cleared locally and clear action emitted.");
            }
        }

        initializeSessionPage(); 
    } // End of "if (canvasElement)"
    
    console.log("AR WhiteBoard Scripts Fully Initialized! (End of DOMContentLoaded)");
}); // End of DOMContentLoaded
