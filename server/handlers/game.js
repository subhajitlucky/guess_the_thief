// Import game logic functions
const { assignRoles } = require('../game-logic/roles');
const { createInitialGameState, updateScores } = require('../game-logic/state');

// Fisher-Yates shuffle algorithm for fair role distribution
const shuffleArray = (array) => {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const handleGameEvents = (io, socket, users, rooms) => {
    // Handle joining room for game (after navigation from lobby)
    socket.on('join-room-for-game', (data) => {
        const { roomCode } = data;
        const username = users.get(socket.id);
        
        console.log(`🎮 User ${username} joining room ${roomCode} for game`);
        
        if (!rooms.has(roomCode)) {
            console.error(`❌ Room ${roomCode} not found for game join`);
            return socket.emit('game-error', { message: 'Room not found' });
        }
        
        const room = rooms.get(roomCode);
        const player = room.players.find(p => p.socketId === socket.id);
        
        if (!player) {
            console.error(`❌ Player ${username} not found in room ${roomCode}`);
            return socket.emit('game-error', { message: 'You are not in this room' });
        }
        
        // Ensure socket is in the room
        socket.join(roomCode);
        console.log(`✅ User ${username} joined room ${roomCode} for game`);
        
        // If game is in progress, send current state
        if (room.gameState) {
            socket.emit('game-started', {
                message: "Game in progress",
                yourRole: player.role,
                allPlayers: room.players.map(p => ({ username: p.username, isHost: p.isHost })),
                gameState: room.gameState
            });
        }
    });

    // Handle start game with role assignment
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);

        if (!room) {
            return socket.emit('lobby-error', { message: 'Room not found' });
        }
        
        // --- Validation Checks ---
        if (room.host !== socket.id) {
            return socket.emit('lobby-error', { message: 'Only the host can start the game' });
        }
        if (room.players.length !== 4) {
            return socket.emit('lobby-error', { message: 'Need 4 players to start' });
        }
        if (!room.players.every(p => p.isReady)) {
            return socket.emit('lobby-error', { message: 'All players must be ready' });
        }

        console.log('Starting game in room:', roomCode);

        // --- Game Logic Orchestration ---
        assignRoles(room);
        room.gameState = createInitialGameState(room.players);

        console.log(`🎭 Roles assigned in room ${roomCode}:`);
        room.players.forEach(p => console.log(`  ${p.username}: ${p.role}`));

        // --- Broadcasting to Players ---
        room.players.forEach(player => {
            console.log(`📤 Sending game-started to ${player.username} with role: ${player.role}`);
            io.to(player.socketId).emit('game-started', {
                message: "The game has begun!",
                yourRole: player.role,
                allPlayers: room.players.map(p => ({ username: p.username, isHost: p.isHost })),
                gameState: room.gameState
            });
        });

        console.log(`✅ Game started in room ${roomCode} with roles assigned`);

        // Automatically transition to the King's turn after a delay
        setTimeout(() => {
            room.gameState.phase = 'king-turn';
            io.to(roomCode).emit('game-update', {
                gameState: room.gameState,
                message: "The King is now in charge!"
            });
            console.log(`Room ${roomCode} is now in king-turn phase.`);
        }, 5000);
    });

    // Handle the King's action
    socket.on('king-reveals-police', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);

        if (room && room.players.find(p => p.socketId === socket.id)?.role === 'King') {
            const kingPlayer = room.players.find(p => p.socketId === socket.id);
            const chatMessage = {
                from: kingPlayer.username,
                text: "Who is the Police here? Find the thief in 1 minute!",
                timestamp: new Date().toLocaleTimeString(),
                type: 'player'
            };

            // Send chat message to all players
            io.to(roomCode).emit('chat-message', chatMessage);
            
            // Update game state to waiting for police response
            room.gameState.phase = 'waiting-police-response';
            io.to(roomCode).emit('game-update', {
                gameState: room.gameState,
                message: "Waiting for Police to respond..."
            });
            console.log(`Room ${roomCode} is now waiting for police response.`);
        }
    });

    // Handle the Police's response
    socket.on('police-responds', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);

        if (room && room.players.find(p => p.socketId === socket.id)?.role === 'Police' && room.gameState.phase === 'waiting-police-response') {
            const policePlayer = room.players.find(p => p.socketId === socket.id);
            const chatMessage = {
                from: policePlayer.username,
                text: "Your Majesty, I am the Police! I will find the thief in 1 minute!",
                timestamp: new Date().toLocaleTimeString(),
                type: 'player'
            };

            // Send chat message to all players
            io.to(roomCode).emit('chat-message', chatMessage);
            
            // Start police investigation phase
            room.gameState.phase = 'police-investigation';
            room.gameState.investigationStartTime = Date.now();
            room.gameState.investigationDuration = 60000;
            
            io.to(roomCode).emit('game-update', {
                gameState: room.gameState,
                message: "The Police is now investigating. 1 minute remaining!"
            });
            console.log(`Room ${roomCode} is now in police-investigation phase.`);

            // Auto-timeout after 1 minute if no guess is made
            setTimeout(() => {
                if (room && room.gameState.phase === 'police-investigation') {
                    // Police failed to guess in time
                    const thief = room.players.find(p => p.role === 'Thief');
                    
                    // Give points to thief for successful evasion
                    updateScores(room, 'incorrect');
                    
                    room.gameState.phase = 'round-over';
                    io.to(roomCode).emit('game-update', {
                        gameState: room.gameState,
                        message: `Time's up! The Police failed to catch the thief. The Thief was ${thief.username}.`
                    });
                }
            }, 60000); // 60 seconds
        }
    });

    // Handle the Police's guess
    socket.on('police-guess-thief', (data) => {
        const { roomCode, guess } = data;
        const room = rooms.get(roomCode);

        if (!room || room.players.find(p => p.socketId === socket.id)?.role !== 'Police') {
            return; // Ignore if not from Police or room not found
        }

        const thief = room.players.find(p => p.role === 'Thief');
        const guessResult = (thief && thief.username === guess) ? 'correct' : 'incorrect';

        updateScores(room, guessResult);

        room.gameState.phase = 'round-over';
        
        io.to(roomCode).emit('game-update', {
            gameState: room.gameState,
            message: `The Police guessed ${guess}. The guess was ${guessResult.toUpperCase()}! The Thief was ${thief.username}.`
        });

        // Add logic for next round or game over
        setTimeout(() => {
            if (room.gameState.round >= 10) {
                // Game Over
                io.to(roomCode).emit('game-over', {
                    message: "Game Over! Final Scores:",
                    scores: room.gameState.scores
                });
                rooms.delete(roomCode);
            } else {
                // Next Round
                room.gameState.round++;
                assignRoles(room);
                room.gameState.phase = 'role-spinning';
                
                console.log(`🎭 Round ${room.gameState.round} roles assigned in room ${roomCode}:`);
                room.players.forEach(p => console.log(`  ${p.username}: ${p.role}`));
                
                room.players.forEach(player => {
                    console.log(`📤 Sending Round ${room.gameState.round} game-started to ${player.username} with role: ${player.role}`);
                    io.to(player.socketId).emit('game-started', {
                        message: `Round ${room.gameState.round} has begun!`,
                        yourRole: player.role,
                        allPlayers: room.players.map(p => ({ username: p.username, isHost: p.isHost })),
                        gameState: room.gameState
                    });
                });
                
                console.log(`✅ Round ${room.gameState.round} started in room ${roomCode}`);
                
                // Automatically transition to the King's turn after spinning delay (same as Round 1)
                setTimeout(() => {
                    if (room && room.gameState) { // Check room still exists
                        room.gameState.phase = 'king-turn';
                        io.to(roomCode).emit('game-update', {
                            gameState: room.gameState,
                            message: "The King is now in charge!"
                        });
                        console.log(`Room ${roomCode} Round ${room.gameState.round} is now in king-turn phase.`);
                    }
                }, 5000); // 5-second delay to show spinner
            }
        }, 8000); // 8-second delay to show round results
    });

    // Handle emoji sending
    socket.on('send-emoji', (data) => {
        const { roomCode, emoji, from } = data;
        io.to(roomCode).emit('emoji-broadcast', { emoji, from });
    });

    // Handle manual leave during game
    socket.on('leave-game', (data) => {
        const { roomCode } = data;
        if (!rooms.has(roomCode)) return;

        const room = rooms.get(roomCode);
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex === -1) return;
        const leavingPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        socket.leave(roomCode);

        if (room.gameState) {
            // End game for everyone if someone leaves mid-game
            io.to(roomCode).emit('game-over', {
                message: `Game Over: ${leavingPlayer.username} has left the game.`,
                scores: room.gameState.scores
            });
            rooms.delete(roomCode);
            console.log(`Game in room ${roomCode} ended due to player leaving.`);
        } else {
            // If just in lobby pre-game
            if (room.players.length === 0) {
                rooms.delete(roomCode);
            }
        }
    });

    // Future game events will go here:
    // - King's turn events
    // - Thief's turn events  
    // - Police's turn events
    // - Voting/accusation events
    // - Scoring events
};

module.exports = { handleGameEvents, assignRoles, shuffleArray }; 