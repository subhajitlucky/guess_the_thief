function KingView({ onKingAction }) {
  return (
    <div>
      <h4>King's Court</h4>
      <p>You are the King. It is your duty to command the Police.</p>
      <button onClick={onKingAction}>
        "Who is the Police here? Find the thief in 1 minute!"
      </button>
    </div>
  );
}

export default KingView; 