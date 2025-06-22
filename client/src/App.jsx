import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import io from 'socket.io-client'
import UsernameForm from './components/UsernameForm'
import RoomOptions from './pages/RoomOptions'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import RoomLobby from './pages/RoomLobby'
import GamePage from './pages/GamePage'
import './App.css'

// Connect to our server
const socket = io('http://localhost:4000')

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [hasUsername, setHasUsername] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Handle connection
    socket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
      setHasUsername(false)
      setUsername('')
      setIsSubmitting(false)
    })

    // Handle username response
    socket.on('username-success', (data) => {
      console.log('Username set successfully:', data.username)
      setUsername(data.username)
      setHasUsername(true)
      setIsSubmitting(false)
      // Reset URL to home page when username is first set
      window.history.replaceState(null, '', '/')
    })

    socket.on('username-error', (data) => {
      alert(data.message)
      setHasUsername(false)
      setIsSubmitting(false)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('username-success')
      socket.off('username-error')
    }
  }, [])

  const handleUsernameSubmit = (enteredUsername) => {
    console.log('Sending username to server:', enteredUsername)
    socket.emit('set-username', { username: enteredUsername })
  }

  // Show connection status and username form if not connected or no username
  if (!isConnected) {
    return (
      <div className="App">
        <div className="status">🔴 Connecting...</div>
        <div>Connecting to server...</div>
      </div>
    )
  }

  if (!hasUsername) {
    return (
      <div className="App">
        <div className="status">🟢 Connected</div>
        <UsernameForm 
          onUsernameSubmit={handleUsernameSubmit}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    )
  }

  // Main app with router
  return (
    <div className="App">
      <div className="status">🟢 Connected</div>
      
      <Router>
        <Routes>
          <Route path="/" element={<RoomOptions username={username} />} />
          <Route path="/create" element={<CreateRoom socket={socket} username={username} />} />
          <Route path="/join" element={<JoinRoom socket={socket} username={username} />} />
          <Route path="/lobby/:roomCode" element={<RoomLobby socket={socket} username={username} />} />
          <Route path="/game" element={<GamePage socket={socket} username={username} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
