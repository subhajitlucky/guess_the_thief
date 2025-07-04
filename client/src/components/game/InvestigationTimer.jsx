import { useState, useEffect } from 'react';

function InvestigationTimer({ startTime, duration = 60, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!startTime || startTime <= 0) {
      console.log('⏰ No valid start time for timer');
      return;
    }

    console.log('⏰ Starting timer with startTime:', startTime, 'duration:', duration);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        if (onTimeUp) onTimeUp();
      }
    }, 1000);

    return () => {
      console.log('⏰ Cleaning up timer');
      clearInterval(interval);
    };
  }, [startTime, duration, onTimeUp]);

  const getTimerColor = () => {
    if (timeLeft > 20) return '#22c55e'; // Green
    if (timeLeft > 10) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="investigation-timer">
      <div className="timer-label">⏱️ Investigation Time:</div>
      <div 
        className="timer-display" 
        style={{ color: getTimerColor() }}
      >
        {timeLeft}s
      </div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar"
          style={{ 
            width: `${(timeLeft / duration) * 100}%`,
            backgroundColor: getTimerColor()
          }}
        />
      </div>
    </div>
  );
}

export default InvestigationTimer; 