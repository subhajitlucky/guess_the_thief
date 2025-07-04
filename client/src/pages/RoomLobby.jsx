import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/RoomLobby.css'

// Import the new lobby components
import LobbyHeader from '../components/lobby/LobbyHeader'
import PlayerList from '../components/lobby/PlayerList'
import LobbyActions from '../components/lobby/LobbyActions'

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
      navigate('/game', { state: { roomCode } })
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

  const handleToggleReady = () => {
    console.log('Toggling ready state')
    socket.emit('toggle-ready', { roomCode, username })
  }

  const handleStartGame = () => {
    if (canStart) {
      console.log('Starting game')
      socket.emit('start-game', { roomCode })
    }
  }

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
  }

  const handleLeaveRoom = () => {
    socket.emit('leave-room', { roomCode })
    navigate('/')
  }

  return (
    <div className="room-lobby">
      <LobbyHeader 
        roomCode={roomCode}
        onCopy={handleCopyRoomCode}
        onLeave={handleLeaveRoom}
      />
      <hr className="lobby-divider" />
      <PlayerList players={players} currentUser={username} />
      <hr className="lobby-divider" />
      <LobbyActions 
        isHost={isHost}
        canStart={canStart}
        isReady={isReady}
        onToggleReady={handleToggleReady}
        onStartGame={handleStartGame}
      />
      <hr className="lobby-divider" />
      <div className="lobby-info">
        <p>💡 Share the room code with your friends to invite them!</p>
        <p>🎯 Game will start when all 4 players are ready</p>
      </div>
    </div>
  )
}

export default RoomLobby 