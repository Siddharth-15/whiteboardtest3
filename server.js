// server.js - CORRECTED VERSION FOR RENDER.COM (HTTP ONLY)

const express = require('express');
const http = require('http'); // Use Node.js's built-in http module
// const fs = require('fs'); // Not needed for certificates anymore
// const path = require('path'); // Not needed for certificates anymore
const socketIo = require('socket.io');
const cors = require('cors');

const PORT = process.env.PORT || 3001; // Render will set process.env.PORT

const app = express();
const server = http.createServer(app); // Create a plain HTTP server

const io = socketIo(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('AR Whiteboard Server is running (on Render via HTTP)!'); // Updated message
});

// Store active rooms/sessions and users in them
const rooms = {}; // Your existing rooms object - ensure this matches your latest logic

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    let currentSessionId = null; 
    let currentUserName = null; 

    socket.on('join_session', (sessionId, userName) => { // Make sure this matches your client-side emit
        socket.join(sessionId);
        currentSessionId = sessionId;
        currentUserName = userName || `User_${socket.id.substring(0,5)}`;
        console.log(`User ${socket.id} (Name: ${currentUserName}) joined session: ${sessionId}`);

        if (!rooms[sessionId]) {
            // Ensure your rooms structure here matches what drawing_action and disconnect expect
            // For example, if you used rooms[sessionId] = { users: {} } previously:
             rooms[sessionId] = { users: {} }; // Or an array if that's what you had: rooms[sessionId] = [];
        }
        // Adjust this based on your rooms structure:
        if (rooms[sessionId].users) { // If using the { users: {} } structure
            rooms[sessionId].users[socket.id] = currentUserName;
        } else if (Array.isArray(rooms[sessionId])) { // If using an array of socket IDs
            if (!rooms[sessionId].includes(socket.id)) {
                rooms[sessionId].push(socket.id); // You'll need to adjust how userName is handled
            }
        }


        // Emit with userName
        socket.to(sessionId).emit('user_joined', { 
            userId: socket.id, 
            userName: currentUserName, // Send userName
            sessionId: sessionId 
        });

        // Send current participants - ensure this logic is correct for your rooms structure
        if (rooms[sessionId].users) {
            socket.emit('current_participants', Object.entries(rooms[sessionId].users).map(([id, name]) => ({userId: id, userName: name})));
        }
        
        console.log(`Current users in session ${sessionId}:`, rooms[sessionId].users || rooms[sessionId]);
    });

    // Your drawing_action needs to be the one that works with your current client
    socket.on('drawing_action', (data) => {
        // Ensure data.userId exists and rooms[data.sessionId].users[socket.id] is valid if using that check
        if (data.sessionId && data.userId && rooms[data.sessionId] /* && rooms[data.sessionId].users && rooms[data.sessionId].users[socket.id] */ ) {
            socket.to(data.sessionId).emit('drawing_action_broadcast', data);
        } else {
            console.warn('Drawing action denied or bad data:', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id} (Name: ${currentUserName})`);
        if (currentSessionId && rooms[currentSessionId]) {
            let userWasInRoom = false;
            if (rooms[currentSessionId].users && rooms[currentSessionId].users[socket.id]) {
                delete rooms[currentSessionId].users[socket.id];
                userWasInRoom = true;
            } else if (Array.isArray(rooms[currentSessionId])) {
                const index = rooms[currentSessionId].indexOf(socket.id);
                if (index !== -1) {
                    rooms[currentSessionId].splice(index, 1);
                    userWasInRoom = true;
                }
            }

            if (userWasInRoom) {
                socket.to(currentSessionId).emit('user_left', { userId: socket.id, userName: currentUserName, sessionId: currentSessionId });
                console.log(`User ${socket.id} (Name: ${currentUserName}) removed from session: ${currentSessionId}`);

                const remainingUsersCount = rooms[currentSessionId].users ? Object.keys(rooms[currentSessionId].users).length : rooms[currentSessionId].length;
                if (remainingUsersCount === 0) {
                    delete rooms[currentSessionId];
                    console.log(`Session ${currentSessionId} is now empty and removed.`);
                } else {
                    console.log(`Current users in session ${currentSessionId}:`, rooms[currentSessionId].users || rooms[currentSessionId]);
                }
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`AR Whiteboard (HTTP) Server listening on port ${PORT}`);
    // No need for "Access it at https://localhost..." as Render handles public access
});
