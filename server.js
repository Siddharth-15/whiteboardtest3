// server.js - FINAL CONSOLIDATED VERSION with Request Access & Sync for Render.com (HTTP ONLY)

const express = require('express');
const http = require('http'); // Use Node.js's built-in http module
const socketIo = require('socket.io');
const cors = require('cors');
// const path = require('path'); // Not strictly needed for this server logic

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
    res.send('AR Whiteboard Server: Ready for connections (Permissions & Sync Enabled)!');
});

// Enhanced rooms structure: 
// { sessionId: { 
//     users: { socketId: { name: 'userName', canDraw: boolean, isHost: boolean } }, 
//     hostId: 'socketIdOfHost' 
//   } 
// }
const rooms = {}; 

io.on('connection', (socket) => {
    console.log(`[SERVER] A user connected: ${socket.id}`);
    let currentSessionId = null; 
    let currentUserName = null; // Store name for richer disconnect/event logs

    socket.on('join_session', (sessionId, userName) => { 
        socket.join(sessionId);
        currentSessionId = sessionId; // Associate this socket with the session ID
        currentUserName = userName || `User_${socket.id.substring(0,5)}`;

        let isHost = false;
        if (!rooms[sessionId]) {
            // This is the first user in this session, they become the host
            rooms[sessionId] = { 
                users: {}, 
                hostId: socket.id // Store the host's socket ID
            };
            isHost = true;
            console.log(`[SERVER] Session ${sessionId} created by host ${currentUserName} (${socket.id})`);
        }

        // Add/update user in the room with their details
        rooms[sessionId].users[socket.id] = {
            name: currentUserName,
            canDraw: isHost, // Host can draw by default, others cannot initially
            isHost: isHost
        };

        console.log(`[SERVER] User ${currentUserName} (${socket.id}) joined session: ${sessionId}. IsHost: ${isHost}, CanDraw: ${rooms[sessionId].users[socket.id].canDraw}`);

        // Notify OTHERS in the room about this new user (with their permissions)
        const joinedUserDetails = {
            userId: socket.id,
            userName: currentUserName,
            canDraw: rooms[sessionId].users[socket.id].canDraw,
            isHost: isHost
        };
        socket.to(sessionId).emit('user_joined', joinedUserDetails);

        // Send the CURRENT list of ALL participants (with permissions) to the NEWLY JOINED user
        const participantsArray = Object.entries(rooms[sessionId].users).map(([id, details]) => ({
            userId: id,
            userName: details.name,
            canDraw: details.canDraw,
            isHost: details.isHost
        }));
        socket.emit('current_participants', participantsArray);
        
        console.log(`[SERVER] Current users in session ${sessionId}:`, JSON.stringify(rooms[sessionId].users));
    });

    socket.on('drawing_action', (data) => {
        if (data.sessionId && data.userId && 
            rooms[data.sessionId] && 
            rooms[data.sessionId].users[socket.id]) { // Check if sender is known in room
            
            if (rooms[data.sessionId].users[socket.id].canDraw) {
                socket.to(data.sessionId).emit('drawing_action_broadcast', data);
                // console.log(`[SERVER] Drawing action from ${data.userId} in ${data.sessionId} broadcasted.`);
            } else {
                console.warn(`[SERVER] User ${socket.id} (Name: ${rooms[data.sessionId].users[socket.id].name}) tried to draw without permission in session ${data.sessionId}. Action denied.`);
                socket.emit('action_denied', { action: 'draw', reason: 'You do not have permission to draw.'}); // Notify user
            }
        } else {
            console.warn('[SERVER] Received drawing_action with invalid session/user data, or user not in room state:', data);
        }
    });

    // For Host-controlled explicit Allow/Revoke (still useful if host wants to override a request state)
    socket.on('update_draw_permission', ({ targetUserId, canDraw, sessionId }) => {
        if (currentSessionId === sessionId && 
            rooms[sessionId] && 
            rooms[sessionId].hostId === socket.id) { // Only host can change permissions
            
            if (rooms[sessionId].users[targetUserId]) {
                // Host cannot revoke their own permission via this specific event
                if (targetUserId === rooms[sessionId].hostId && !canDraw) {
                    console.warn(`[SERVER] Host ${socket.id} attempted to revoke their own drawing permission via 'update_draw_permission'. Denied.`);
                    socket.emit('action_denied', {action: 'revoke_self_permission', reason: 'Host cannot revoke own drawing permission.'});
                    return;
                }

                rooms[sessionId].users[targetUserId].canDraw = canDraw;
                console.log(`[SERVER] Permission update for ${targetUserId} (Name: ${rooms[sessionId].users[targetUserId].name}) in session ${sessionId}: canDraw set to ${canDraw} by host ${socket.id}`);
                
                io.to(sessionId).emit('permission_updated', {
                    userId: targetUserId,
                    userName: rooms[sessionId].users[targetUserId].name,
                    canDraw: canDraw,
                    isHost: rooms[sessionId].users[targetUserId].isHost,
                    updatedByHostId: socket.id
                });
            } else {
                console.warn(`[SERVER] Host ${socket.id} tried to update permission for non-existent user ${targetUserId} in session ${sessionId}`);
            }
        } else {
            console.warn(`[SERVER] Unauthorized attempt to update permission by ${socket.id} or invalid session for session ${sessionId}.`);
        }
    });

    // For Viewer Requesting Permission
    socket.on('request_draw_permission', ({sessionId}) => { // Expect object with sessionId
        if (rooms[sessionId] && rooms[sessionId].users[socket.id] && rooms[sessionId].hostId) {
            const requester = rooms[sessionId].users[socket.id];
            // Ensure requester is not the host and doesn't already have permission
            if (requester.isHost || requester.canDraw) {
                console.log(`[SERVER] User ${requester.name} (${socket.id}) sent request_draw_permission but is host or can already draw. Ignoring.`);
                return;
            }
            console.log(`[SERVER] User ${requester.name} (${socket.id}) requested draw permission for session ${sessionId}. Notifying host ${rooms[sessionId].hostId}.`);
            io.to(rooms[sessionId].hostId).emit('draw_permission_requested_to_host', {
                requesterId: socket.id,
                requesterName: requester.name,
                sessionId: sessionId
            });
        } else {
            console.warn(`[SERVER] Invalid request_draw_permission from ${socket.id} for session ${sessionId}`);
        }
    });

    socket.on('approve_draw_permission', ({ targetUserId, sessionId }) => {
        if (rooms[sessionId] && rooms[sessionId].hostId === socket.id && rooms[sessionId].users[targetUserId]) {
            rooms[sessionId].users[targetUserId].canDraw = true;
            console.log(`[SERVER] Host ${socket.id} APPROVED draw permission for ${targetUserId} in session ${sessionId}`);
            io.to(sessionId).emit('permission_updated', {
                userId: targetUserId,
                userName: rooms[sessionId].users[targetUserId].name,
                canDraw: true,
                isHost: rooms[sessionId].users[targetUserId].isHost,
                updatedByHostId: socket.id
            });
            io.to(rooms[sessionId].hostId).emit('permission_request_resolved_for_host', { targetUserId: targetUserId, granted: true });
        } else {
            console.warn(`[SERVER] Unauthorized approve_draw_permission attempt by ${socket.id} or invalid data.`);
        }
    });

    socket.on('deny_draw_permission', ({ targetUserId, sessionId }) => {
        if (rooms[sessionId] && rooms[sessionId].hostId === socket.id && rooms[sessionId].users[targetUserId]) {
            console.log(`[SERVER] Host ${socket.id} DENIED draw permission for ${targetUserId} in session ${sessionId}`);
            io.to(targetUserId).emit('draw_request_denied', {
                sessionId: sessionId,
                reason: "Host denied the request."
            });
            io.to(rooms[sessionId].hostId).emit('permission_request_resolved_for_host', { targetUserId: targetUserId, granted: false });
        } else {
            console.warn(`[SERVER] Unauthorized deny_draw_permission attempt by ${socket.id} or invalid data.`);
        }
    });

    // For Host's Undo/Erase sync
    socket.on('board_state_sync', ({ sessionId, imageDataUrl }) => {
        if (rooms[sessionId] && 
            rooms[sessionId].users[socket.id] && 
            rooms[sessionId].users[socket.id].isHost && 
            rooms[sessionId].users[socket.id].canDraw) { // Host must also be able to draw
            console.log(`[SERVER] Host ${socket.id} initiated board_state_sync for session ${sessionId}`);
            socket.to(sessionId).emit('apply_board_state', { imageDataUrl }); // Broadcast to OTHERS
        } else {
            console.warn(`[SERVER] Unauthorized board_state_sync attempt from ${socket.id} for session ${sessionId}. User isHost: ${rooms[sessionId]?.users[socket.id]?.isHost}, canDraw: ${rooms[sessionId]?.users[socket.id]?.canDraw}`);
        }
    });

    socket.on('disconnect', () => {
        // currentUserName and currentSessionId are set when 'join_session' is successful for this socket
        console.log(`[SERVER] User disconnected: ${socket.id} (Last known name: ${currentUserName || 'N/A'}, Session: ${currentSessionId || 'N/A'})`);
        if (currentSessionId && rooms[currentSessionId] && rooms[currentSessionId].users[socket.id]) {
            const disconnectedUser = rooms[currentSessionId].users[socket.id];
            const wasHost = disconnectedUser.isHost;
            
            delete rooms[currentSessionId].users[socket.id];
            
            socket.to(currentSessionId).emit('user_left', { 
                userId: socket.id, 
                userName: disconnectedUser.name, 
                sessionId: currentSessionId 
            });
            console.log(`[SERVER] User ${socket.id} (Name: ${disconnectedUser.name}) removed from session: ${currentSessionId}`);

            if (Object.keys(rooms[currentSessionId].users).length === 0) {
                delete rooms[currentSessionId];
                console.log(`[SERVER] Session ${currentSessionId} is now empty and removed.`);
            } else {
                if (wasHost) {
                    rooms[currentSessionId].hostId = null; 
                    console.log(`[SERVER] Host (User ${socket.id}, Name: ${disconnectedUser.name}) left session ${currentSessionId}. No active host to manage permissions unless re-assigned by further logic.`);
                    // Optionally broadcast that the host specifically left, so clients can update UI if needed
                    io.to(currentSessionId).emit('host_left_session', { sessionId: currentSessionId, oldHostName: disconnectedUser.name });
                }
                console.log(`[SERVER] Current users in session ${currentSessionId}:`, JSON.stringify(rooms[currentSessionId].users));
            }
        } else {
            console.log(`[SERVER] User ${socket.id} disconnected without being fully tracked in a session room, or room was already cleaned up.`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`AR Whiteboard Server (HTTP with Permissions & Sync) listening on port ${PORT}`);
});
