function QueenThiefView({ onSendEmoji }) {
  const emojis = ['😊', '😂', '🤔', '😢', '😠', '😱'];
  
  return (
    <div>
      <h4>Royal Court</h4>
      <p>You are a subject in the court. The Police is watching.</p>
      <p>Send an emoji to confuse them:</p>
      {emojis.map(emoji => (
        <button key={emoji} onClick={() => onSendEmoji(emoji)}>{emoji}</button>
      ))}
    </div>
  );
}

export default QueenThiefView; 