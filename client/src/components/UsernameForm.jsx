import { useState } from 'react'

function UsernameForm({ onUsernameSet, isConnected }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim()) {
      console.log('✅ Username set:', username.trim())
      onUsernameSet(username.trim())
    }
  }

  return (
    <div>
      <h2>Enter Your Username</h2>
      
      {/* Show connection status */}
      <div >
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          disabled={!username.trim() || !isConnected}
        >
          Set Username
        </button>
      </form>
    </div>
  )
}

export default UsernameForm 