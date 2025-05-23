// ar-whiteboard-server/server.js

const express = require('express');
const https = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');

const PORT = process.env.PORT || 3001;

const app = express();

const options = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
};

const server = https.createServer(options, app);

const io = socketIo(server, {
    cors: {
        origin: "*", // Keep as "*" for easy local dev with various frontend ports
        methods: ["GET", "POST"]
    }
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('AR Whiteboard Server is running over HTTPS!');
});

// Store active rooms/sessions and users in them
// This is an in-memory store. For a production app, you'd use a database (e.g., Redis)
const rooms = {}; // { sessionId: [socketId1, socketId2, ...], ... }

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Event for a host or viewer to join a session (room)
    socket.on('join_session', (sessionId) => {
        socket.join(sessionId); // Socket.IO room feature
        console.log(`User ${socket.id} joined session: ${sessionId}`);

        // Add user to our custom rooms tracking (optional, but can be useful)
        if (!rooms[sessionId]) {
            rooms[sessionId] = [];
        }
        // Add only if not already in (though socket.join handles multiple joins gracefully)
        if (!rooms[sessionId].includes(socket.id)) {
            rooms[sessionId].push(socket.id);
        }

        // Notify others in the room that a new user joined (optional)
        socket.to(sessionId).emit('user_joined', { userId: socket.id, sessionId: sessionId });

        // Send current list of users in room back to the new user (optional)
        // socket.emit('room_users', rooms[sessionId]);
        console.log(`Current users in session ${sessionId}:`, rooms[sessionId]);
    });

    // Placeholder for drawing data event (we'll implement this in detail later)
    // socket.on('drawing_action', (data) => {
    //     // 'data' would include { sessionId, actionType, x, y, color, lineWidth, etc. }
    //     if (data.sessionId) {
    //         // Broadcast to everyone in the same session room EXCEPT the sender
    //         socket.to(data.sessionId).emit('drawing_action_broadcast', data);
    //         // console.log(`Drawing action from ${socket.id} in session ${data.sessionId}:`, data.actionType);
    //     }
    // });


    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Clean up user from any rooms they were in
        for (const sessionId in rooms) {
            const index = rooms[sessionId].indexOf(socket.id);
            if (index !== -1) {
                rooms[sessionId].splice(index, 1);
                console.log(`User ${socket.id} removed from session: ${sessionId}`);
                // If room is empty, delete it (optional)
                if (rooms[sessionId].length === 0) {
                    delete rooms[sessionId];
                    console.log(`Session ${sessionId} is now empty and removed.`);
                } else {
                    // Notify others in the room that a user left (optional)
                    socket.to(sessionId).emit('user_left', { userId: socket.id, sessionId: sessionId });
                    console.log(`Current users in session ${sessionId}:`, rooms[sessionId]);
                }
                break; // Assuming user can only be in one room at a time for this simple model
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`AR Whiteboard HTTPS Server listening on port ${PORT}`);
    console.log(`Access it at: https://localhost:${PORT}`);
});
