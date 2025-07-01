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

        // --- Broadcasting to Players ---
        room.players.forEach(player => {
            io.to(player.socketId).emit('game-started', {
                message: "The game has begun!",
                yourRole: player.role,
                allPlayers: room.players.map(p => ({ username: p.username, isHost: p.isHost })),
                gameState: room.gameState
            });
        });

        console.log(`Game started in room ${roomCode} with roles assigned`);

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
            io.to(roomCode).emit('game-update', {
                message: `The King declares: "Who is the Police here? Find the thief in 1 minute!"`
            });

            setTimeout(() => {
                io.to(roomCode).emit('game-update', {
                    message: `A figure steps forward... "Your Majesty, I am the Police! I will find the thief."`
                });

                setTimeout(() => {
                    room.gameState.phase = 'police-investigation';
                    io.to(roomCode).emit('game-update', {
                        gameState: room.gameState,
                        message: "The Police is now investigating."
                    });
                    console.log(`Room ${roomCode} is now in police-investigation phase.`);
                }, 3000);
            }, 3000);
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
                
                room.players.forEach(player => {
                    io.to(player.socketId).emit('game-started', {
                        message: `Round ${room.gameState.round} has begun!`,
                        yourRole: player.role,
                        allPlayers: room.players.map(p => ({ username: p.username, isHost: p.isHost })),
                        gameState: room.gameState
                    });
                });
            }
        }, 8000); // 8-second delay to show round results
    });

    // Handle emoji sending
    socket.on('send-emoji', (data) => {
        const { roomCode, emoji, from } = data;
        io.to(roomCode).emit('emoji-broadcast', { emoji, from });
    });

    // Future game events will go here:
    // - King's turn events
    // - Thief's turn events  
    // - Police's turn events
    // - Voting/accusation events
    // - Scoring events
};

module.exports = { handleGameEvents, assignRoles, shuffleArray }; 