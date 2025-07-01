// Fisher-Yates shuffle algorithm for fair role distribution
const shuffleArray = (array) => {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Assign roles to all players in a room
const assignRoles = (room) => {
    const roles = ['King', 'Queen', 'Police', 'Thief'];
    const shuffledRoles = shuffleArray(roles);
    
    // Assign each player a role
    room.players.forEach((player, index) => {
        player.role = shuffledRoles[index];
    });
    
    console.log('Roles assigned:', room.players.map(p => `${p.username}: ${p.role}`));
};

module.exports = { assignRoles }; 