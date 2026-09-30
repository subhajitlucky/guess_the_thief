import Icon from '../icons/Icon';

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

  /* Presentation only: which of three moods the clock is in. The colour
     itself is a CSS decision keyed off data-level — the clock stays calm
     while there is time and only starts shouting in the last seconds. */
  const timeLevel = timeLeft > 20 ? 'calm' : timeLeft > 10 ? 'urgent' : 'critical';

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="investigation-timer" data-level={timeLevel}>
      <p className="case-label timer-label">
        <Icon name="hourglass" size={14} />
        Investigation window
      </p>

      <p className="timer-display">
        <span>{minutes}:{seconds}</span>
        <span className="timer-unit">sec remaining</span>
      </p>

      <div
        className="timer-track"
        role="progressbar"
        aria-label="Investigation time remaining"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={timeLeft}
      >
        <div
          className="timer-bar"
          style={{ width: `${(timeLeft / duration) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default InvestigationTimer;
