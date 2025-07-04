import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/JoinRoom.css'

function JoinRoom({ socket, username }) {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    // Listen for join room responses
    socket.on('room-joined', (data) => {
      console.log('Successfully joined room:', data.roomCode)
      setIsJoining(false)
      // Navigate to lobby instead of showing alert
      navigate(`/lobby/${data.roomCode}`)
    })

    socket.on('room-error', (data) => {
      alert(`Error: ${data.message}`)
      setIsJoining(false)
    })

    return () => {
      socket.off('room-joined')
      socket.off('room-error')
    }
  }, [socket, navigate])

  const handleJoinRoom = (e) => {
    e.preventDefault()
    
    if (!roomCode.trim()) {
      alert('Please enter a room code!')
      return
    }

    if (roomCode.trim().length !== 6) {
      alert('Room code must be 6 characters!')
      return
    }

    setIsJoining(true)
    console.log('Joining room:', roomCode.trim().toUpperCase())
    socket.emit('join-room', { 
      roomCode: roomCode.trim().toUpperCase(), 
      username 
    })
  }

  return (
    <div className="join-room">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2>🚪 Join Room</h2>
      </div>

      <div className="join-section">
        <div className="info">
          <h3>Join a Game</h3>
          <p>Enter the room code shared by your friend</p>
          <p>Room codes are 6 characters long</p>
        </div>

        <form onSubmit={handleJoinRoom} className="join-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={isJoining}
              className="room-code-input"
            />
          </div>

          <button 
            type="submit"
            className="join-btn"
            disabled={isJoining || !roomCode.trim()}
          >
            {isJoining ? 'Joining Room...' : 'Join Room'}
          </button>
        </form>

        <div className="help-text">
          <p>💡 Ask your friend for the 6-character room code</p>
        </div>
      </div>
    </div>
  )
}

export default JoinRoom 