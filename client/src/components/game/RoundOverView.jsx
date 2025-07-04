function RoundOverView({ message, scores }) {
  // Sort scores for leaderboard
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="summary-view">
      <h2 className="summary-title">Round Over</h2>
      <p className="summary-message">{message}</p>
      
      <h3>Scores This Round:</h3>
      <ul className="scores-list">
        {sortedScores.map(([username, score]) => (
          <li key={username} className="score-item">
            <span>{username}</span>
            <span>+{score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RoundOverView; 