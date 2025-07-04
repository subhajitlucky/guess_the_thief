import { useState } from 'react';

function QueenThiefView({ onSendEmoji }) {
  const emojis = ['👍', '👎', '😂', '🤔', '🤫', '👀', '🤥', '😇'];
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  const handleSelect = (emoji) => {
    console.log('🚀 Sending emoji:', emoji);
    setSelectedEmoji(emoji);
    onSendEmoji(emoji);
    // Maybe add a cooldown later
  };

  return (
    <div className="game-view">
      <h3 className="view-title">Send an Emoji</h3>
      <p className="view-description">
        The Police is investigating. Send an emoji to the feed to help (or confuse) them.
      </p>
      <div className="emoji-picker">
        {emojis.map(emoji => (
          <button 
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QueenThiefView; 