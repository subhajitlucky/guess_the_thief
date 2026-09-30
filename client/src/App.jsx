import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import socket from './socket'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HeroPage from './pages/HeroPage'
import RoomOptions from './pages/RoomOptions'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import RoomLobby from './pages/RoomLobby'
import GamePage from './pages/GamePage'
import './styles/global.css'

function App() {
  const [username, setUsername] = useState('')
  const [hasUsername, setHasUsername] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  // Identity is no longer negotiated with the server. The room lives in the
  // socket path and the name travels in the query string, so there is no
  // set-username handshake to wait on — the name is simply held here until
  // CreateRoom or JoinRoom opens the socket.
  const handleUsernameSubmit = (enteredUsername) => {
    setUsername(enteredUsername)
    setHasUsername(true)
    setIsSubmitting(false)
    window.history.replaceState(null, '', '/')
  }

  const renderHomePage = () => {
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
