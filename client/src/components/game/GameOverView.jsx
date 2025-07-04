function GameOverView({ message, scores, onLeave }) {
    // Sort scores for final leaderboard
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const winner = sortedScores.length > 0 ? sortedScores[0][0] : 'No one';

    return (
        <div className="summary-view">
            <h2 className="summary-title">Game Over!</h2>
            <p className="summary-message">{message}</p>
            <h3 className="winner-announcement">🏆 Winner: {winner} 🏆</h3>
            <h4>Final Scores:</h4>
            <ul className="scores-list">
                {sortedScores.map(([username, score]) => (
                <li key={username} className="score-item">
                    <span>{username}</span>
                    <span>{score}</span>
                </li>
                ))}
            </ul>
            <button onClick={onLeave} className="action-btn">
                Return to Main Menu
            </button>
        </div>
    );
}

export default GameOverView; 