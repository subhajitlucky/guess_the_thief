const handleRoomEvents = (io, socket, users, rooms) => {
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
        const { broadcastLobbyUpdate } = require('./lobby');
        broadcastLobbyUpdate(io, roomCode, rooms);

        console.log('User', username, 'joined room:', roomCode, `(${room.players.length}/4 players)`);
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
                
                const { broadcastLobbyUpdate } = require('./lobby');
                broadcastLobbyUpdate(io, roomCode, rooms);
            }
            
            console.log('User', username, 'left room:', roomCode);
        }
    });
};

module.exports = { handleRoomEvents }; 