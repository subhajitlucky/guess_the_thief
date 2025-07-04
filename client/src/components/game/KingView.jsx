function KingView({ onKingAction }) {
  return (
    <div className="game-view">
      <h3 className="view-title">King's Turn</h3>
      <p className="view-description">
        You are the King! Send a message to reveal the Police to everyone.
      </p>
      <button onClick={onKingAction} className="action-btn">
        💬 "Who is the Police here? Find the thief in 1 minute!"
      </button>
    </div>
  );
}

export default KingView; 