function PoliceView({ phase, suspects, onGuess }) {
  if (phase === 'king-turn') {
    return <p>Waiting for the King's command...</p>;
  }

  if (phase === 'police-investigation') {
    return (
      <div>
        <h4>Police Investigation</h4>
        <p>"I will find the thief!"</p>
        <p>Choose your suspect from the remaining players:</p>
        {suspects.map(p => (
          <button key={p.username} onClick={() => onGuess(p.username)}>
            {p.username}
          </button>
        ))}
      </div>
    );
  }

  return <p>Awaiting orders...</p>;
}

export default PoliceView; 