# 🕵️ Guess the Thief

A real-time multiplayer social-deduction game. Four players, four secret roles
— King, Queen, Police, Thief. The King calls out, the Police accuses, and the
Thief tries to survive ten rounds.

**Play it:** <https://guess-the-thief.subhajitlucky.workers.dev>

Open it in one tab. You don't need friends — bots fill the empty seats.

---

## Why this exists

The original version was a React + Express + Socket.IO app whose rooms lived in
a `Map` in server memory. If the process died mid-round, the game was gone. It
had no tests, no deployment, and a progress-bar README that reported `0/12`
tests in bold.

This is the rewrite: one Cloudflare Durable Object per room, state in SQLite,
the game loop driven by Durable Object Alarms, and a test suite that exercises
the real thing.

---

## Architecture

```
Browser (React + partysocket)
        │  wss://…/room/<CODE>?name=<player>
        ▼
┌──────────────────────────────────────────┐
│ Worker                                   │
│  /room/<CODE> → Durable Object stub      │
│  everything else → static assets         │
└───────────────────┬──────────────────────┘
                    ▼
┌──────────────────────────────────────────┐
│ GameRoom (Durable Object)                │
│  ID = idFromName(CODE)                   │
│  • SQLite: room, players, round_log      │
│  • alarm(): phase transitions            │
│  • acceptWebSocket(): hibernation        │
│  • bots fill empty seats                 │
└──────────────────────────────────────────┘
```

**One Durable Object per room.** The DO *is* the room — there is no room
registry to look up, so state cannot be addressed across rooms. Each instance
is single-threaded, which means no locks and no cross-room interference.

### Three constraints that shaped the code

**1. The room has to be in the URL.**

Socket.IO connected once and then sent `join-room` with the room code as a
*message*. A Durable Object is addressed by *path*. There is no server-side
table to look a room up in.

```
before:  connect(host) → emit('join-room', { roomCode: 'ABCD' })
after:   connect(host/room/ABCD?name=Subhajit)
```

This reorders the client flow — name first, then room — and deleted the
`set-username` handshake entirely. It also means a message naming a different
room than the path is refused before it can touch state.

**2. `setTimeout` does not work on a Durable Object.**

A DO instance is evicted from memory when idle, and in-memory timers die with
it. A game that stops when nobody is looking is not a game. All four phase
delays are Durable Object Alarms, which persist across eviction.

Each alarm re-reads state from SQLite and re-checks the phase, so a stale alarm
that outlived its phase is a no-op rather than a corruption.

**3. Hibernation forces state out of memory.**

Per Cloudflare's pricing, *"calling `accept()` on a WebSocket in an Object will
incure duration charges for the entire time the WebSocket is connected."* So the
socket is handed to the runtime with `acceptWebSocket()`, the instance is
evicted while it sleeps, and **nothing may live in an instance variable**. All
state is in SQLite — which is also exactly what the old `Map`-based server was
missing.

---

## Bots

A four-player multiplayer game opened by a single visitor shows an empty lobby,
and the visitor closes the tab. Bots fill the empty seats so one person can play
a full round.

Three things that are easy to get wrong, all of which bit during the build:

- **Bots get no timers of their own.** Every bot action is scheduled through the
  room's single pending Alarm — the same one used for human timeouts. A second
  timer would break the one-alarm-per-instance rule and add billable duration.
- **Bots are evicted *before* the capacity check, not after.** Padding a room to
  four with bots and *then* checking the cap meant every real player who came to
  take one of those seats was told the room was full — a group of friends could
  never assemble. The smoke suite caught this.
- **A human turn still gets a 45s grace period.** A solo visitor who is dealt
  King and walks away would otherwise wedge the room forever, since no human is
  left to trigger the next phase. On expiry a bot stands in.

Set `BOT_FILL = "off"` to disable.

---

## Bugs fixed from the original

| | |
|---|---|
| **Role leak** | `handlers/lobby.js` broadcast `room.players` unfiltered. Once `assignRoles()` attached a role, a later `lobby-update` sent *every client's secret role to every client*. In a social-deduction game that ends the game. Now a role may only appear in the `yourRole` field of a message addressed to that player — with a test. |
| **Stranded rounds** | When the Police ran out of time, the original set the phase to `round-over` and scheduled no continuation, so the game stopped there forever. Only an explicit guess advanced it. Both paths continue now. |
| **Client-supplied identity** | `toggle-ready` and `send-emoji` trusted the client's own `username` field. The server now derives identity from the socket. |
| **Server-side timestamps** | `new Date().toLocaleTimeString()` ran on the server, which would have pinned every chat timestamp to Workers' UTC. Epoch milliseconds now, formatted client-side. |
| **Duplicate shuffle** | `shuffleArray` was defined twice; one copy was dead. |

---

## Tests

```bash
cd worker
npm test                    # 17 unit tests
node scripts/smoke.mjs      # lobby, capacity, role-leak, route guard
node scripts/game-flow.mjs  # four humans, two full rounds
node scripts/solo.mjs       # one human + bots, full round
```

Unit tests are pure and run in the Node environment in ~300ms, because none of
them touch SQLite or WebSockets. The three integration suites run against a real
`wrangler dev` Durable Object — not a mock — and drive real WebSocket clients
through actual gameplay.

`scripts/` read `BASE` and `WS` from the environment, so the same suites run
against production:

```bash
WS=wss://guess-the-thief.subhajitlucky.workers.dev node scripts/solo.mjs
```

---

## Cost

Verified against Cloudflare's pricing documentation.

| Resource | Free allowance | Expected use |
|---|---|---|
| DO requests | 100,000/day | ~5,000 |
| DO duration | 13,000 GB-s/day | ~200 |
| Row reads | 5,000,000/day | ~50,000 |
| Row writes | 100,000/day | ~10,000 |
| Storage | 5 GB | <50 MB |

**$0, with roughly 100× headroom.** Two details matter:

- WebSocket messages bill at **20:1** (100 messages = 5 requests), so message
  volume is the real constraint, not request count.
- **Hibernation is what makes idle rooms free.** Without it a room would bill
  duration for as long as a socket stayed open. An idle, hibernated room costs
  nothing — which is the reason the idle-cost figure is a measured estimate
  rather than a guess.

---

## Tech

TypeScript · Cloudflare Workers · Durable Objects (SQLite backend) · WebSocket
Hibernation API · Durable Object Alarms · partysocket · React 18 + Vite · Vitest

## Design documents

- [`docs/plans/2026-09-29-cloudflare-do-port-design.md`](docs/plans/2026-09-29-cloudflare-do-port-design.md) — why the port looks like this
- [`docs/plans/2026-09-29-cloudflare-do-port-implementation.md`](docs/plans/2026-09-29-cloudflare-do-port-implementation.md) — the build plan and its gates

## License

MIT
