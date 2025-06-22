import '../styles/GamePage.css'

function GamePage({ socket, username }) {
  return (
    <div className="game-page">
      <div className="game-header">
        <h1>🕵️ Guess the Thief</h1>
        <h2>Game Started!</h2>
      </div>

      <div className="game-content">
        <div className="welcome-message">
          <h3>🎉 Welcome to the game, {username}!</h3>
          <p>The game mechanics will be implemented from here.</p>
        </div>

        <div className="placeholder">
          <p>🎮 Game placeholder</p>
          <p>This is where the actual game will happen!</p>
        </div>
      </div>
    </div>
  )
}

export default GamePage 