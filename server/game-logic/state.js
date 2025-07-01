const createInitialGameState = (players) => {
    return {
        phase: 'role-spinning', // Initial phase shows spinner
        round: 1,
        scores: players.reduce((acc, player) => {
            acc[player.username] = 0;
            return acc;
        }, {})
    };
};

const updateScores = (room, guessResult) => {
    const { players, gameState } = room;
    const king = players.find(p => p.role === 'King');
    const queen = players.find(p => p.role === 'Queen');
    const police = players.find(p => p.role === 'Police');
    const thief = players.find(p => p.role === 'Thief');

    // King always gets 1000 points per round
    if (king) gameState.scores[king.username] += 1000;
    
    // Queen always gets 500 points per round
    if (queen) gameState.scores[queen.username] += 500;
    
    // Police gets 300 points only if guess is correct
    if (guessResult === 'correct') {
        if (police) gameState.scores[police.username] += 300;
    } else {
        // Thief gets 300 points only if Police guess is wrong
        if (thief) gameState.scores[thief.username] += 300;
    }
    
    console.log('Scores updated:', gameState.scores);
};

module.exports = { createInitialGameState, updateScores }; 