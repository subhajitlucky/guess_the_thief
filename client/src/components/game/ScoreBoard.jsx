import '../../styles/ScoreBoard.css';

function ScoreBoard({ scores }) {
  if (!scores) return null;

  const entries = Object.entries(scores);
  return (
    <div className="score-board">
      {entries.map(([user, score]) => (
        <div key={user} className="score-item">
          <span className="score-name" title={user}>{user}</span>
          <span className="score-value">{score}</span>
        </div>
      ))}
    </div>
  );
}

export default ScoreBoard; 