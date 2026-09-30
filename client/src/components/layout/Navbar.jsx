import Icon from '../icons/Icon'

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
    <nav className="navbar" aria-label="Primary">
      <div className="navbar__inner">
        <button
          type="button"
          className="navbar__brand"
          onClick={() => navigate('/')}
          aria-label="Guess the Thief — home"
        >
          <Icon name="magnify" size={20} className="navbar__mark" />
          <span className="navbar__wordmark">Guess the Thief</span>
        </button>

        {/* Desktop Navigation */}
        <div className="navbar__desktop">
          <ul className="navbar__nav">
            {navigation.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={`navbar__link ${isActive(item.href) ? 'is-active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>

          {/* Connection Status */}
          <div className="navbar__status">
            {username && (
              <span className="navbar__user">
                <Icon name="user" size={14} className="navbar__user-icon" />
                <span className="navbar__user-name">{username}</span>
              </span>
            )}

            <p
              className={`navbar__conn ${isConnected ? 'is-on' : 'is-off'}`}
              role="status"
              aria-live="polite"
              aria-label={
                isConnected
                  ? 'Connection status: connected'
                  : 'Connection status: connecting'
              }
            >
              <span className="navbar__dot" aria-hidden="true" />
              <span className="navbar__conn-text">
                {isConnected ? 'Connected' : 'Connecting…'}
              </span>
            </p>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="navbar__mobile-toggle">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="navbar__toggle"
            aria-expanded={isOpen}
            aria-controls="navbar-mobile-panel"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`navbar__burger ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="navbar__panel" id="navbar-mobile-panel">
          <ul className="navbar__panel-nav">
            {navigation.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(item.href)
                    setIsOpen(false)
                  }}
                  className={`navbar__panel-link ${isActive(item.href) ? 'is-active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile Status */}
          <div className="navbar__panel-status">
            <p
              className={`navbar__conn ${isConnected ? 'is-on' : 'is-off'}`}
              role="status"
              aria-live="polite"
              aria-label={
                isConnected
                  ? 'Connection status: connected'
                  : 'Connection status: connecting'
              }
            >
              <span className="navbar__dot" aria-hidden="true" />
              <span className="navbar__conn-text">
                {isConnected ? 'Connected' : 'Connecting…'}
              </span>
            </p>

            {username && (
              <span className="navbar__user">
                <Icon name="user" size={14} className="navbar__user-icon" />
                <span className="navbar__user-name">{username}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
