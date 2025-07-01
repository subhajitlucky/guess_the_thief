import { useNavigate } from 'react-router-dom'
// import '../styles/RoomOptions.css'

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
        <button 
          className="option-btn create-btn"
          onClick={() => navigate('/create')}
        >
          🏠 Create Room
          <span>Start a new game</span>
        </button>

        <button 
          className="option-btn join-btn"
          onClick={() => navigate('/join')}
        >
          🚪 Join Room
          <span>Enter room code</span>
        </button>
      </div>
    </div>
  )
}

export default RoomOptions 