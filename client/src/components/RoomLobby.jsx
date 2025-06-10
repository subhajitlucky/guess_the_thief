import { useState, useEffect } from 'react'

function RoomLobby({ username, socket }) {
  // Room state
  const [currentRoom, setCurrentRoom] = useState('')
  const [roomPlayers, setRoomPlayers] = useState([])
  const [joinRoomInput, setJoinRoomInput] = useState('')
  const [isReady, setIsReady] = useState(false)

  // Socket events for room functionality
  useEffect(() => {
    // When room is created successfully
    socket.on('roomCreated', (data) => {
      console.log('🏠 Room created:', data.roomCode)
      setCurrentRoom(data.roomCode)
      setRoomPlayers(data.players)
    })

    // When room is updated (someone joined/left/ready status changed)
    socket.on('roomUpdate', (data) => {
      console.log('🔄 Room updated:', data.players)
      setCurrentRoom(data.roomCode)
      setRoomPlayers(data.players)
      
      // Update my ready status based on server data
      const myPlayer = data.players.find(p => p.username === username)
      if (myPlayer) {
        setIsReady(myPlayer.isReady)
      }
    })

    // Error handling
    socket.on('roomNotFound', () => {
      alert('Room not found! Check the code.')
    })

    socket.on('roomFull', () => {
      alert('Room is full! Maximum 4 players.')
    })

    // Game start success
    socket.on('gameStarted', (data) => {
      alert(`🎮 ${data.message}`)
      console.log('Game started! Time for role assignment...')
      // TODO: Navigate to game component
    })

    // Game start errors
    socket.on('notCreator', () => {
      alert('Only the room creator can start the game!')
    })

    socket.on('needMorePlayers', () => {
      alert('Need 4 players to start the game!')
    })

    socket.on('notAllReady', () => {
      alert('All players must be ready before starting!')
    })

    // Cleanup
    return () => {
      socket.off('roomCreated')
      socket.off('roomUpdate')
      socket.off('roomNotFound')
      socket.off('roomFull')
      socket.off('gameStarted')
      socket.off('notCreator')
      socket.off('needMorePlayers')
      socket.off('notAllReady')
    }
  }, [socket, username])

  // Create a new room
  const createRoom = () => {
    console.log('🏠 Creating room for:', username)
    console.log('🔌 Socket connected:', socket.connected)
    
    if (!socket.connected) {
      alert('Not connected to server! Please refresh.')
      return
    }
    
    socket.emit('createRoom', { username })
    console.log('📤 Create room request sent!')
  }

  // Join existing room
  const joinRoom = (e) => {
    e.preventDefault()
    if (joinRoomInput.trim()) {
      console.log('🚪 Joining room:', joinRoomInput)
      socket.emit('joinRoom', { 
        roomCode: joinRoomInput.toUpperCase(), 
        username 
      })
    }
  }

  // Toggle ready status
  const toggleReady = () => {
    console.log('🔄 Toggling ready status')
    socket.emit('toggleReady')
  }

  // Start game
  const startGame = () => {
    console.log('🎮 Starting game!')
    socket.emit('startGame')
  }

  // If not in a room, show create/join options
  if (!currentRoom) {
    return (
      <div>
        <h2>Hello, {username}! 👋</h2>
        
        <div>
          <h3>Create New Room</h3>
          <button onClick={createRoom}>
            🏠 Create Room
          </button>
        </div>

        <div>
          <h3>Join Existing Room</h3>
          <form onSubmit={joinRoom}>
            <input
              type="text"
              placeholder="Enter room code (e.g., ABC123)"
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button type="submit" disabled={!joinRoomInput.trim()}>
              🚪 Join Room
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Show room info when in a room
  const readyCount = roomPlayers.filter(p => p.isReady).length
  const allPlayersReady = roomPlayers.length === 4 && readyCount === 4
  const isRoomCreator = roomPlayers.length > 0 && roomPlayers[0].username === username

  return (
    <div>
      <h2>Room: {currentRoom}</h2>
      <p>Share this code with friends!</p>
      
      <div>
        <h3>Players in Room ({roomPlayers.length}/4):</h3>
        {roomPlayers.map((player, index) => (
          <div 
            key={index}
            
          >
            👤 {player.username} 
            {player.isReady ? ' ✅ Ready' : ' ⏳ Not Ready'}
            {index === 0 && ' (Host)'}
          </div>
        ))}
      </div>

      {/* Ready button */}
      <div >
        <button 
          onClick={toggleReady}
          
        >
          {isReady ? '✅ Ready' : '⏳ Click when Ready'}
        </button>
      </div>

      {/* Ready status summary */}
      <div >
        <strong>Ready Status: {readyCount}/{roomPlayers.length} players ready</strong>
        {roomPlayers.length === 4 && readyCount < 4 && (
          <div >
            ⏳ Waiting for all players to be ready...
          </div>
        )}
      </div>

      {/* Show start button when all players ready */}
      {isRoomCreator && allPlayersReady && (
        <div >
          <h3>🎉 All players ready!</h3>
          <p>You can now start the game!</p>
          <button 
            onClick={startGame}
            
          >
            🎮 Start Game!
          </button>
        </div>
      )}

      {/* Show waiting messages */}
      {roomPlayers.length < 4 && (
        <div >
          ⏳ Waiting for more players... ({4 - roomPlayers.length} more needed)
        </div>
      )}

      {roomPlayers.length === 4 && !allPlayersReady && !isRoomCreator && (
        <div >
          🎯 Waiting for the host to start the game when everyone is ready
        </div>
      )}
    </div>
  )
}

export default RoomLobby 