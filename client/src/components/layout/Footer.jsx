import '../../styles/Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  const features = [
    { icon: '👥', text: '4-Player Multiplayer' },
    { icon: '🛡️', text: 'Real-time Security' },
    { icon: '💻', text: 'Open Source' },
  ]

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <div className="footer-logo">
                🕵️ Guess the Thief
              </div>
              <p className="footer-description">
                The ultimate social deduction game. Outsmart your friends, uncover the thief, 
                and claim victory in this thrilling multiplayer experience.
              </p>
              <div className="footer-made-with">
                <span>Made with</span>
                <span className="footer-heart">❤️</span>
                <span>using React & Socket.IO</span>
              </div>
            </div>

            {/* Features Section */}
            <div className="footer-section">
              <h3 className="footer-section-title">Game Features</h3>
              <div className="footer-features">
                {features.map((feature, index) => (
                  <div key={index} className="footer-feature">
                    <span className="footer-feature-icon">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Rules Section */}
            <div className="footer-section">
              <h3 className="footer-section-title">How to Play</h3>
              <div className="footer-rules">
                <div className="footer-rule">
                  <span className="footer-rule-emoji">👑</span>
                  <span>King commands the Police to find the Thief</span>
                </div>
                <div className="footer-rule">
                  <span className="footer-rule-emoji">👮</span>
                  <span>Police investigates and makes their guess</span>
                </div>
                <div className="footer-rule">
                  <span className="footer-rule-emoji">👸</span>
                  <span>Queen & Thief send confusing emojis</span>
                </div>
                <div className="footer-rule">
                  <span className="footer-rule-emoji">🏆</span>
                  <span>Score points and become the champion!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              © {currentYear} Guess the Thief. Built for fun and learning.
            </div>
            
            <div className="footer-links">
              <a href="https://github.com" className="footer-link" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="#" className="footer-link">
                Discord
              </a>
              <a href="#" className="footer-link">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 