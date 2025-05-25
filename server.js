// server.js - UPDATED & INTEGRATED WITH PERMISSIONS - FOR RENDER.COM (HTTP ONLY)

const express = require('express');
const http = require('http'); // Use Node.js's built-in http module
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
    res.send('AR Whiteboard Server is running (on Render via HTTP with Permissions)!'); // Updated message
});

// Store active rooms/sessions and users in them
// New structure: { sessionId: { users: { socketId: { name: 'userName', canDraw: boolean, isHost: boolean } }, hostId: 'socketIdOfHost' } }
const rooms = {}; 

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    let currentSessionId = null; 
    let currentUserName = null; 

    socket.on('join_session', (sessionId, userName) => { // Client sends sessionId and their chosen userName
        socket.join(sessionId);
        currentSessionId = sessionId;
        currentUserName = userName || `User_${socket.id.substring(0,5)}`;

        let isHost = false;
        if (!rooms[sessionId]) {
            // This is the first user in this session, they become the host
            rooms[sessionId] = { 
                users: {}, 
                hostId: socket.id // Store the host's socket ID
            };
            isHost = true;
        }

        // Add/update user in the room with their details
        rooms[sessionId].users[socket.id] = {
            name: currentUserName,
            canDraw: isHost, // Host can draw by default, others cannot initially
            isHost: isHost
        };

        console.log(`User ${socket.id} (Name: ${currentUserName}, Host: ${isHost}, CanDraw: ${rooms[sessionId].users[socket.id].canDraw}) joined session: ${sessionId}`);

        // Notify OTHERS in the room about this new user (with their permissions)
        const joinedUserDetails = {
            userId: socket.id,
            userName: currentUserName,
            canDraw: rooms[sessionId].users[socket.id].canDraw,
            isHost: isHost,
            sessionId: sessionId // Though not strictly needed for this event type
        };
        socket.to(sessionId).emit('user_joined', joinedUserDetails);

        // Send the CURRENT list of ALL participants (with permissions) to the NEWLY JOINED user
        const participantsArray = Object.entries(rooms[sessionId].users).map(([id, details]) => ({
            userId: id,
            userName: details.name,
            canDraw: details.canDraw,
            isHost: details.isHost // Client needs to know who the host is
        }));
        socket.emit('current_participants', participantsArray);
        
        console.log(`Current users in session ${sessionId}:`, rooms[sessionId].users);
    });

    socket.on('drawing_action', (data) => {
        if (data.sessionId && data.userId && rooms[data.sessionId] && rooms[data.sessionId].users[socket.id]) {
            // SERVER-SIDE PERMISSION CHECK: Only broadcast if sender has permission
            if (rooms[data.sessionId].users[socket.id].canDraw) {
                socket.to(data.sessionId).emit('drawing_action_broadcast', data);
                // console.log(`Drawing action from ${data.userId} in ${data.sessionId} broadcasted.`);
            } else {
                console.warn(`User ${socket.id} (Name: ${rooms[data.sessionId].users[socket.id].name}) tried to draw without permission in session ${data.sessionId}.`);
                // Optionally, send a message back to this user: 
                // socket.emit('action_denied', { action: 'draw', reason: 'You do not have permission to draw.'});
            }
        } else {
            console.warn('Received drawing_action with invalid session/user data, or user not in room state:', data);
        }
    });

    // New event handler for the host to update drawing permissions
    socket.on('update_draw_permission', ({ targetUserId, canDraw, sessionId }) => {
        // Validate session and that the requester is the host
        if (currentSessionId === sessionId && 
            rooms[sessionId] && 
            rooms[sessionId].hostId === socket.id) { 
            
            if (rooms[sessionId].users[targetUserId]) {
                // Don't allow revoking host's own permission via this event (host always can draw)
                if (targetUserId === rooms[sessionId].hostId && !canDraw) {
                    console.warn(`Host ${socket.id} attempted to revoke their own drawing permission. Denied.`);
                    // Optionally, send feedback to host: socket.emit('action_denied', {action: 'revoke_self', reason: 'Host cannot revoke own permission.'})
                    return;
                }

                rooms[sessionId].users[targetUserId].canDraw = canDraw;
                console.log(`Permission update for ${targetUserId} (Name: ${rooms[sessionId].users[targetUserId].name}) in session ${sessionId}: canDraw = ${canDraw} by host ${socket.id}`);
                
                // Broadcast the permission update to everyone in the room
                io.to(sessionId).emit('permission_updated', {
                    userId: targetUserId,
                    userName: rooms[sessionId].users[targetUserId].name, // Include name for easier client update
                    canDraw: canDraw,
                    isHost: rooms[sessionId].users[targetUserId].isHost, // Send isHost too
                    updatedByHostId: socket.id 
                });
            } else {
                console.warn(`Host ${socket.id} tried to update permission for non-existent user ${targetUserId} in session ${sessionId}`);
            }
        } else {
            console.warn(`Unauthorized attempt to update permission by ${socket.id} (not host or invalid session) for session ${sessionId}. Requester's actual host status: ${rooms[currentSessionId]?.users[socket.id]?.isHost}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id} (Last known name: ${currentUserName})`);
        if (currentSessionId && rooms[currentSessionId] && rooms[currentSessionId].users[socket.id]) {
            const disconnectedUser = rooms[currentSessionId].users[socket.id];
            const wasHost = disconnectedUser.isHost;
            
            delete rooms[currentSessionId].users[socket.id];
            
            socket.to(currentSessionId).emit('user_left', { 
                userId: socket.id, 
                userName: disconnectedUser.name, // Use the stored name
                sessionId: currentSessionId 
            });
            console.log(`User ${socket.id} (Name: ${disconnectedUser.name}) removed from session: ${currentSessionId}`);

            if (Object.keys(rooms[currentSessionId].users).length === 0) {
                // If room is empty, delete it
                delete rooms[currentSessionId];
                console.log(`Session ${currentSessionId} is now empty and removed.`);
            } else {
                // If the host disconnected
                if (wasHost) {
                    rooms[currentSessionId].hostId = null; // Mark that the original host is gone
                    console.log(`Host (User ${socket.id}, Name: ${disconnectedUser.name}) left session ${currentSessionId}. No active host to manage permissions unless re-assigned.`);
                    // Optionally, broadcast this specific event to clients so they can update UI
                    // io.to(currentSessionId).emit('host_left_session', { sessionId: currentSessionId });
                }
                console.log(`Current users in session ${currentSessionId}:`, rooms[currentSessionId].users);
            }
        } else {
            // This can happen if a user disconnects before successfully joining a room
            console.log(`User ${socket.id} disconnected without being fully in a tracked session.`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`AR Whiteboard (HTTP with Permissions) Server listening on port ${PORT}`);
});
