import { useState } from 'react';
import '../../styles/LobbyComponents.css';

function LobbyHeader({ roomCode, onLeave, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="lobby-header">
      <div className="lobby-header-title">
        <h2>Room Lobby</h2>
        <div>
          <span className="room-code-display">Room Code: {roomCode}</span>
          <button onClick={handleCopy} className="copy-btn">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <button onClick={onLeave} className="leave-btn">Leave Room</button>
    </div>
  );
}

export default LobbyHeader; 