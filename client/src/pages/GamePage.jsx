import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../styles/GamePage.css'; // CSS removed

// Import the new components
import RoleSpinner from '../components/game/RoleSpinner';
import RoleCard from '../components/game/RoleCard';
import KingView from '../components/game/KingView';
import PoliceView from '../components/game/PoliceView';
import QueenThiefView from '../components/game/QueenThiefView';
import EmojiFeed from '../components/game/EmojiFeed';
import RoundOverView from '../components/game/RoundOverView';
import GameOverView from '../components/game/GameOverView';

function GamePage({ socket, username }) {
  const navigate = useNavigate();
  const [myRole, setMyRole] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [gameMessage, setGameMessage] = useState('');
  const [isSpinning, setIsSpinning] = useState(true); // Start with spinner
  const [roomCode, setRoomCode] = useState('');
  const [emojiFeed, setEmojiFeed] = useState([]);
  const [finalScores, setFinalScores] = useState(null);

  useEffect(() => {
    // Listen for game start with role assignment
    socket.on('game-started', (data) => {
      console.log(`Game started! My role is: ${data.yourRole}`);
      setMyRole(data.yourRole);
      setPlayers(data.allPlayers);
      setGameState(data.gameState);
      setGameMessage(data.message);
      setRoomCode(data.roomCode || data.gameState.roomCode || '');
      setFinalScores(null); // Reset final scores
      
      setTimeout(() => setIsSpinning(false), 3000); // 3-second spin
    });

    // Listen for other game events (to be added later)
    socket.on('game-update', (data) => {
      console.log('Game update received:', data);
      setGameState(data.gameState);
      if (data.message) setGameMessage(data.message);
    });

    socket.on('emoji-broadcast', (data) => {
        setEmojiFeed(prevFeed => [...prevFeed, data]);
    });

    socket.on('game-over', (data) => {
        setGameMessage(data.message);
        setFinalScores(data.scores);
        setGameState(null); // End the game state
    });

    // Cleanup listeners
    return () => {
      socket.off('game-started');
      socket.off('game-update');
      socket.off('emoji-broadcast');
      socket.off('game-over');
    };
  }, [socket]);

  const handleKingAction = () => {
    socket.emit('king-reveals-police', { roomCode });
  };

  const handlePoliceGuess = (suspectUsername) => {
    socket.emit('police-guess-thief', { roomCode, guess: suspectUsername });
  };
  
  const handleSendEmoji = (emoji) => {
      socket.emit('send-emoji', { roomCode, emoji, from: username });
  };

  const handleLeaveGame = () => {
      navigate('/');
  };

  // Helper function to get role description
  const getRoleDescription = (role) => {
    const descriptions = {
      'King': 'Identify the Police and oversee the realm.',
      'Queen': 'Support the Police with subtle hints.',
      'Police': 'Find and arrest the Thief before nightfall!',
      'Thief': 'Avoid detection and outsmart the Police!'
    };
    return descriptions[role] || 'Unknown role';
  };

  // Helper function to get role emoji
  const getRoleEmoji = (role) => {
    const emojis = {
      'King': '👑',
      'Queen': '👸',
      'Police': '👮',
      'Thief': '🥷'
    };
    return emojis[role] || '❓';
  };

  // The "brains" function that decides which component to show
  const renderCurrentPhase = () => {
    if (finalScores) {
        return <GameOverView message={gameMessage} scores={finalScores} onLeave={handleLeaveGame} />;
    }

    if (!gameState) return <p>Waiting for game to start...</p>;
    const { phase } = gameState;

    if (isSpinning && phase === 'role-spinning') {
        return <RoleSpinner />;
    }
    
    switch(phase) {
        case 'king-turn':
            if (myRole === 'King') return <KingView onKingAction={handleKingAction} />;
            return <p>Waiting for the King to make a move...</p>;

        case 'police-investigation':
            if (myRole === 'Police') {
                const kingUsername = players.find(p => p.role === 'King')?.username;
                const suspects = players.filter(p => p.username !== username && p.username !== kingUsername);
                return <PoliceView phase={phase} suspects={suspects} onGuess={handlePoliceGuess} />;
            }
            if (myRole === 'Queen' || myRole === 'Thief') {
                return <QueenThiefView onSendEmoji={handleSendEmoji} />;
            }
            return <p>The Police is investigating...</p>;
        
        case 'round-over':
            return <RoundOverView message={gameMessage} scores={gameState.scores} />;

        default:
            return <p>The game is about to begin...</p>;
    }
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>🕵️ Guess the Thief</h1>
        <h2>Game in Progress</h2>
        {gameState && (
          <div className="game-info">
            <span>Round {gameState.round}</span> • 
            <span>Phase: {gameState.phase}</span>
          </div>
        )}
      </div>

      {/* Role Display - This is private to each player */}
      {isSpinning && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Spinning for your role...</p>
        </div>
      )}

      {!isSpinning && myRole && (
        <div className="role-section">
          <div className="role-card">
            <div className="role-header">
              <span className="role-emoji">{getRoleEmoji(myRole)}</span>
              <h3>Your Role: {myRole}</h3>
            </div>
            <p className="role-description">
              {getRoleDescription(myRole)}
            </p>
            <div className="role-warning">
              🤫 Keep your role secret from other players!
            </div>
          </div>
        </div>
      )}

      {/* Game Message */}
      {gameMessage && (
        <div className="game-message">
          <p>{gameMessage}</p>
        </div>
      )}

      {/* Players List (without roles) */}
      <div className="players-section">
        <h3>Players in Game</h3>
        <div className="players-grid">
          {players.map((player, index) => (
            <div key={index} className={`player-card ${player.username === username ? 'current-player' : ''}`}>
              <span className="player-name">
                {player.username}
                {player.isHost && ' 👑'}
                {player.username === username && ' (You)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Phase Content */}
      <div className="game-content">
        {renderCurrentPhase()}
      </div>

      {/* Live Emoji Feed */}
      <div className="emoji-feed">
        <h3>Live Emoji Feed:</h3>
        <EmojiFeed feed={emojiFeed} />
      </div>
    </div>
  )
}

export default GamePage 