// Helper function to broadcast lobby updates
const broadcastLobbyUpdate = (io, roomCode, rooms) => {
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

const handleLobbyEvents = (io, socket, users, rooms) => {
    // Handle get lobby state
    socket.on('get-lobby-state', (data) => {
        const { roomCode } = data;
        
        if (!rooms.has(roomCode)) {
            socket.emit('lobby-error', { message: 'Room not found' });
            return;
        }

        broadcastLobbyUpdate(io, roomCode, rooms);
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
        broadcastLobbyUpdate(io, roomCode, rooms);

        console.log('User', username, 'is now', player.isReady ? 'ready' : 'not ready');
    });

    // Note: start-game handler is now in game.js
};

module.exports = { handleLobbyEvents, broadcastLobbyUpdate }; 