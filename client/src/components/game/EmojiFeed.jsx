function EmojiFeed({ feed }) {
  return (
    <div>
      <h3>Live Emoji Feed:</h3>
      <ul>
        {feed.map((e, i) => <li key={i}>{e.from}: {e.emoji}</li>)}
      </ul>
      <hr/>
    </div>
  );
}

export default EmojiFeed; 