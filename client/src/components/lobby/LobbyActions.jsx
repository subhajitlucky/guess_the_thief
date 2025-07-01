function LobbyActions({ isHost, canStart, isReady, onToggleReady, onStartGame }) {
  return (
    <div>
      <button onClick={onToggleReady}>
        {isReady ? 'Ready' : 'Not Ready'}
      </button>

      {isHost && (
        <button onClick={onStartGame} disabled={!canStart}>
          Start Game
        </button>
      )}
    </div>
  );
}

export default LobbyActions; 