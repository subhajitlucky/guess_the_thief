function GameOverView({ message, scores, onLeave }) {
    // Sort scores for final leaderboard
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const winner = sortedScores.length > 0 ? sortedScores[0][0] : 'Nobody';

    return (
        <div>
            <h2>Game Over!</h2>
            <p>{message}</p>
            <h3>🏆 Winner: {winner} 🏆</h3>
            <h4>Final Leaderboard:</h4>
            <ol>
                {sortedScores.map(([username, score]) => (
                <li key={username}>
                    {username}: {score} points
                </li>
                ))}
            </ol>
            <button onClick={onLeave}>Return to Main Menu</button>
        </div>
    );
}

export default GameOverView; 