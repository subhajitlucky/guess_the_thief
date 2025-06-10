import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import UsernameForm from './components/UsernameForm'
import RoomLobby from './components/RoomLobby'
import './App.css'

// Connect to our server
const socket = io('http://localhost:4000')

function App() {
  // Main app state
  const [currentUsername, setCurrentUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  // Socket connection events
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setIsConnected(false)
    })

    // Cleanup
    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  // Handle username being set
  const handleUsernameSet = (username) => {
    setCurrentUsername(username)
    console.log('🎯 App: Username set to:', username)
  }

  return (
    <div className="App">
      <h1>🕵️ Guess the Thief</h1>
      
      {/* Step 1: Set Username */}
      {!currentUsername ? (
        <UsernameForm 
          onUsernameSet={handleUsernameSet} 
          isConnected={isConnected}
        />
      ) : (
        /* Step 2: Room System */
        <RoomLobby 
          username={currentUsername} 
          socket={socket}
        />
      )}
    </div>
  )
}

export default App
