const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

// Store users: { socketId: "username" }
const users = new Map();

// Store rooms: { roomCode: { players: [], createdAt: Date, host: socketId } }
const rooms = new Map();

// Basic hello endpoint
app.get('/', (req, res) => {
    res.send('<h1>Guess the Thief Server</h1>');
});



// Helper function to broadcast lobby updates
const broadcastLobbyUpdate = (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const canStart = room.players.length === 4 && room.players.every(p => p.isReady);
    
    const lobbyData = {
        players: room.players,
        host: room.host,
        canStart: canStart
    };

    io.to(roomCode).emit('lobby-update', lobbyData);
    console.log(`Lobby update sent for room ${roomCode}: ${room.players.length}/4 players, ${room.players.filter(p => p.isReady).length} ready`);
};

// 🔥 SOCKET.IO STARTS HERE 🔥

// When a user connects to our server
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle username setting
    socket.on('set-username', (data) => {
        const { username } = data;
        
        console.log('Setting username:', username, 'for socket:', socket.id);

        // Simple validation
        if (!username || username.trim().length < 2) {
            socket.emit('username-error', { message: 'Username must be at least 2 characters' });
            return;
        }

        // Check if username is taken
        const isUsernameExists = Array.from(users.values()).includes(username.trim());
        if (isUsernameExists) {
            socket.emit('username-error', { message: 'Username already taken' });
            return;
        }

        // Store username
        users.set(socket.id, username.trim());

        // Send success back to client
        socket.emit('username-success', { username: username.trim() });
        
        console.log('Username set successfully:', username.trim());
        console.log('Total users:', users.size);
    });

    // Handle room creation
    socket.on('create-room', (data) => {
        const { roomCode, username } = data;
        
        console.log('Creating room:', roomCode, 'by user:', username);

        // Check if room already exists
        if (rooms.has(roomCode)) {
            socket.emit('room-error', { message: 'Room code already exists, try again' });
            return;
        }

        // Create new room
        const newRoom = {
            players: [{ socketId: socket.id, username: username, isReady: false, isHost: true }],
            createdAt: new Date(),
            host: socket.id
        };

        rooms.set(roomCode, newRoom);
        
        // Join socket to room for broadcasting
        socket.join(roomCode);

        // Send success response
        socket.emit('room-created', { 
            roomCode,
            players: newRoom.players
        });

        console.log('Room created:', roomCode, 'with', newRoom.players.length, 'players');
    });

    // Handle room joining
    socket.on('join-room', (data) => {
        const { roomCode, username } = data;
        
        console.log('User', username, 'trying to join room:', roomCode);

        // Check if room exists
        if (!rooms.has(roomCode)) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }

        const room = rooms.get(roomCode);

        // Check if room is full
        if (room.players.length >= 4) {
            socket.emit('room-error', { message: 'Room is full (4/4 players)' });
            return;
        }

        // Check if user already in room
        const isAlreadyInRoom = room.players.some(player => player.socketId === socket.id);
        if (isAlreadyInRoom) {
            socket.emit('room-error', { message: 'You are already in this room' });
            return;
        }

        // Add player to room
        room.players.push({ socketId: socket.id, username: username, isReady: false, isHost: false });
        
        // Join socket to room
        socket.join(roomCode);

        // Send success to joining player
        socket.emit('room-joined', {
            roomCode,
            players: room.players
        });

        // Broadcast lobby update to all players in room
        broadcastLobbyUpdate(roomCode);

        console.log('User', username, 'joined room:', roomCode, `(${room.players.length}/4 players)`);
    });

    // Handle get lobby state
    socket.on('get-lobby-state', (data) => {
        const { roomCode } = data;
        
        if (!rooms.has(roomCode)) {
            socket.emit('lobby-error', { message: 'Room not found' });
            return;
        }

        broadcastLobbyUpdate(roomCode);
    });



    // Handle toggle ready
    socket.on('toggle-ready', (data) => {
        const { roomCode, username } = data;
        
        console.log('User', username, 'toggling ready in room:', roomCode);

        if (!rooms.has(roomCode)) {
            socket.emit('lobby-error', { message: 'Room not found' });
            return;
        }

        const room = rooms.get(roomCode);
        const player = room.players.find(p => p.socketId === socket.id);
        
        if (!player) {
            socket.emit('lobby-error', { message: 'You are not in this room' });
            return;
        }

        // Toggle ready state
        player.isReady = !player.isReady;

        // Broadcast update to all players
        broadcastLobbyUpdate(roomCode);

        console.log('User', username, 'is now', player.isReady ? 'ready' : 'not ready');
    });

    // Handle start game
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        
        if (!rooms.has(roomCode)) {
            socket.emit('lobby-error', { message: 'Room not found' });
            return;
        }

        const room = rooms.get(roomCode);
        
        // Check if user is host
        if (room.host !== socket.id) {
            socket.emit('lobby-error', { message: 'Only the host can start the game' });
            return;
        }

        // Check if room is full and all ready
        if (room.players.length !== 4) {
            socket.emit('lobby-error', { message: 'Need 4 players to start' });
            return;
        }

        if (!room.players.every(p => p.isReady)) {
            socket.emit('lobby-error', { message: 'All players must be ready' });
            return;
        }

        console.log('Starting game in room:', roomCode);

        // Broadcast game start to all players
        io.to(roomCode).emit('game-started', {
            roomCode,
            players: room.players.map(p => ({ username: p.username, isHost: p.isHost }))
        });
    });



    // Handle leave room
    socket.on('leave-room', (data) => {
        const { roomCode } = data;
        
        if (!rooms.has(roomCode)) {
            return;
        }

        const room = rooms.get(roomCode);
        const playerIndex = room.players.findIndex(player => player.socketId === socket.id);
        
        if (playerIndex !== -1) {
            const username = room.players[playerIndex].username;
            room.players.splice(playerIndex, 1);
            
            socket.leave(roomCode);

            if (room.players.length === 0) {
                rooms.delete(roomCode);
                console.log('Room', roomCode, 'deleted (empty)');
            } else {
                // If host left, assign new host
                if (room.host === socket.id && room.players.length > 0) {
                    room.host = room.players[0].socketId;
                    room.players[0].isHost = true;
                    console.log('New host assigned in room', roomCode, ':', room.players[0].username);
                }
                
                broadcastLobbyUpdate(roomCode);
            }
            
            console.log('User', username, 'left room:', roomCode);
        }
    });

    // When user disconnects
    socket.on('disconnect', () => {
        const username = users.get(socket.id) || 'Unknown';
        users.delete(socket.id);
        
        // Remove user from any rooms
        for (const [roomCode, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(player => player.socketId === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
                // If room is empty, delete it
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                    console.log('Room', roomCode, 'deleted (empty)');
                } else {
                    // If host disconnected, assign new host
                    if (room.host === socket.id) {
                        room.host = room.players[0].socketId;
                        room.players[0].isHost = true;
                        console.log('New host assigned in room', roomCode, ':', room.players[0].username);
                    }
                    
                    broadcastLobbyUpdate(roomCode);
                }
                break;
            }
        }
        
        console.log('User disconnected:', username);
        console.log('Total users:', users.size);
        console.log('Total rooms:', rooms.size);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 