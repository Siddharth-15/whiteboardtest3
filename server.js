// server.js - FINAL CONSOLIDATED VERSION with Robust Host Rejoin & Permissions - FOR RENDER.COM (HTTP ONLY)

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
    res.send('AR Whiteboard Server: Ready for connections (Permissions & Sync Enabled)!');
});

// Enhanced rooms structure: 
// { sessionId: { 
//     users: { socketId: { name: 'userName', canDraw: boolean, isHost: boolean } }, 
//     hostId: 'socketIdOfHost' // Stores the original host's socket ID for this session instance
//   } 
// }
const rooms = {}; 

io.on('connection', (socket) => {
    console.log(`[SERVER] A user connected: ${socket.id}`);
    let currentSessionId = null; 
    let currentUserName = null; 

    socket.on('join_session', (sessionId, userName) => { 
        socket.join(sessionId);
        currentSessionId = sessionId; 
        currentUserName = userName || `User_${socket.id.substring(0,5)}`;

        let userDetailsToStore;

        if (!rooms[sessionId]) {
            // This is the first user in this session, they become the host
            rooms[sessionId] = { 
                users: {}, 
                hostId: socket.id // Set the original hostId for this session
            };
            userDetailsToStore = {
                name: currentUserName,
                canDraw: true, // Host can always draw
                isHost: true
            };
            console.log(`[SERVER] Session ${sessionId} created by host ${currentUserName} (${socket.id})`);
        } else {
            // Room already exists.
            if (rooms[sessionId].hostId === socket.id) {
                // This socket ID matches the original hostId for this session instance.
                // This could be the host rejoining after a refresh/disconnect.
                userDetailsToStore = {
                    name: currentUserName, // Update name if it changed client-side (unlikely for host rejoin)
                    canDraw: true,         // Host always retains drawing permission
                    isHost: true           // Host remains host
                };
                console.log(`[SERVER] Original Host ${currentUserName} (${socket.id}) REJOINED session ${sessionId}. Preserving host status.`);
            } else {
                // This is a new viewer/participant joining an existing room, or a previous non-host user rejoining.
                userDetailsToStore = {
                    name: currentUserName,
                    canDraw: rooms[sessionId].users[socket.id]?.canDraw || false, // Preserve canDraw if rejoining, else false
                    isHost: false // New joiners (not original host) are not hosts
                };
                console.log(`[SERVER] User ${currentUserName} (${socket.id}) joined/rejoined existing session ${sessionId}. Status:`, userDetailsToStore);
            }
        }

        rooms[sessionId].users[socket.id] = userDetailsToStore;

        console.log(`[SERVER] User ${currentUserName} (${socket.id}) details in session ${sessionId}:`, JSON.stringify(userDetailsToStore));

        // Notify OTHERS in the room about this user (new or rejoining)
        const eventDataForOthers = {
            userId: socket.id,
            userName: userDetailsToStore.name,
            canDraw: userDetailsToStore.canDraw,
            isHost: userDetailsToStore.isHost
        };
        socket.to(sessionId).emit('user_joined', eventDataForOthers);

        // Send the CURRENT list of ALL participants to THIS user who just joined/rejoined
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
            rooms[data.sessionId].users[socket.id]) {
            
            if (rooms[data.sessionId].users[socket.id].canDraw) {
                socket.to(data.sessionId).emit('drawing_action_broadcast', data);
            } else {
                console.warn(`[SERVER] User ${socket.id} (Name: ${rooms[data.sessionId].users[socket.id].name}) tried to draw without permission in session ${data.sessionId}. Action denied.`);
                socket.emit('action_denied', { action: 'draw', reason: 'You do not have permission to draw.'});
            }
        } else {
            console.warn('[SERVER] Received drawing_action with invalid session/user data, or user not in room state:', data);
        }
    });

    socket.on('update_draw_permission', ({ targetUserId, canDraw, sessionId }) => {
        if (currentSessionId === sessionId && 
            rooms[sessionId] && 
            rooms[sessionId].hostId === socket.id) { 
            
            if (rooms[sessionId].users[targetUserId]) {
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

    socket.on('request_draw_permission', ({sessionId}) => { 
        if (rooms[sessionId] && rooms[sessionId].users[socket.id] && rooms[sessionId].hostId) {
            const requester = rooms[sessionId].users[socket.id];
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

    socket.on('board_state_sync', ({ sessionId, imageDataUrl }) => {
        if (rooms[sessionId] && 
            rooms[sessionId].users[socket.id] && 
            rooms[sessionId].users[socket.id].isHost && 
            rooms[sessionId].users[socket.id].canDraw) {
            console.log(`[SERVER] Host ${socket.id} initiated board_state_sync for session ${sessionId}`);
            socket.to(sessionId).emit('apply_board_state', { imageDataUrl }); 
        } else {
            console.warn(`[SERVER] Unauthorized board_state_sync attempt from ${socket.id} for session ${sessionId}. User isHost: ${rooms[sessionId]?.users[socket.id]?.isHost}, canDraw: ${rooms[sessionId]?.users[socket.id]?.canDraw}`);
        }
    });

    socket.on('disconnect', () => {
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
                if (wasHost && rooms[currentSessionId].hostId === socket.id) { // Check if this was the original hostId
                    rooms[currentSessionId].hostId = null; 
                    console.log(`[SERVER] Original Host (User ${socket.id}, Name: ${disconnectedUser.name}) left session ${currentSessionId}. No active host to manage permissions unless re-assigned by further logic.`);
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
