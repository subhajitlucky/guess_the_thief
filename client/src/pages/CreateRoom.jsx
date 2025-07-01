import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// import '../styles/CreateRoom.css'

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
      </div>

      <div className="create-section">
        <div className="info">
          <h3>Start a New Game</h3>
          <p>Create a room and invite your friends</p>
          <p>You need 4 players total to start the game</p>
        </div>

        <button 
          className="create-btn"
          onClick={handleCreateRoom}
          disabled={isCreating}
        >
          {isCreating ? 'Creating Room...' : 'Create Room'}
        </button>
      </div>
    </div>
  )
}

export default CreateRoom 