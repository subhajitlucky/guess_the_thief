import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/HeroPage.css'
import { motion } from 'framer-motion'
import { UserGroupIcon, ClockIcon, LightBulbIcon, TrophyIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/outline'
import { PlayIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

function HeroPage({ username, onUsernameSubmit, isSubmitting, setIsSubmitting }) {
  const navigate = useNavigate()
  const [usernameInput, setUsernameInput] = useState('')

  const handleUsernameSubmit = (e) => {
    e.preventDefault()
    if (!usernameInput.trim()) {
      alert('Please enter a username!')
      return
    }
    setIsSubmitting(true)
    onUsernameSubmit(usernameInput.trim())
  }

  const handlePlayClick = () => {
    if (username) {
      navigate('/')
    } else {
      document.getElementById('username-section').scrollIntoView({ behavior: 'smooth' })
    }
  }

  const features = [
    {
      icon: UserGroupIcon,
      title: '4-Player Multiplayer',
      description: 'Gather your friends for an intense social deduction experience'
    },
    {
      icon: ClockIcon,
      title: 'Real-time Gameplay',
      description: 'Lightning-fast rounds with live updates and instant reactions'
    },
    {
      icon: LightBulbIcon,
      title: 'Strategy & Deception',
      description: 'Use wit, cunning, and psychology to outsmart your opponents'
    },
    {
      icon: TrophyIcon,
      title: 'Competitive Scoring',
      description: 'Earn points based on your role and climb the leaderboard'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Your role is secret, rooms are private, no data stored'
    },
    {
      icon: StarIcon,
      title: 'Easy to Learn',
      description: 'Simple rules, deep gameplay, endless fun for all ages'
    }
  ]

  const roles = [
    {
      emoji: '👑',
      name: 'King',
      points: '1000 pts',
      description: 'Commands the Police to find the Thief',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      emoji: '👸',
      name: 'Queen',
      points: '500 pts',
      description: 'Supports the Police with subtle hints',
      gradient: 'from-pink-400 to-purple-500'
    },
    {
      emoji: '👮',
      name: 'Police',
      points: '300 pts',
      description: 'Investigates and arrests the Thief',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      emoji: '🥷',
      name: 'Thief',
      points: '300 pts',
      description: 'Hides in plain sight and avoids capture',
      gradient: 'from-gray-400 to-slate-600'
    }
  ]

  return (
    <div className="hero-page">
      {/* Hero Section */}
      <div className="hero-section">
        {/* Background Effects */}
        <div className="hero-background-effects">
          <div className="effect-1" />
          <div className="effect-2" />
          <div className="effect-3" />
        </div>

        <div className="hero-content-container">
          <div className="hero-content">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="main-title">
                <span className="title-gradient-1">Guess the</span>
                <br />
                <span className="title-gradient-2">Thief</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              The ultimate social deduction game. 🕵️ Outsmart your friends, uncover secrets, and
              claim victory in this thrilling 4-player multiplayer experience.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.button
                onClick={handlePlayClick}
                className="cta-button-play"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayIcon className="icon-sm" />
                <span>{username ? 'Continue Playing' : 'Start Playing'}</span>
                <ArrowRightIcon className="icon-xs arrow-icon" />
              </motion.button>

              {username && (
                <motion.div
                  className="welcome-message"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Welcome back, <span className="username-text">{username}</span>! 👋
                </motion.div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              className="stats-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {[
                { number: '4', label: 'Players' },
                { number: '10', label: 'Rounds' },
                { number: '∞', label: 'Fun' },
                { number: '🏆', label: 'Winner' }
              ].map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="roles-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              Choose Your <span className="title-gradient-1">Destiny</span>
            </h2>
            <p className="section-subtitle">
              Each role has unique abilities and scoring opportunities. Master them all!
            </p>
          </motion.div>

          <div className="roles-grid">
            {roles.map((role, index) => (
              <motion.div
                key={role.name}
                className="role-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="role-card-content">
                  <div className="role-emoji">{role.emoji}</div>
                  <h3 className="role-name">{role.name}</h3>
                  <div className={`role-points ${role.name.toLowerCase()}`}>{role.points}</div>
                  <p className="role-description">{role.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              Why You'll <span className="title-gradient-1">Love It</span>
            </h2>
            <p className="section-subtitle">
              Built with modern technology for the ultimate gaming experience
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  className="feature-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Icon className="feature-icon" />
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Username Section */}
      {!username && (
        <div id="username-section" className="username-section">
          <div className="username-container">
            <motion.div
              className="username-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="section-header">
                <h2 className="section-title-sm">Ready to Play?</h2>
                <p className="section-subtitle">Enter your username to get started</p>
              </div>

              <form onSubmit={handleUsernameSubmit} className="username-form">
                <div>
                  <input
                    type="text"
                    placeholder="Your username..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={20}
                    className="username-input"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || !usernameInput.trim()}
                  className="cta-button-form"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PlayIcon className="icon-sm" />
                  <span>{isSubmitting ? 'Setting up...' : 'Start Playing'}</span>
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroPage 