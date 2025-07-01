const handleConnection = (io, socket, users, rooms) => {
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

    // When user disconnects
    socket.on('disconnect', () => {
        const username = users.get(socket.id) || 'Unknown';
        users.delete(socket.id);
        
        // Remove user from any rooms
        for (const [roomCode, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(player => player.socketId === socket.id);
            if (playerIndex !== -1) {
                const leavingPlayer = room.players[playerIndex];
                room.players.splice(playerIndex, 1);
                
                // If a game was in progress, end it for everyone.
                if (room.gameState) {
                    io.to(roomCode).emit('game-over', {
                        message: `Game Over: ${leavingPlayer.username} has left the game.`,
                        scores: room.gameState.scores
                    });
                    rooms.delete(roomCode);
                    console.log(`Game in room ${roomCode} ended due to player disconnection.`);
                } else {
                    // If just in the lobby, update the lobby
                    if (room.players.length === 0) {
                        rooms.delete(roomCode);
                        console.log('Room', roomCode, 'deleted (empty)');
                    } else {
                        if (room.host === socket.id) {
                            room.host = room.players[0].socketId;
                            room.players[0].isHost = true;
                            console.log('New host assigned in room', roomCode, ':', room.players[0].username);
                        }
                        
                        const { broadcastLobbyUpdate } = require('./lobby');
                        broadcastLobbyUpdate(io, roomCode, rooms);
                    }
                }
                break;
            }
        }
        
        console.log('User disconnected:', username);
        console.log('Total users:', users.size);
        console.log('Total rooms:', rooms.size);
    });
};

module.exports = { handleConnection }; 