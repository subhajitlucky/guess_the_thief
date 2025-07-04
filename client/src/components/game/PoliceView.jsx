function PoliceView({ phase, suspects, onGuess }) {
  if (phase !== 'police-investigation') return null;

  return (
    <div className="game-view">
      <h3 className="view-title">Police Investigation</h3>
      <p className="view-description">
        You are the Police. One of these players is the Thief. Make your guess!
      </p>
      <div className="suspects-grid">
        {suspects.map((suspect) => (
          <button 
            key={suspect.username} 
            onClick={() => onGuess(suspect.username)}
            className="action-btn suspect-btn"
          >
            {suspect.username}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PoliceView; 