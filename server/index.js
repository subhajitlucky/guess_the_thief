const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Import our modular handlers
const { handleConnection } = require('./handlers/connection');
const { handleRoomEvents } = require('./handlers/room');
const { handleLobbyEvents } = require('./handlers/lobby');
const { handleGameEvents } = require('./handlers/game');

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

// Store rooms: { roomCode: { players: [], createdAt: Date, host: socketId, gameState?: {...} } }
const rooms = new Map();

// Basic hello endpoint
app.get('/', (req, res) => {
    res.send('<h1>Guess the Thief Server</h1>');
});

// 🔥 SOCKET.IO STARTS HERE 🔥

// When a user connects to our server
io.on('connection', (socket) => {
    // Initialize all event handlers for this socket connection
    handleConnection(io, socket, users, rooms);
    handleRoomEvents(io, socket, users, rooms);
    handleLobbyEvents(io, socket, users, rooms);
    handleGameEvents(io, socket, users, rooms);
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Modular handlers loaded:');
    console.log('  ✓ Connection handler');
    console.log('  ✓ Room handler');
    console.log('  ✓ Lobby handler'); 
    console.log('  ✓ Game handler');
}); 