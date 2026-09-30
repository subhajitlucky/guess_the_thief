/**
 * Full-round gate: the four setTimeout calls must now be Durable Object
 * Alarms. Verifies a complete round start-to-finish, including the 5s
 * spinner delay surviving the instance being evicted underneath it.
 */
const WS = 'ws://127.0.0.1:8787';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client(name, room) {
  const ws = new WebSocket(`${WS}/room/${room}?name=${encodeURIComponent(name)}`);
  const inbox = [];
  ws.addEventListener('message', (e) => inbox.push(JSON.parse(e.data)));
  return {
    name,
    ws,
    inbox,
    send: (t, p = {}) => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ t, ...p }));
    },
  };
}

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
}
const last = (c, t) => [...c.inbox].reverse().find((m) => m.t === t);
const phaseOf = (c) => last(c, 'game-update')?.gameState?.phase;

(async () => {
  const ROOM = 'GAME' + Math.random().toString(36).slice(2, 5).toUpperCase();
  console.log(`room: ${ROOM}\n`);

  const cs = ['p1', 'p2', 'p3', 'p4'].map((n) => client(n, ROOM));
  await sleep(1200);

  console.log('1. host starts the game');
  // start-game requires every player ready, including the host.
  cs.forEach((c) => c.send('toggle-ready', { roomCode: ROOM }));
  await sleep(900);
  assert(last(cs[0], 'lobby-update')?.canStart === true, 'canStart true once all four are ready');

  cs[0].send('start-game', { roomCode: ROOM });
  await sleep(1000);

  const started = cs.map((c) => last(c, 'game-started'));
  console.log('\n2. every player gets a distinct secret role');
  assert(started.every(Boolean), 'all four received game-started');
  const roles = started.map((m) => m.yourRole);
  assert(new Set(roles).size === 4, `four distinct roles: ${roles.join(', ')}`);
  assert(
    started.every((m) => m.allPlayers.every((p) => !('role' in p))),
    'game-started never carries anyone else\'s role',
  );
  assert(
    !cs.some((c) => JSON.stringify(c.inbox).match(/"role"/)),
    'no payload anywhere contains a role key',
  );

  const byRole = Object.fromEntries(started.map((m, i) => [m.yourRole, cs[i]]));

  console.log('\n3. alarm advances role-spinning -> king-turn (5s)');
  await sleep(6000);
  assert(phaseOf(cs[0]) === 'king-turn', `phase is king-turn after the 5s spinner alarm`);

  console.log('\n4. King reveals');
  byRole.King.send('king-reveals-police', { roomCode: ROOM });
  await sleep(800);
  assert(phaseOf(cs[0]) === 'waiting-police-response', 'phase is waiting-police-response');
  assert(last(cs[0], 'chat-message')?.text?.includes('Police'), 'chat broadcast carries the King line');

  console.log('\n5. Police responds, opening the 60s investigation');
  byRole.Police.send('police-responds', { roomCode: ROOM });
  await sleep(800);
  assert(phaseOf(cs[0]) === 'police-investigation', 'phase is police-investigation');

  console.log('\n6. wrong guess is scored correctly');
  const liar = Object.keys(byRole).find((r) => r !== 'Thief');
  byRole.Police.send('police-guess-thief', { roomCode: ROOM, guess: byRole[liar].name });
  await sleep(900);
  assert(phaseOf(cs[0]) === 'round-over', 'phase is round-over');

  const scores = last(cs[0], 'game-update')?.gameState?.scores ?? {};
  const g = (role) => started[cs.indexOf(byRole[role])] && byRole[role].name;
  assert(scores[g('King')] === 1000, `King scored 1000 (got ${scores[g('King')]})`);
  assert(scores[g('Queen')] === 500, `Queen scored 500 (got ${scores[g('Queen')]})`);
  assert(scores[g('Thief')] === 300, `Thief scored 300 on a wrong guess (got ${scores[g('Thief')]})`);
  assert((scores[g('Police')] ?? 0) === 0, `Police scored 0 on a wrong guess (got ${scores[g('Police')]})`);

  console.log('\n7. alarm advances to round 2 with fresh roles');
  // round-over waits 8s, then round 2 spins for 5s: poll rather than guess.
  let sawRound2 = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (last(cs[0], 'game-started')?.message?.includes('Round 2')) { sawRound2 = true; break; }
  }
  assert(sawRound2, 'round 2 started from the alarm');
  const roles2 = cs.map((c) => last(c, 'game-started')?.yourRole);
  assert(new Set(roles2).size === 4, `round 2 re-dealt four distinct roles: ${roles2.join(', ')}`);

  let reachedKing = false;
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    if (phaseOf(cs[0]) === 'king-turn') { reachedKing = true; break; }
  }
  assert(reachedKing, 'round 2 reached king-turn on its own 5s alarm');

  cs.forEach((c) => c.ws.close());
  await sleep(300);
  console.log(`\n${failures === 0 ? 'ALL GATES PASS' : failures + ' FAILURE(S)'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
