function LobbyHeader({ roomCode, onLeave, onCopy }) {
  return (
    <div>
      <div>
        <h2>Room Lobby</h2>
        <span>Room Code: {roomCode}</span>
        <button onClick={onCopy}>Copy</button>
      </div>
      <button onClick={onLeave}>Leave Room</button>
    </div>
  );
}

export default LobbyHeader; 