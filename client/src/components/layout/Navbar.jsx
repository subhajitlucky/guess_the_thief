import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../../styles/Navbar.css'

function Navbar({ username, isConnected }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand" onClick={() => navigate('/')}>
            <div className="navbar-logo">
              🕵️ Guess the Thief
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-desktop">
            <div className="navbar-nav">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`navbar-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Connection Status */}
            <div className="navbar-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>

              {username && (
                <div className="username-badge">
                  👤 {username}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="navbar-mobile-toggle">
            <button onClick={() => setIsOpen(!isOpen)} className="hamburger-btn">
              <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="navbar-mobile">
          <div className="navbar-mobile-nav">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href)
                  setIsOpen(false)
                }}
                className={`navbar-mobile-link ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.name}
              </button>
            ))}

            {/* Mobile Status */}
            <div className="navbar-mobile-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>

              {username && (
                <div className="username-badge">
                  👤 {username}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar 