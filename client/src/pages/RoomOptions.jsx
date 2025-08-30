import { useNavigate } from 'react-router-dom'
import '../styles/RoomOptions.css'

function RoomOptions({ username }) {
  const navigate = useNavigate()

  return (
    <div className="room-options">
      <div className="welcome-header">
        <h1>🕵️ Guess the Thief</h1>
        <h2>Hey {username}!</h2>
        <p>Choose an option to start playing</p>
      </div>

      <div className="options-container">
        <div 
          className="option-card"
          onClick={() => navigate('/create')}
        >
          <div className="option-icon">🏠</div>
          <h3 className="option-title">Create Room</h3>
          <p className="option-description">Start a new game and invite friends</p>
        </div>

        <div 
          className="option-card"
          onClick={() => navigate('/join')}
        >
          <div className="option-icon">🚪</div>
          <h3 className="option-title">Join Room</h3>
          <p className="option-description">Enter a room code to join an existing game</p>
        </div>
      </div>
    </div>
  )
}

export default RoomOptions 