// server.js - For Render.com (HTTP) with Participant Names & Robust Room Logic

const express = require('express');
const http = require('http'); // Use Node.js's built-in http module
const socketIo = require('socket.io');
const cors = require('cors');
// const path = require('path'); // Only if you were serving static files from server, not needed now
// const fs = require('fs');   // Not needed as we are not handling HTTPS certs here

const PORT = process.env.PORT || 3001; // Render will set process.env.PORT

const app = express();
const server = http.createServer(app); // Create a plain HTTP server

const io = socketIo(server, {
    cors: {
        origin: "*", // Allows all origins. For production, restrict to your Netlify domain.
        methods: ["GET", "POST"]
    }
});

app.use(cors()); // Enable CORS for any potential HTTP routes (though we mainly use WebSockets)

// Simple root route to confirm the server is running
app.get('/', (req, res) => {
    res.send('AR Whiteboard Backend Server is running (on Render via HTTP)!');
});

// In-memory store for active rooms and users.
// Structure: { sessionId: { users: { socketId1: userName1, socketId2: userName2, ... } }, ... }
const rooms = {};

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    let currentJoinedSessionId = null; // To track which session this socket is part of
    let currentJoinedUserName = null;  // To track the name of this user for this session

    // Event for a user to join a session (room)
    socket.on('join_session', (sessionId, userName) => {
        if (!sessionId) {
            console.warn(`User ${socket.id} tried to join without a sessionId.`);
            // Optionally, emit an error back to the client
            // socket.emit('join_error', 'Session ID is required.');
            return;
        }

        socket.join(sessionId); // Socket.IO joins the room
        currentJoinedSessionId = sessionId;
        currentJoinedUserName = userName || `Guest_${socket.id.substring(0, 5)}`; // Default name if not provided

        console.log(`User ${socket.id} (Name: ${currentJoinedUserName}) joined session: ${currentJoinedSessionId}`);

        // Initialize room if it doesn't exist
        if (!rooms[currentJoinedSessionId]) {
            rooms[currentJoinedSessionId] = {
                users: {}
                // Later, you might add: drawingHistory: [] or other session-specific data
            };
        }

        // Add user to our custom room tracking
        rooms[currentJoinedSessionId].users[socket.id] = currentJoinedUserName;

        // Notify other users in the same room that a new user has joined
        socket.to(currentJoinedSessionId).emit('user_joined', {
            userId: socket.id,
            userName: currentJoinedUserName,
            sessionId: currentJoinedSessionId
        });

        // Send the current list of all participants in the room back to the newly joined user
        // This ensures the new user knows who is already there.
        const participantsArray = Object.entries(rooms[currentJoinedSessionId].users).map(([id, name]) => ({
            userId: id,
            userName: name
        }));
        socket.emit('current_participants', participantsArray);

        console.log(`Users in session ${currentJoinedSessionId}:`, rooms[currentJoinedSessionId].users);
    });

    // Event for drawing actions
    socket.on('drawing_action', (data) => {
        // Basic validation: data should have sessionId and originated from a user in that session
        if (data && data.sessionId && data.userId &&
            rooms[data.sessionId] && rooms[data.sessionId].users[socket.id]) {
            
            // Broadcast the drawing action to all other clients in the same session room
            socket.to(data.sessionId).emit('drawing_action_broadcast', data);
            // console.log(`Drawing action from ${data.userId} in session ${data.sessionId}, type: ${data.type}`);
        } else {
            console.warn(`Invalid drawing_action or user not in session:`, data, `Socket: ${socket.id}, Expected session: ${currentJoinedSessionId}`);
        }
    });

    // Event when a user disconnects
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id} (Name: ${currentJoinedUserName}, Session: ${currentJoinedSessionId})`);

        if (currentJoinedSessionId && rooms[currentJoinedSessionId] && rooms[currentJoinedSessionId].users[socket.id]) {
            // Remove user from our custom room tracking
            delete rooms[currentJoinedSessionId].users[socket.id];

            // Notify other users in the room that this user has left
            socket.to(currentJoinedSessionId).emit('user_left', {
                userId: socket.id,
                userName: currentJoinedUserName, // Send the name of the user who left
                sessionId: currentJoinedSessionId
            });

            console.log(`User ${socket.id} (Name: ${currentJoinedUserName}) removed from session: ${currentJoinedSessionId}`);

            // If the room becomes empty, delete it to free up memory
            if (Object.keys(rooms[currentJoinedSessionId].users).length === 0) {
                delete rooms[currentJoinedSessionId];
                console.log(`Session ${currentJoinedSessionId} is now empty and removed.`);
            } else {
                console.log(`Remaining users in session ${currentJoinedSessionId}:`, rooms[currentJoinedSessionId].users);
            }
        }
        // Clear the stored session ID and name for this disconnected socket
        currentJoinedSessionId = null;
        currentJoinedUserName = null;
    });
});

// Start the HTTP server
server.listen(PORT, () => {
    console.log(`AR Whiteboard (HTTP) Server listening on port ${PORT}`);
    // For local testing, you'd access via http://localhost:3001 (if PORT is 3001)
    // On Render, it will listen on the port Render assigns via process.env.PORT
});
