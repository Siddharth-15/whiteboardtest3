// server.js - SIMPLIFIED - Everyone can draw - FOR RENDER.COM (HTTP ONLY)

const express = require('express');
const http = require('http'); 
const socketIo = require('socket.io');
const cors = require('cors');

const PORT = process.env.PORT || 3001; 

const app = express();
const server = http.createServer(app); 

const io = socketIo(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('AR Whiteboard Server: Ready for connections (Simplified - All Draw)!');
});

// Simplified rooms structure: { sessionId: { users: { socketId: 'userName' } } }
const rooms = {}; 

io.on('connection', (socket) => {
    console.log(`[SERVER] A user connected: ${socket.id}`);
    let currentSessionId = null; 
    let currentUserName = null;

    socket.on('join_session', (sessionId, userName) => { 
        socket.join(sessionId);
        currentSessionId = sessionId; 
        currentUserName = userName || `User_${socket.id.substring(0,5)}`;

        if (!rooms[sessionId]) {
            rooms[sessionId] = { users: {} };
            console.log(`[SERVER] Session ${sessionId} created by ${currentUserName} (${socket.id})`);
        }

        rooms[sessionId].users[socket.id] = currentUserName; // Just store name
        console.log(`[SERVER] User ${currentUserName} (${socket.id}) joined session: ${sessionId}.`);

        // Notify OTHERS about this new user
        socket.to(sessionId).emit('user_joined', {
            userId: socket.id,
            userName: currentUserName
            // No need to send canDraw or isHost
        });

        // Send the CURRENT list of ALL participants to THIS user
        const participantsArray = Object.entries(rooms[sessionId].users).map(([id, name]) => ({
            userId: id,
            userName: name
            // No need to send canDraw or isHost
        }));
        socket.emit('current_participants', participantsArray);
        
        console.log(`[SERVER] Current users in session ${sessionId}:`, JSON.stringify(rooms[sessionId].users));
    });

    socket.on('drawing_action', (data) => { // No permission check needed here anymore
        if (data.sessionId && data.userId && rooms[data.sessionId] && rooms[data.sessionId].users[data.userId]) { // Check if sender is known
            socket.to(data.sessionId).emit('drawing_action_broadcast', data);
            // console.log(`[SERVER] Drawing action from ${data.userId} in ${data.sessionId} broadcasted.`);
        } else {
            console.warn('[SERVER] Received drawing_action with invalid session/user data:', data);
        }
    });

    // For Undo/Erase/Text sync by any user (since everyone can draw)
    socket.on('board_state_sync', ({ sessionId, imageDataUrl, userId }) => { // Added userId to know who initiated
        if (rooms[sessionId] && rooms[sessionId].users[socket.id]) { // Check if sender is in room
            console.log(`[SERVER] User ${socket.id} initiated board_state_sync for session ${sessionId}`);
            socket.to(sessionId).emit('apply_board_state', { imageDataUrl, initiatorId: socket.id }); // Broadcast to OTHERS
        } else {
            console.warn(`[SERVER] Unauthorized board_state_sync attempt from ${socket.id} for session ${sessionId}.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[SERVER] User disconnected: ${socket.id} (Last known name: ${currentUserName || 'N/A'}, Session: ${currentSessionId || 'N/A'})`);
        if (currentSessionId && rooms[currentSessionId] && rooms[currentSessionId].users[socket.id]) {
            const disconnectedUserName = rooms[currentSessionId].users[socket.id]; // Get name before deleting
            delete rooms[currentSessionId].users[socket.id];
            
            socket.to(currentSessionId).emit('user_left', { 
                userId: socket.id, 
                userName: disconnectedUserName 
            });
            console.log(`[SERVER] User ${socket.id} (Name: ${disconnectedUserName}) removed from session: ${currentSessionId}`);

            if (Object.keys(rooms[currentSessionId].users).length === 0) {
                delete rooms[currentSessionId];
                console.log(`[SERVER] Session ${currentSessionId} is now empty and removed.`);
            } else {
                console.log(`[SERVER] Current users in session ${currentSessionId}:`, JSON.stringify(rooms[currentSessionId].users));
            }
        } else {
            console.log(`[SERVER] User ${socket.id} disconnected without being fully tracked in a session room.`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`AR Whiteboard Server (HTTP - Simplified, All Draw) listening on port ${PORT}`);
});
