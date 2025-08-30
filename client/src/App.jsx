import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import io from 'socket.io-client'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HeroPage from './pages/HeroPage'
import RoomOptions from './pages/RoomOptions'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import RoomLobby from './pages/RoomLobby'
import GamePage from './pages/GamePage'
import './styles/global.css'

// Environment-aware socket connection
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? '' : 'http://localhost:4000')
const socket = io(SOCKET_URL)

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [hasUsername, setHasUsername] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Handle connection events
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

    // Handle username events
    socket.on('username-success', (data) => {
      console.log('Username set successfully:', data.username)
      setUsername(data.username)
      setHasUsername(true)
      setIsSubmitting(false)
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

  // Render content based on connection and username state
  const renderHomePage = () => {
    if (!isConnected) {
      return (
        <div className="connecting-container">
          <div className="connecting-icon">🔗</div>
          <div className="connecting-text">Connecting to server...</div>
        </div>
      )
    }
    
    if (!hasUsername) {
      return (
        <HeroPage 
          username={username}
          onUsernameSubmit={handleUsernameSubmit}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      )
    }
    
    return <RoomOptions username={username} />
  }

  return (
    <div className="App">
      <Router>
        <div className="app-container">
          <Navbar username={username} isConnected={isConnected} />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={renderHomePage()} />
              <Route path="/create" element={<CreateRoom socket={socket} username={username} />} />
              <Route path="/join" element={<JoinRoom socket={socket} username={username} />} />
              <Route path="/lobby/:roomCode" element={<RoomLobby socket={socket} username={username} />} />
              <Route path="/game" element={<GamePage socket={socket} username={username} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </div>
  )
}

export default App
