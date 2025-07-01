import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/HeroPage.css'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center space-y-8">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                  Guess the
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Thief
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-purple-200 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              The ultimate social deduction game. 🕵️ Outsmart your friends, uncover secrets, 
              and claim victory in this thrilling 4-player multiplayer experience.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.button
                onClick={handlePlayClick}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayIcon className="h-6 w-6" />
                <span>{username ? 'Continue Playing' : 'Start Playing'}</span>
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>

              {username && (
                <motion.div
                  className="bg-purple-600/30 text-purple-200 px-6 py-3 rounded-xl border border-purple-500/30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Welcome back, <span className="font-semibold text-white">{username}</span>! 👋
                </motion.div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto"
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
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-purple-200/80 text-sm mt-2">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Destiny</span>
            </h2>
            <p className="text-xl text-purple-200/80 max-w-2xl mx-auto">
              Each role has unique abilities and scoring opportunities. Master them all!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={role.name}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300 hover:transform hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">{role.emoji}</div>
                  <h3 className="text-2xl font-bold text-white">{role.name}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${role.gradient} text-white`}>
                    {role.points}
                  </div>
                  <p className="text-purple-200/80 text-sm leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why You'll <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Love It</span>
            </h2>
            <p className="text-xl text-purple-200/80 max-w-2xl mx-auto">
              Built with modern technology for the ultimate gaming experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  className="bg-slate-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Icon className="h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-purple-200/80 leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Username Section */}
      {!username && (
        <div id="username-section" className="py-20 bg-slate-900/50">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Ready to Play?</h2>
                <p className="text-purple-200/80">Enter your username to get started</p>
              </div>

              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your username..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={20}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                  />
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !usernameInput.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PlayIcon className="h-5 w-5" />
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