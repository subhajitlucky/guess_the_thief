/**
 * End-to-end smoke test against the local wrangler dev server.
 * Gate for design doc Day 2: two clients must be able to share a lobby.
 */
const BASE = 'http://127.0.0.1:8787';
const WS = 'ws://127.0.0.1:8787';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client(name, room) {
  const ws = new WebSocket(`${WS}/room/${room}?name=${encodeURIComponent(name)}`);
  const inbox = [];
  ws.addEventListener('message', (e) => inbox.push(JSON.parse(e.data)));
  return { name, ws, inbox, send: (t, p = {}) => ws.send(JSON.stringify({ t, ...p })) };
}

function assert(cond, msg) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) process.exitCode = 1;
  return cond;
}

(async () => {
  const ROOM = 'TEST' + Math.random().toString(36).slice(2, 6).toUpperCase();
  console.log(`room: ${ROOM}\n`);

  console.log('1. static assets served');
  const html = await fetch(`${BASE}/`).then((r) => r.text());
  assert(html.includes('<div id="root">') || html.includes('<script'), 'index.html served from Workers Assets');

  console.log('\n2. two clients join one room');
  const alice = client('alice', ROOM);
  const bob = client('bob', ROOM);
  await sleep(1200);

  const aliceJoined = alice.inbox.find((m) => m.t === 'room-joined');
  const bobJoined = bob.inbox.find((m) => m.t === 'room-joined');
  assert(!!aliceJoined, 'alice received room-joined');
  assert(!!bobJoined, 'bob received room-joined');

  const lobby = [...alice.inbox].reverse().find((m) => m.t === 'lobby-update');
  assert(!!lobby, 'alice received lobby-update');
  const names = (lobby?.players ?? []).map((p) => p.username).sort();
  assert(names.includes('alice') && names.includes('bob'), `lobby lists both players (${names.join(', ')})`);
  assert(lobby?.canStart === false, 'canStart is false with 2 of 4 players');

  console.log('\n3. role-leak regression (the lobby.js bug)');
  const lobbyText = JSON.stringify(alice.inbox);
  assert(!/King|Queen|Police|Thief/.test(lobbyText), 'no role string anywhere in any broadcast payload');
  assert(
    alice.inbox.every((m) => !(m.players ?? []).some((p) => 'role' in p)),
    'no player object carries a role field',
  );

  console.log('\n4. duplicate name rejected');
  const dup = client('alice', ROOM);
  await sleep(900);
  const dupErr = dup.inbox.find((m) => m.t === 'room-error');
  assert(!!dupErr, `duplicate rejected: "${dupErr?.message ?? 'none'}"`);

  console.log('\n5. route consistency guard');
  const probe = client('carol', ROOM);
  await sleep(700);
  probe.send('create-room', { roomCode: 'SOMEWHEREELSE' });
  await sleep(600);
  const mismatch = probe.inbox.find((m) => m.t === 'room-error' && /mismatch/i.test(m.message ?? ''));
  assert(!!mismatch, `cross-room message refused: "${mismatch?.message ?? 'none'}"`);

  console.log('\n6. fifth player hits the cap');
  const extras = ['dave', 'erin'].map((n) => client(n, ROOM));
  await sleep(1200);
  const errs = extras.map((c) => c.inbox.find((m) => m.t === 'room-error')?.message).filter(Boolean);
  assert(errs.length >= 1, `room is capped at 4: ${errs.join(' | ') || 'no error raised'}`);

  [alice, bob, dup, probe, ...extras].forEach((c) => c.ws.close());
  await sleep(300);
  console.log('\ndone');
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
