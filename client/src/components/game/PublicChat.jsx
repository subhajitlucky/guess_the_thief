import { useRef, useEffect } from 'react';

function PublicChat({ messages }) {
  const chatRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="public-chat">
      <div className="chat-header">
        <h3>💬 Game Chat</h3>
      </div>
      <div className="chat-messages" ref={chatRef}>
        {messages.length === 0 && (
          <div className="chat-message system">
            <span className="message-text">Game messages will appear here...</span>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type || 'system'}`}>
            <div className="message-meta">
              {msg.from && <span className="message-sender">{msg.from}:</span>}
              <span className="message-time">{msg.timestamp}</span>
            </div>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PublicChat; 