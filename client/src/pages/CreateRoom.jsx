import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CreateRoom.css'

function CreateRoom({ socket, username }) {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)

  // Generate 6-character room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  useEffect(() => {
    // Listen for room creation success
    socket.on('room-created', (data) => {
      console.log('Room created:', data.roomCode)
      setIsCreating(false)
      // Navigate to lobby instead of showing room code
      navigate(`/lobby/${data.roomCode}`)
    })

    socket.on('room-error', (data) => {
      alert(`Error: ${data.message}`)
      setIsCreating(false)
    })

    return () => {
      socket.off('room-created')
      socket.off('room-error')
    }
  }, [socket, navigate])

  const handleCreateRoom = () => {
    setIsCreating(true)
    const newRoomCode = generateRoomCode()
    console.log('Creating room with code:', newRoomCode)
    socket.emit('create-room', { roomCode: newRoomCode, username })
  }

  return (
    <div className="create-room">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2>🏠 Create Room</h2>
        <div style={{ width: '74px' }}></div> {/* Spacer to balance the layout */}
      </div>

      <div className="create-section">
        <div className="game-card">
          <div className="game-card-icon">🎮</div>
          <h3>Start a New Game</h3>
          
          <p>Gather your friends for an exciting game of deception and deduction</p>
          <p>Perfect for 4 players - each with a unique role to play</p>
          
          <div className="players-info">
            <div className="player-spot filled">1</div>
            <div className="player-spot">2</div>
            <div className="player-spot">3</div>
            <div className="player-spot">4</div>
          </div>
          
          <div className="requirements">
            <h4>Game Requirements</h4>
            <ul>
              <li>Exactly 4 players needed to start</li>
              <li>Each player gets a secret role</li>
              <li>One round takes approximately 5-10 minutes</li>
              <li>No experience necessary - easy to learn!</li>
            </ul>
          </div>
        </div>
        
        <div className="create-btn-container">
          <button 
            className="create-btn"
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            <span>🏠</span>
            <span>{isCreating ? 'Creating Room...' : 'Create Game Room'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom 