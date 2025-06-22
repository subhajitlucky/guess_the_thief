import { useState, useEffect } from 'react'
import '../styles/UsernameForm.css'

function UsernameForm({ onUsernameSubmit, isSubmitting, setIsSubmitting }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      alert('Please enter a username!')
      return
    }

    setIsSubmitting(true)
    onUsernameSubmit(username.trim())
  }

  return (
    <div className="username-form">
      <h2>🎮 Guess the Thief</h2>
      <p>Enter your username</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          maxLength={20}
        />
        
        <button type="submit" disabled={isSubmitting || !username.trim()}>
          {isSubmitting ? 'Setting...' : 'Set Username'}
        </button>
      </form>
    </div>
  )
}

export default UsernameForm 