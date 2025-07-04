import { useRef, useEffect } from 'react';

function EmojiFeed({ feed }) {
  const feedRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feed]);

  return (
    <div className="emoji-feed" ref={feedRef}>
      {feed.length === 0 && <p>Emoji feed is empty...</p>}
      {feed.map((item, index) => (
        <div key={index} className="emoji-message">
          <span className="emoji-sender">{item.from}:</span>
          <span>{item.emoji}</span>
        </div>
      ))}
    </div>
  );
}

export default EmojiFeed; 