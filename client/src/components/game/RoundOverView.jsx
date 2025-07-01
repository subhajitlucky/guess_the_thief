function RoundOverView({ message, scores }) {
  // Sort scores for leaderboard
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h4>Round Over!</h4>
      <p>{message}</p>
      <h5>Leaderboard:</h5>
      <ol>
        {sortedScores.map(([username, score]) => (
          <li key={username}>
            {username}: {score} points
          </li>
        ))}
      </ol>
      <p>Next round starting soon...</p>
    </div>
  );
}

export default RoundOverView; 