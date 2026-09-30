/**
 * Solo gate: the reason bots exist.
 * One visitor, no other humans, must be able to play a complete round.
 */
const WS = 'ws://127.0.0.1:8787';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
}

/** Polls until pred(inbox) or timeout. A fixed sleep is not reliable against
 *  a remote TLS endpoint where the socket opens far slower than in local dev. */
async function waitFor(c, pred, ms = 15000) {
  for (let i = 0; i < ms / 250; i++) {
    const hit = [...c.inbox].reverse().find(pred);
    if (hit) return hit;
    await sleep(250);
  }
  return undefined;
}

(async () => {
  const ROOM = 'SOLO' + Math.random().toString(36).slice(2, 5).toUpperCase();
  console.log(`room: ${ROOM}  (one human, no friends)\n`);

  const ws = new WebSocket(`${WS}/room/${ROOM}?name=solo`);
  const inbox = [];
  ws.addEventListener('message', (e) => inbox.push(JSON.parse(e.data)));
  const send = (t, p = {}) => { if (ws.readyState === 1) ws.send(JSON.stringify({ t, ...p })); };
  const lobby = await waitFor({ inbox }, (m) => m.t === 'lobby-update');
  await sleep(600);

  console.log('1. bots fill the empty seats');
  const seats = lobby?.players ?? [];
  assert(seats.length === 4, `lobby shows 4 players (${seats.map((p) => p.username).join(', ')})`);
  const botSeats = seats.filter((p) => p.username !== 'solo');
  assert(botSeats.length === 3, `three bots filled the empty seats: ${botSeats.map((p) => p.username).join(', ')}`);
  assert(botSeats.every((p) => p.isReady), 'bots are pre-readied so only the human is left to click');
  assert(lobby?.canStart === false, 'canStart still waits for the human to ready up');

  console.log('\n2. host readies up and starts');
  send('toggle-ready', { roomCode: ROOM });
  const ready = await waitFor({ inbox }, (m) => m.t === 'lobby-update' && m.canStart === true);
  assert(!!ready, 'canStart true once the lone human readies up');

  send('start-game', { roomCode: ROOM });
  const started = await waitFor({ inbox }, (m) => m.t === 'game-started');
  assert(!!started, 'game-started received');
  assert(!!started?.yourRole, `the solo player was dealt a role: ${started?.yourRole}`);

  console.log('\n3. the round progresses');
  // The human plays their own turn when they hold King or Police; bots cover
  // everything else. Either way the round must resolve.
  const myRole = started.yourRole;
  const seen = new Set();
  for (let i = 0; i < 90; i++) {
    await sleep(1000);
    const u = [...inbox].reverse().find((m) => m.t === 'game-update');
    const phase = u?.gameState?.phase;
    if (phase) seen.add(phase);

    if (phase === 'king-turn' && myRole === 'King') send('king-reveals-police', { roomCode: ROOM });
    if (phase === 'waiting-police-response' && myRole === 'Police') send('police-responds', { roomCode: ROOM });
    if (phase === 'police-investigation' && myRole === 'Police') {
      send('police-guess-thief', { roomCode: ROOM, guess: (u?.gameState?.scores ? Object.keys(u.gameState.scores)[0] : 'x') });
    }

    if (seen.has('round-over')) break;
  }
  assert(seen.has('king-turn'), 'reached king-turn');
  assert(seen.has('waiting-police-response'), 'the Police was revealed');
  assert(seen.has('police-investigation'), 'the investigation opened');
  assert(seen.has('round-over'), 'the round resolved');

  console.log('\n4. scores were awarded');
  const final = [...inbox].reverse().find((m) => m.t === 'game-update');
  const scores = final?.gameState?.scores ?? {};
  assert(Object.keys(scores).length === 4, `four players scored: ${JSON.stringify(scores)}`);
  assert(
    Object.values(scores).every((v) => typeof v === 'number' && !Number.isNaN(v)),
    'no NaN in any score',
  );

  console.log('\n5. a second human displaces bots');
  const ws2 = new WebSocket(`${WS}/room/${ROOM}?name=friend`);
  await sleep(1500);
  ws2.close();
  await sleep(500);

  ws.close();
  await sleep(300);
  console.log(`\n${failures === 0 ? 'SOLO DEMOABLE' : failures + ' FAILURE(S)'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
