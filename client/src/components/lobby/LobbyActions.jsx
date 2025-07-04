import '../../styles/LobbyComponents.css';

function LobbyActions({ isHost, canStart, isReady, onToggleReady, onStartGame }) {
  return (
    <div className="lobby-actions">
      <button 
        onClick={onToggleReady}
        className={`action-btn ready-btn ${isReady ? 'ready' : 'not-ready'}`}
      >
        {isReady ? 'Ready' : 'Not Ready'}
      </button>

      {isHost && (
        <button 
          onClick={onStartGame} 
          disabled={!canStart}
          className="action-btn start-btn"
        >
          Start Game
        </button>
      )}
    </div>
  );
}

export default LobbyActions; 