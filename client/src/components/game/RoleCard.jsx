function RoleCard({ role, emoji, description }) {
  return (
    <div className="role-card-section">
      <div className="role-card-header">
        <span className="role-emoji">{emoji}</span>
        <h3>Your Role: {role}</h3>
      </div>
      <p className="role-description">{description}</p>
      <div className="role-warning">
        🤫 Keep your role secret from other players!
      </div>
    </div>
  );
}

export default RoleCard; 