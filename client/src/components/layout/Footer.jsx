import Icon from '../icons/Icon'

import '../../styles/Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  const features = [
    { icon: 'users', text: '4-Player Multiplayer' },
    { icon: 'lock', text: 'Real-time Security' },
    { icon: 'scale', text: 'Open Source' },
  ]

  const rules = [
    { icons: ['crown'], text: 'King commands the Police to find the Thief' },
    { icons: ['shield'], text: 'Police investigates and makes their guess' },
    { icons: ['gem', 'mask'], text: 'Queen & Thief send confusing emojis' },
    { icons: ['trophy'], text: 'Score points and become the champion!' },
  ]

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__body">
          {/* Brand Section */}
          <div className="footer__brand">
            <p className="footer__logo">
              <Icon name="fingerprint" size={18} className="footer__logo-mark" />
              <span>Guess the Thief</span>
            </p>
            <p className="footer__description">
              The ultimate social deduction game. Outsmart your friends, uncover the
              thief, and claim victory in this thrilling multiplayer experience.
            </p>
            <ul className="footer__features">
              {features.map((feature, index) => (
                <li key={index} className="footer__feature">
                  <Icon name={feature.icon} size={14} className="footer__feature-icon" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <p className="footer__made-with">
              <span className="footer__made-label">Built with</span>
              <span>React</span>
              <span className="footer__sep" aria-hidden="true">·</span>
              <span>Cloudflare Durable Objects</span>
            </p>
          </div>

          {/* Game Rules Section */}
          <div className="footer__section">
            <h2 className="footer__label">How to play</h2>
            <ul className="footer__rules">
              {rules.map((rule, index) => (
                <li key={index} className="footer__rule">
                  <span className="footer__rule-icons" aria-hidden="true">
                    {rule.icons.map((icon) => (
                      <Icon key={icon} name={icon} size={14} />
                    ))}
                  </span>
                  <span>{rule.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} Guess the Thief. Built for fun and learning.
          </p>

          <nav className="footer__links" aria-label="Footer">
            <a
              href="https://github.com"
              className="footer__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a href="#" className="footer__link">
              Discord
            </a>
            <a href="#" className="footer__link">
              Support
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
