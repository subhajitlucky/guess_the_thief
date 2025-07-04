import '../../styles/LobbyComponents.css';

function PlayerList({ players, currentUser }) {
  return (
    <div className="player-list">
      <div className="player-list-header">
        <h3>Players ({players.length}/4)</h3>
        <p className="ready-count">Ready: {players.filter(p => p.isReady).length}/{players.length}</p>
      </div>
      <ul>
        {players.map((player) => (
          <li key={player.username} className="player-item">
            <span className="player-name">{player.username}</span>
            {player.isHost && <span className="player-tag host-tag">Host</span>}
            {player.username === currentUser && <span className="player-tag you-tag">You</span>}
            <div className={`ready-status ${player.isReady ? 'ready' : 'not-ready'}`}>
              <div className="status-dot"></div>
              <span>{player.isReady ? 'Ready' : 'Not Ready'}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlayerList; 