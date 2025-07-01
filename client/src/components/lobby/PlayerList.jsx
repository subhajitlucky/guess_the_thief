function PlayerList({ players, currentUser }) {
  return (
    <div>
      <h3>Players ({players.length}/4)</h3>
      <p>Ready: {players.filter(p => p.isReady).length}/{players.length}</p>
      <ul>
        {players.map((player) => (
          <li key={player.username}>
            {player.username}
            {player.isHost && ' (Host)'}
            {player.username === currentUser && ' (You)'}
            - {player.isReady ? 'Ready' : 'Not Ready'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlayerList; 