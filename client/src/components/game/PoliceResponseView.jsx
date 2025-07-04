function PoliceResponseView({ onPoliceRespond }) {
  return (
    <div className="game-view">
      <h3 className="view-title">Police Response</h3>
      <p className="view-description">
        The King has called for you! Respond to identify yourself as the Police.
      </p>
      <button onClick={onPoliceRespond} className="action-btn">
        💬 "Your Majesty, I am the Police! I will find the thief in 1 minute!"
      </button>
    </div>
  );
}

export default PoliceResponseView; 