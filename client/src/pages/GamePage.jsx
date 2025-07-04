import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/GamePage.css';
import '../styles/GameComponents.css';

// Import the new components
import RoleSpinner from '../components/game/RoleSpinner';
import RoleCard from '../components/game/RoleCard';
import KingView from '../components/game/KingView';
import PoliceView from '../components/game/PoliceView';
import PoliceResponseView from '../components/game/PoliceResponseView';
import QueenThiefView from '../components/game/QueenThiefView';
import RoundOverView from '../components/game/RoundOverView';
import GameOverView from '../components/game/GameOverView';
import PublicChat from '../components/game/PublicChat';
import InvestigationTimer from '../components/game/InvestigationTimer';
import ScoreBoard from '../components/game/ScoreBoard';

function GamePage({ socket, username }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [myRole, setMyRole] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [gameMessage, setGameMessage] = useState('');
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || '');
  const [finalScores, setFinalScores] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    console.log('GamePage: Setting up socket listeners for user:', username, 'in room:', roomCode);
    
    // Join the room if we have a room code
    if (roomCode) {
      socket.emit('join-room-for-game', { roomCode });
    }

    socket.on('game-started', (data) => {
      console.log('🎮 Game started event received:', data);
      console.log(`🎭 My role is: ${data.yourRole} for Round ${data.gameState?.round}`);
      
      if (!data.yourRole) {
        console.error('❌ No role received in game-started event!');
        return;
      }
      
      // Clear previous state for new round
      setMyRole('');
      
      // Set new round data
      setMyRole(data.yourRole);
      setPlayers(data.allPlayers);
      setGameState(data.gameState);
      setGameMessage(data.message);
      setFinalScores(null);
      
      // Clear chat only for Round 1
      if (data.gameState && data.gameState.round === 1) {
        setChatMessages([]);
      }
      
      console.log(`✅ Round ${data.gameState?.round} role set successfully: ${data.yourRole}`);
      console.log(`🎯 Game state phase: ${data.gameState?.phase}`);
    });

    socket.on('game-update', (data) => {
      console.log('🔄 Game update received:', data);
      if (data.gameState) setGameState(data.gameState);
      if (data.message) setGameMessage(data.message);
    });

    socket.on('emoji-broadcast', (data) => {
        const chatEntry = {
          from: data.from,
          text: data.emoji,
          timestamp: new Date().toLocaleTimeString(),
          type: 'emoji'
        };
        setChatMessages(prev => [...prev, chatEntry]);
    });

    socket.on('chat-message', (data) => {
        console.log('💬 Chat message received:', data);
        setChatMessages(prevMessages => [...prevMessages, data]);
    });

    socket.on('game-over', (data) => {
        setGameMessage(data.message);
        setFinalScores(data.scores);
        setGameState(null);
    });

    socket.on('game-error', (error) => {
        console.error('🚨 Game error:', error);
        alert('Game Error: ' + error.message);
    });

    socket.on('error', (error) => {
        console.error('🚨 Socket error:', error);
    });

    return () => {
      console.log('🧹 Cleaning up GamePage socket listeners');
      socket.off('game-started');
      socket.off('game-update');
      socket.off('emoji-broadcast');
      socket.off('chat-message');
      socket.off('game-over');
      socket.off('game-error');
      socket.off('error');
    };
  }, [socket, username, roomCode]);

  const handleKingAction = () => {
    socket.emit('king-reveals-police', { roomCode });
  };

  const handlePoliceRespond = () => {
    socket.emit('police-responds', { roomCode });
  };

  const handlePoliceGuess = (suspectUsername) => {
    socket.emit('police-guess-thief', { roomCode, guess: suspectUsername });
  };
  
  const handleSendEmoji = (emoji) => {
      socket.emit('send-emoji', { roomCode, emoji, from: username });
  };

  const handleLeaveGame = () => {
      socket.emit('leave-game', { roomCode });
      navigate('/');
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      'King': 'Identify the Police and oversee the realm.',
      'Queen': 'Support the Police with subtle hints.',
      'Police': 'Find and arrest the Thief before nightfall!',
      'Thief': 'Avoid detection and outsmart the Police!'
    };
    return descriptions[role] || 'Unknown role';
  };

  const getRoleEmoji = (role) => {
    const emojis = {
      'King': '👑',
      'Queen': '👸',
      'Police': '👮',
      'Thief': '🥷'
    };
    return emojis[role] || '❓';
  };

  const renderCurrentPhase = () => {
    if (finalScores) {
        return <GameOverView message={gameMessage} scores={finalScores} onLeave={handleLeaveGame} />;
    }

    if (!gameState) {
      return <p>Waiting for game to start...</p>;
    }

    if (gameState.phase === 'role-spinning') {
        return <RoleSpinner />;
    }
    
    switch(gameState.phase) {
        case 'king-turn':
            if (myRole === 'King') return <KingView onKingAction={handleKingAction} />;
            return <p>Waiting for the King to make a move...</p>;

        case 'waiting-police-response':
            if (myRole === 'Police') return <PoliceResponseView onPoliceRespond={handlePoliceRespond} />;
            return <p>Waiting for the Police to respond...</p>;

        case 'police-investigation':
            if (myRole === 'Police') {
                // Police can guess any player except themselves
                const suspects = players.filter(p => p.username !== username);
                return (
                    <div>
                        <InvestigationTimer startTime={gameState.investigationStartTime} duration={60} />
                        <PoliceView phase={gameState.phase} suspects={suspects} onGuess={handlePoliceGuess} />
                    </div>
                );
            }
            if (myRole === 'Queen' || myRole === 'Thief') {
                return (
                    <div>
                        <InvestigationTimer startTime={gameState.investigationStartTime} duration={60} />
                        <QueenThiefView onSendEmoji={handleSendEmoji} />
                    </div>
                );
            }
            return (
                <div>
                    <InvestigationTimer startTime={gameState.investigationStartTime} duration={60} />
                    <p>The Police is investigating...</p>
                </div>
            );
        
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
        <button className="leave-btn" onClick={handleLeaveGame}>Leave Game</button>
        {gameState && (
          <div className="stats-row">
            <div className="game-info">
              <span>Round {gameState.round}</span>
              <span>Phase: {gameState.phase}</span>
            </div>
            <ScoreBoard scores={gameState.scores} />
          </div>
        )}
      </div>

      {myRole && gameState && gameState.phase !== 'role-spinning' && (
        <RoleCard 
          role={myRole} 
          emoji={getRoleEmoji(myRole)}
          description={getRoleDescription(myRole)}
        />
      )}

      {gameMessage && (
        <div className="game-message">
          <p>{gameMessage}</p>
        </div>
      )}

      <PublicChat messages={chatMessages} />

      <div className="game-content">
        {renderCurrentPhase()}
      </div>

      <div className="players-section">
        <h3>Players in Game</h3>
        <div className="players-grid">
          {players.map((player, index) => (
            <div key={index} className={`player-card ${player.username === username ? 'current-player' : ''}`}>
              <span className="player-name">
                {player.username}
                {player.isHost && ' 👑'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GamePage; 