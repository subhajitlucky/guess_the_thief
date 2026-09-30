# Guess the Thief — Cloudflare Durable Objects Port

**Date:** 2026-09-29
**Status:** Design — awaiting approval
**Author:** Subhajit Pradhan
**Scope:** Replace the Express + Socket.IO server with Cloudflare Workers + Durable Objects. Serve the client from Workers Assets. Deploy on the free tier.

---

## 1. Summary

Port the real-time multiplayer game to Cloudflare Durable Objects. Each game room becomes an isolated Durable Object with persistent SQLite storage, driven by hibernatable WebSockets and Durable Object Alarms. The client changes from `socket.io-client` to `partysocket`.

The port also closes four gaps in the current build: no persistence (state is a `Map` lost on restart), no tests (`0/12`), a role-leak bug, and no live deployment.

**This is a rewrite of the server, not a configuration change.** The game rules, phase machine, and scoring carry over unchanged.

---

## 2. Current state (verified against the code)

| | |
|---|---|
| Server | 652 LOC, CommonJS, Express 5, Socket.IO 4.8 |
| Client | 1,598 LOC, React 18 + Vite |
| State | `rooms` and `users` module-level `Map`s — **lost on restart** |
| Tests | None (`server/package.json` → `"test": "echo Error: no test specified && exit 1"`) |
| CI | `.github/workflows/progress-tracker.yml` — counts files, runs no build/test/lint |
| Capacity | Hardcoded 4 players per room |
| Rounds | 10, then game over |
| Scoring | King 1000/round, Queen 500/round, Police +300 if correct else Thief +300 |
| Phases | `role-spinning` → `king-turn` → `waiting-police-response` → `police-investigation` → `round-over` → repeat |
| Git history | 17 commits; messages include `hmm`, `.`, `done` |

### 2.1 Bugs to fix during the port

| # | Location | Issue |
|---|---|---|
| B1 | [server/handlers/lobby.js:14](server/handlers/lobby.js:14) | **Role leak.** `broadcastLobbyUpdate` broadcasts `players: room.players` with no field filtering. After `assignRoles()` sets `.role` on each player, any later `lobby-update` sends every player's secret role to every client. `room-joined` has the same shape. `game-started` correctly strips roles at [game.js:45](server/handlers/game.js:45) — the other two paths do not. |
| B2 | [server/handlers/game.js:117](server/handlers/game.js:117) | `new Date().toLocaleTimeString()` runs on the server. Workers runs UTC, so chat timestamps lose the local timezone. Move formatting to the client; send epoch ms. |
| B3 | `toggle-ready` handlers | Trusts the client-supplied `username` instead of the server-stored identity. Spoofable. Server must derive identity from the socket. |
| B4 | `game.js:6` and `game-logic/roles.js:3` | `shuffleArray` is defined twice. `game.js`'s copy is unused dead code. |

---

## 3. Goals and non-goals

### Goals
1. Deploy to `workers.dev` on the **free tier**, permanently, at $0.
2. Persist room and game state in Durable Object SQLite storage.
3. Survive instance eviction — no lost timers, no lost state.
4. Make the game playable and demoable by a **single visitor** (bot fill).
5. Have a real test suite.
6. Replace the progress-dashboard README and CI with an honest one.

### Non-goals
- Auth, accounts, matchmaking, ranking, or any account system.
- Changing game rules, scoring, or phases.
- Rewriting React components. The UI stays as-is except for the socket layer.
- Multi-region routing or scale beyond a few concurrent rooms.

---

## 4. Three blocking architectural changes

These are the parts that make this a port rather than a lift-and-shift. Each one is load-bearing.

### 4.1 The connection model changes

**Today:** the client opens one Socket.IO connection to a fixed URL, then sends `create-room` / `join-room` with a room code as a *message*. The server routes by looking up a `Map`.

**Problem:** Durable Objects are addressed by URL path. A DO instance *is* a room. There is no room registry to look up.

**After:** the room code must be known **before** the socket opens.

```
Today:   connect(wss://host)  →  emit('join-room', {roomCode: 'ABCD'})
After:   connect(wss://host/room/ABCD)
```

This reorders the client flow: username + room code are captured **before** connecting, rather than connecting first and setting a username afterwards (`set-username` in [client/src/App.jsx:64](client/src/App.jsx:64)).

Consequences:
- `set-username` / `username-success` / `username-error` (3 events) **disappear** — identity comes from the connect query string, e.g. `wss://host/room/ABCD?name=Subhajit`.
- The landing page gains a name field before "Create room" / "Join room".
- Server-side routing becomes: parse path → `env.GAME.idFromName(roomCode)` → `get(id)` → delegate.

**Rejected alternative:** keep a global "lobby" DO that mints room codes and hands back per-room URLs. Rejected — it adds a hop and a global bottleneck for no benefit at this scale.

### 4.2 `setTimeout` becomes Durable Object Alarms

There are **four** `setTimeout` calls, all in [server/handlers/game.js](server/handlers/game.js):

| Line | Delay | Purpose |
|---|---|---|
| 94 | 5,000 ms | `role-spinning` → `king-turn` |
| 160 | 60,000 ms | Police investigation timeout → `round-over` |
| 200 | 8,000 ms | `round-over` → next round or game over |
| 230 | 5,000 ms | Next round's `role-spinning` → `king-turn` (nested inside line 200) |

**None of these survive on a Durable Object.** A DO instance is evicted from memory when idle; pending in-memory timers are destroyed with it. A game that dies when nobody is looking is not a game.

Every one becomes `state.storage.setAlarm(timestamp)` handled in `alarm()`. Alarms persist across eviction — this is the mechanism the platform provides for exactly this.

Timing semantics are preserved precisely: each alarm re-reads room state from SQLite, checks the current phase, and acts only if the phase still matches (the existing code already guards with `if (room.gameState.phase === 'police-investigation')`). That guard becomes more important, not less, since a stale alarm can now survive longer than intended.

Only **one alarm may be pending per DO**. The phase machine is strictly sequential, so each transition sets exactly one next alarm and clears it (`setAlarm(null)`) on any state that cancels it (player leaves, game over, room empty).

### 4.3 Hibernation forces state out of memory

This is the one that determines the cost, per Cloudflare's pricing docs:

> *"Calling `accept()` on a WebSocket in an Object will incur duration charges for the entire time the WebSocket is connected."*

A room with four people sitting in a 60-second investigation phase would bill duration for all 60 seconds. Across many idle rooms this is a real bill.

With the **WebSocket Hibernation API** — `state.acceptWebSocket(ws)` plus `webSocketMessage` / `webSocketClose` / `webSocketError` handlers — an idle room is evicted from memory and **billed $0**.

The consequence: **no game state may live in a module variable.** Everything goes through SQLite. After a wake, handlers read fresh state. This is also what delivers the persistence the current build lacks, so the constraint and the goal align.

`serializeAttachment()` / `deserializeAttachment()` are used to attach the player identity to each socket, so a woken instance knows who each socket belongs to without a lookup table.

---

## 5. Architecture

```
Browser (React, partysocket)
        │
        │  wss://<worker>.workers.dev/room/<CODE>?name=<username>
        ▼
┌───────────────────────────────────────────────┐
│ Worker (router)                              │
│  - parses /room/<CODE>                        │
│  - env.ASSETS serves client/dist/* (SPA)      │
│  - upgrades WebSocket, forwards to DO stub     │
└───────────────────────┬───────────────────────┘
                        │  stub.fetch() / stub.broadcast()
        ┌───────────────▼───────────────────────┐
        │ Durable Object: GameRoom               │
        │  DO ID = idFromName(roomCode)          │
        │                                       │
        │  state.getWebSockets()  ← broadcast    │
        │  acceptWebSocket(ws)    ← hibernation  │
        │  SQLite: room, players, round_log      │
        │  alarm() ← phase transitions           │
        │  bot.js ← fills empty seats            │
        └───────────────────────────────────────┘
```

**Why this shape is good:** every room is single-threaded and isolated. There are no locks, no shared mutable state, and no cross-room coordination. Two rooms cannot interfere with each other. That is the correct model for this game and it removes a whole class of bugs the current `Map`-based server can have.

### 5.1 Module layout

```
worker/
  src/
    index.ts          router: /room/:code -> DO, else ASSETS
    do/
      GameRoom.ts     the Durable Object
      state.ts        SQLite read/write, schema
      game.ts         phase machine + scoring (ported, logic unchanged)
      roles.ts        assignRoles, shuffleArray (single copy)
      protocol.ts     message types, validation
      bot.ts          bot player behaviour
    test/
      game.test.ts        scoring, role assignment, phase transitions
      GameRoom.test.ts    join/leave, alarms, persistence
  wrangler.toml
```

`game.ts` and `roles.ts` are near-verbatim ports. Keeping them free of DO and WebSocket specifics is what makes them directly unit-testable — which is how the `0/12` gets fixed without building a fake server.

---

## 6. Protocol mapping

Socket.IO's framing disappears. Messages become JSON `{type, ...payload}` over a raw WebSocket. **The client's `.on(...)` / `.emit(...)` call sites keep their exact names** — `partysocket` exposes the same `send`/`on` shape and a small adapter preserves `emit`.

### 6.1 Client → Server (12 events, was 13)

| Event | Payload | Notes |
|---|---|---|
| `create-room` | `{roomCode}` | Name from query string |
| `join-room` | `{roomCode}` | Route mismatch rejected — see 6.3 |
| `leave-room` | `{roomCode}` | |
| `get-lobby-state` | `{roomCode}` | |
| `toggle-ready` | `{roomCode}` | **username removed** (fixes B3) |
| `start-game` | `{roomCode}` | Host-only, 4 players, all ready |
| `join-room-for-game` | `{roomCode}` | Replay in-progress state |
| `king-reveals-police` | `{roomCode}` | |
| `police-responds` | `{roomCode}` | |
| `police-guess-thief` | `{roomCode, guess}` | |
| `send-emoji` | `{roomCode, emoji}` | **`from` removed** — server supplies it |
| `leave-game` | `{roomCode}` | |

`set-username` is **removed** (§4.1).

### 6.2 Server → Client (13 events, unchanged names)

`room-created` · `room-joined` · `room-error` · `lobby-update` · `lobby-error` · `game-error` · `game-started` · `game-update` · `chat-message` · `emoji-broadcast` · `game-over`

`username-success` / `username-error` are **removed**.

**Every `players` array is filtered before broadcast** (fixes B1). A single helper enforces it:

```ts
const publicPlayer = (p: Player) => ({
  username: p.username, isReady: p.isReady, isHost: p.isHost,
}); // .role deliberately omitted
```

Applied at every broadcast site, including `lobby-update` and `room-joined`. `game-started` remains the only event carrying a role, and it carries only *your own*.

### 6.3 Route consistency

The DO is addressed by path. A message naming a different room code than the path must be rejected, or a client could address state it doesn't own. The DO asserts `msg.roomCode === this.roomCode` on every inbound message and returns `room-error` on mismatch. Cheap, and it removes a whole class of confused-deputy bug.

---

## 7. Persistence

SQLite-backed storage, free-tier only (the legacy key-value backend is Workers **Paid**-only).

```sql
CREATE TABLE IF NOT EXISTS room (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  host        TEXT NOT NULL,
  phase       TEXT NOT NULL,
  round       INTEGER NOT NULL DEFAULT 1,
  scores      TEXT NOT NULL,          -- JSON
  status      TEXT NOT NULL,          -- 'lobby' | 'playing' | 'over'
  started_at  INTEGER,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  username    TEXT PRIMARY KEY,
  is_ready    INTEGER NOT NULL DEFAULT 0,
  is_host     INTEGER NOT NULL DEFAULT 0,
  role        TEXT,                   -- NULL until the game starts
  is_bot      INTEGER NOT NULL DEFAULT 0,
  joined_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS round_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  round     INTEGER NOT NULL,
  event     TEXT NOT NULL,
  payload   TEXT,
  at        INTEGER NOT NULL
);
```

**Why `round_log` is here.** It is the visible payoff of persistence: a finished game can be replayed and its history inspected, and reconnecting players can see what happened while they were gone. It also makes the SQLite backend demonstrably load-bearing rather than decorative.

**Write discipline.** Read state at the top of each handler, mutate, persist once at the end inside a single `ctx.waitUntil`-deferred transaction. Batched writes matter: free-tier rows-written allowance is 100,000/day versus 5,000,000/day for reads, so writes are 50× the scarcer resource.

**Empty-room cleanup.** When the last player leaves, delete all rows and set an alarm 10 minutes out that deletes the DO if still empty. Prevents abandoned rooms accumulating against the 5 GB storage cap.

---

## 8. Hibernation design

| Concern | Approach |
|---|---|
| Accept | `state.acceptWebSocket(ws)` in the upgrade handler |
| Enumerate | `state.getWebSockets()` for broadcast |
| Identity | `ws.serializeAttachment({ username })`; read back after wake |
| Message | `webSocketMessage(ws, msg)` — no closure state available, read from SQLite |
| Close | `webSocketClose(ws, code)` — remove player, reassign host, maybe end game |
| Send to one | `ws.send(JSON.stringify(msg))` |
| Send to all | loop `state.getWebSockets()`, `ws.send(...)`, wrap in `ctx.waitUntil` |
| Heartbeat | None needed — hibernated sockets are held by the runtime |

`serializeAttachment` is what makes this correct: a woken instance has zero memory of who connected, so identity must ride on the socket itself.

---

## 9. Bot player

**This is the difference between a demo and an undemoable link.** A recruiter opens a 4-player multiplayer game alone and sees an empty lobby. They close the tab in ten seconds.

A bot fills empty seats so one visitor can play a full round immediately. It also means cold-start and empty-room problems stop mattering — the room is always full enough to start.

Design:
- Bots are player rows with `is_bot = 1`. They exist only in the `lobby` phase.
- Driven by alarms on the same clock as phase transitions — no separate timers, so no extra billing.
- Behaviour: King reveals after 3–8 s (randomised); Police guesses a random non-Poison player after 5–15 s; others idle and occasionally send an emoji so the feed looks alive.
- A room with 4 humans never spawns a bot.
- Toggle: `?bots=off` disables them for testing real multiplayer.

This is also a legitimate interview answer: *"a real-time multiplayer game is undemoable by one user — here's how I made it self-running."*

---

## 10. Client changes

Small and contained. Components are untouched.

| File | Change |
|---|---|
| `client/src/App.jsx` | `socket.io-client` → `partysocket`; drop `set-username` flow |
| `client/src/socket.js` *(new)* | Single connection factory + `.emit`/`.on` adapter preserving call sites |
| `client/src/pages/Home.jsx` | Capture username **before** connecting |
| All other components | **No changes** |

`SOCKET_URL` becomes a room-scoped URL: `${WS_BASE}/room/${roomCode}?name=${encodeURIComponent(username)}`.

`client/src/App.css` and all 20 components stay as they are. The point of this section is that the port is server-side.

---

## 11. Testing

Closes `0/12`. Vitest via `@cloudflare/vitest-pool-workers` for real DO integration, not mocks.

**Unit (pure functions, no DO):**
- `shuffleArray` — uniform-ish distribution over 1,000 shuffles, no duplicates
- `assignRoles` — all 4 players get exactly one role, all 4 roles used, 24 permutations covered
- `updateScores` — King 1000, Queen 500, Police 300 on correct, Thief 300 on incorrect, no NaN on empty

**Integration (real DO instance):**
- Two clients join, lobby state is broadcast to both
- 4th client is rejected; duplicate username is rejected
- Host migration on host disconnect
- `start-game` assigns roles; each client receives **only its own** role
- **Regression for B1:** after `assignRoles`, a `lobby-update` must not contain `role`
- Alarm fires → phase advances → exactly one alarm pending
- **Eviction:** room sits idle, state reloads from SQLite unchanged
- Round 10 ends the game and clears the room

That eviction test is the one that proves hibernation works. Without it, the cost model is an assumption rather than a fact.

---

## 12. Free-tier cost

Verified against Cloudflare's pricing page, last updated 2026-09-30.

| Resource | Free allowance | Expected usage |
|---|---|---|
| DO requests | 100,000/day | ~5,000/day |
| DO duration | 13,000 GB-s/day | ~200 GB-s/day |
| Row reads | 5,000,000/day | ~50,000/day |
| Row writes | 100,000/day | ~10,000/day |
| Storage | 5 GB | <50 MB |

WebSocket messages bill at 20:1 (100 messages = 5 requests). With hibernation, idle rooms cost $0.

**Conclusion: $0 with ~100× headroom.** The binding constraint is the 20:1 message ratio plus write batching, not request volume.

---

## 13. Delivery plan

The existing Express server is preserved on a `legacy-express` branch. It is never deleted until the Workers version is live. That is the safety net — it costs nothing and it makes failure recoverable.

| Day | Work | Gate |
|---|---|---|
| 1 | `wrangler` scaffold, DO class, router, Assets binding, static client served | **If the client does not load → stop, fall back to Render** |
| 2 | WebSocket protocol, join/leave, lobby, `partysocket` on client | **If two browsers cannot join a lobby → stop** |
| 3 | Phase machine, alarms, scoring, role re-assignment | If a full round cannot complete → stop |
| 4 | SQLite persistence + hibernation | Eviction test must pass |
| 5 | Bot player, role-leak fix, polish | |
| 6 | Test suite green, README rewrite, CI | |
| 7 | **HARD GATE** — live `workers.dev` URL | **If not live → deploy `legacy-express` to Render** |

**Fallback:** the Express server is deployable to Render's free tier in roughly an hour — single process serving `client/dist` plus Socket.IO on one port. That path is preserved and costed precisely because it is the thing that makes a day-6 failure a delay rather than a loss.

---

## 14. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Workers learning curve exceeds the estimate | Medium | Day-2 gate; the Express fallback exists and is untouched |
| Hibernation + alarms interaction is subtle | Medium | Day-4 eviction test is a hard gate, not a nice-to-have |
| Free-tier limits exceeded by a bot bug | Low | Bot behaviour is alarm-driven; alarm spam is visible in DO metrics |
| Client rewrite breaks components | Low | 5 files, 20 components untouched |
| Sunk-cost drift into more features | Medium | Non-goals section is binding; no accounts, no matchmaking |

---

## 15. What this is worth

The finished artifact supports a specific, checkable claim:

> Rebuilt a real-time multiplayer social-deduction game on Cloudflare Durable Objects — per-room state isolation, built-in SQLite persistence, alarm-driven game loop surviving instance hibernation, self-playing bot mode, and a full test suite — deployed on the $0 free tier.

That is a stronger line for a frontend / backend / fullstack / SDE application than the current 85% Socket.IO build, because it demonstrates finishing a hard migration onto unfamiliar infrastructure, reasoning about state isolation, and understanding a cost model well enough to keep it at zero.

---

## 16. Decisions needed before implementation

1. **Bot default on?** Recommended: on. It is the difference between a clickable demo and a dead end.
2. **Room codes** — keep the existing client-generated alphanumeric scheme, or move to server-assigned? Recommended: keep client-generated for the smallest diff.
3. **Keep the legacy Express server?** Recommended: yes, on `legacy-express`, deleted only after the Workers version has been live for a week.
4. **Default worker region?** Recommended: nearest sensible region; DO placement is fixed per ID and cannot change later.
