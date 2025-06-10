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

// Simple room storage (like a notebook to remember rooms)
const rooms = {};

// Function to create a random room code (like ABC123)
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Basic hello endpoint
app.get('/', (req, res) => {
    res.send('<h1>Hello from Guess the Thief Server!</h1><p>Socket.IO enabled!</p>');
});

// 🔥 SOCKET.IO MAGIC STARTS HERE 🔥

// When a user connects to our server
io.on('connection', (socket) => {
    console.log('📱 User connected:', socket.id);

    // When user wants to CREATE a room
    socket.on('createRoom', (data) => {
        const { username } = data;
        console.log(`👤 ${username} wants to create a room`);
        
        // Step 1: Generate a random room code
        const roomCode = generateRoomCode();
        
        // Step 2: Create the room in our memory
        rooms[roomCode] = {
            players: [{ id: socket.id, username: username, isReady: false }],
            maxPlayers: 4,
            gameStarted: false
        };
        
        // Step 3: Put this user in the room
        socket.join(roomCode);
        socket.roomCode = roomCode; // Remember which room this user is in
        
        console.log(`🏠 Room ${roomCode} created with ${username}`);
        
        // Step 4: Tell the user their room is ready
        socket.emit('roomCreated', {
            roomCode: roomCode,
            players: rooms[roomCode].players
        });
    });

    // When user wants to JOIN a room
    socket.on('joinRoom', (data) => {
        const { roomCode, username } = data;
        console.log(`👤 ${username} wants to join room ${roomCode}`);
        
        // Step 1: Check if room exists
        if (!rooms[roomCode]) {
            console.log(`❌ Room ${roomCode} does not exist`);
            socket.emit('roomNotFound');
            return;
        }
        
        // Step 2: Check if room is full
        if (rooms[roomCode].players.length >= 4) {
            console.log(`❌ Room ${roomCode} is full`);
            socket.emit('roomFull');
            return;
        }
        
        // Step 3: Add user to the room
        rooms[roomCode].players.push({ 
            id: socket.id, 
            username: username, 
            isReady: false 
        });
        socket.join(roomCode);
        socket.roomCode = roomCode;
        
        console.log(`🏠 ${username} joined room ${roomCode}`);
        
        // Step 4: Tell everyone in the room about the new player
        io.to(roomCode).emit('roomUpdate', {
            roomCode: roomCode,
            players: rooms[roomCode].players
        });
    });

    // When user toggles ready status
    socket.on('toggleReady', (data) => {
        const roomCode = socket.roomCode;
        if (!roomCode || !rooms[roomCode]) return;
        
        // Find the player and toggle their ready status
        const player = rooms[roomCode].players.find(p => p.id === socket.id);
        if (player) {
            player.isReady = !player.isReady;
            console.log(`🔄 ${player.username} is now ${player.isReady ? 'ready' : 'not ready'}`);
            
            // Tell everyone in the room about the status change
            io.to(roomCode).emit('roomUpdate', {
                roomCode: roomCode,
                players: rooms[roomCode].players
            });
        }
    });

    // When user (room creator) starts the game
    socket.on('startGame', () => {
        const roomCode = socket.roomCode;
        if (!roomCode || !rooms[roomCode]) return;
        
        const room = rooms[roomCode];
        const player = room.players.find(p => p.id === socket.id);
        
        // Check if user is the room creator (first player)
        const isCreator = room.players[0].id === socket.id;
        if (!isCreator) {
            socket.emit('notCreator');
            return;
        }
        
        // Check if all 4 players are ready
        if (room.players.length !== 4) {
            socket.emit('needMorePlayers');
            return;
        }
        
        if (!room.players.every(p => p.isReady)) {
            socket.emit('notAllReady');
            return;
        }
        
        // Start the game!
        room.gameStarted = true;
        console.log(`🎮 Game started in room ${roomCode}!`);
        
        // Tell all players the game has started
        io.to(roomCode).emit('gameStarted', {
            message: 'Game is starting! 🎮',
            roomCode: roomCode
        });
    });

    // When user disconnects
    socket.on('disconnect', () => {
        console.log('📱 User disconnected:', socket.id);
        
        // Remove user from their room
        if (socket.roomCode && rooms[socket.roomCode]) {
            rooms[socket.roomCode].players = rooms[socket.roomCode].players.filter(
                player => player.id !== socket.id
            );
            
            // If room is empty, delete it
            if (rooms[socket.roomCode].players.length === 0) {
                delete rooms[socket.roomCode];
                console.log(`🗑️ Room ${socket.roomCode} deleted (empty)`);
            } else {
                // Tell remaining players someone left
                io.to(socket.roomCode).emit('roomUpdate', {
                    roomCode: socket.roomCode,
                    players: rooms[socket.roomCode].players
                });
            }
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO ready for connections!`);
}); 