import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/RoomLobby.css'

function RoomLobby({ socket, username }) {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [canStart, setCanStart] = useState(false)

  useEffect(() => {
    console.log('Joining lobby for room:', roomCode)
    
    // Request current lobby state
    socket.emit('get-lobby-state', { roomCode })

    // Listen for lobby updates
    socket.on('lobby-update', (data) => {
      console.log('Lobby update:', data)
      setPlayers(data.players)
      setIsHost(data.host === socket.id)
      setCanStart(data.canStart)
      
      // Find current user's ready state
      const currentPlayer = data.players.find(p => p.username === username)
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady)
      }
    })

    // Listen for game start
    socket.on('game-started', (data) => {
      console.log('Game started!')
      navigate('/game')
    })

    socket.on('lobby-error', (data) => {
      alert(`Error: ${data.message}`)
      navigate('/')
    })

    return () => {
      socket.off('lobby-update')
      socket.off('game-started')
      socket.off('lobby-error')
    }
  }, [socket, roomCode, username, navigate])

  const toggleReady = () => {
    console.log('Toggling ready state')
    socket.emit('toggle-ready', { roomCode, username })
  }

  const startGame = () => {
    if (!canStart) {
      alert('All players must be ready to start!')
      return
    }
    
    console.log('Starting game')
    socket.emit('start-game', { roomCode })
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Room code copied!')
  }

  const leaveRoom = () => {
    socket.emit('leave-room', { roomCode })
    navigate('/')
  }

  return (
    <div className="room-lobby">
      <div className="lobby-header">
        <div className="room-info">
          <h2>🏠 Room Lobby</h2>
          <div className="room-code-section">
            <span className="room-code">Room: {roomCode}</span>
            <button className="copy-btn-small" onClick={copyRoomCode}>
              📋
            </button>
          </div>
        </div>
        <button className="leave-btn" onClick={leaveRoom}>
          ← Leave Room
        </button>
      </div>

      <div className="players-section">
        <div className="players-header">
          <h3>Players ({players.length}/4)</h3>
          <div className="ready-count">
            Ready: {players.filter(p => p.isReady).length}/{players.length}
          </div>
        </div>

        <div className="players-list">
          {players.map((player, index) => (
            <div key={player.username} className={`player-card ${player.isReady ? 'ready' : 'not-ready'}`}>
              <div className="player-info">
                <span className="player-name">
                  {player.username}
                  {player.isHost && ' 👑'}
                  {player.username === username && ' (You)'}
                </span>
                <span className="player-status">
                  {player.isReady ? '✅ Ready' : '⏳ Not Ready'}
                </span>
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: 4 - players.length }).map((_, index) => (
            <div key={`empty-${index}`} className="player-card empty-slot">
              <div className="player-info">
                <span className="player-name">Waiting for player...</span>
                <span className="player-status">🔄</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-actions">
        <button 
          className={`ready-btn ${isReady ? 'ready' : 'not-ready'}`}
          onClick={toggleReady}
        >
          {isReady ? '✅ Ready' : '⏳ Not Ready'}
        </button>

        {isHost && (
          <button 
            className={`start-btn ${canStart ? 'can-start' : 'cannot-start'}`}
            onClick={startGame}
            disabled={!canStart}
          >
            {canStart ? '🚀 Start Game' : `🔒 Need ${4 - players.length} more players & all ready`}
          </button>
        )}
      </div>

      <div className="lobby-info">
        <p>💡 Share the room code with your friends to invite them!</p>
        <p>🎯 Game will start when all 4 players are ready</p>
      </div>
    </div>
  )
}

export default RoomLobby 