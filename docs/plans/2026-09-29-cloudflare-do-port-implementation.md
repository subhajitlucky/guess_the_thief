# Guess the Thief — Cloudflare Durable Objects Port: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Express + Socket.IO server with Cloudflare Workers + Durable Objects (one DO per room, SQLite persistence, alarm-driven phases, hibernatable WebSockets), serve the React client from Workers Assets, and deploy on the free tier.

**Architecture:** A Worker routes `wss://host/room/<CODE>?name=<user>` to a Durable Object whose ID is `idFromName(CODE)`. The DO *is* the room — no registry, no shared `Map`. All state lives in SQLite because hibernation evicts the instance from memory. The four `setTimeout` calls become Durable Object Alarms. A bot fills empty seats so one visitor can play alone.

**Tech Stack:** TypeScript · Cloudflare Workers · Durable Objects (SQLite backend) · WebSocket Hibernation API · partysocket · Vite/React (existing) · Vitest via `@cloudflare/vitest-pool-workers`

**Design doc:** [`docs/plans/2026-09-29-cloudflare-do-port-design.md`](2026-09-29-cloudflare-do-port-design.md)

---

## Decisions (defaults chosen — §16 of the design doc)

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Bot fill default | **on** (`?bots=off` disables) | Without it the game is undemoable by one person |
| 2 | Room codes | **client-generated**, as today | Smallest diff; no server round-trip to create a room |
| 3 | `legacy-express` branch | **keep** for a week post-launch | Free insurance; already pushed to remote |
| 4 | DO location hint | **`apac`** | User is in India; `locationHint` is a create-time hint |

**Cloudflare account:** `6d54e25b2903a59ce92524e1acdb4e0d` (`workers:write` confirmed)

---

## Global conventions

- Every bash call in this repo must first run: `source /home/subhajit/project/.wrangler-env.sh`
  (sets `npm_config_cache` and `WRANGLER_LOG_PATH`; both default paths are unwritable in this environment)
- Server code is **TypeScript** from here on. `game.ts` / `roles.ts` stay pure — no DO, no WebSocket imports — so they unit-test without a runtime.
- Commit after every task. Conventional Commits. No `hmm`, no `.`, no `done`.

---

## Phase 1 — Scaffold (Day 1)

### Task 1: Worker project skeleton
**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`
- Create: `worker/.gitignore`

**Steps:**
1. `mkdir -p worker/src/do worker/src/test`
2. Write `worker/package.json` — deps: none at runtime. devDeps: `wrangler`, `typescript`, `vitest`, `@cloudflare/vitest-pool-workers`, `@cloudflare/workers-types`
3. Write `wrangler.toml`:
   ```toml
   name = "guess-the-thief"
   main = "src/index.ts"
   compatibility_date = "2026-09-30"
   compatibility_flags = ["nodejs_compat"]

   [[durable_objects.bindings]]
   name = "GAME"
   class_name = "GameRoom"

   [[migrations]]
   tag = "v1"
   new_sqlite_classes = ["GameRoom"]

   [assets]
   directory = "../client/dist"
   binding = "ASSETS"

   [vars]
   BOT_FILL = "on"
   ```
4. Write `tsconfig.json` with `types: ["@cloudflare/workers-types"]`, strict on
5. Write `.gitignore` — `node_modules/`, `.wrangler/`, `dist/`
6. `npm install` in `worker/`
7. **Verify:** `npx wrangler types` exits 0
8. Commit: `chore(worker): scaffold Cloudflare Workers project`

---

## Phase 2 — Pure game logic (Day 1–2)

This phase is pure functions with zero DO/WS coupling. Tests run without a runtime — fastest possible feedback loop.

### Task 2: Role assignment
**Files:**
- Create: `worker/src/do/roles.ts`
- Test: `worker/src/test/roles.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect } from 'vitest';
import { shuffleArray, assignRoles, ROLES } from '../do/roles';

describe('shuffleArray', () => {
  it('returns a permutation with no duplicates or losses', () => {
    for (let i = 0; i < 1000; i++) {
      const out = shuffleArray(ROLES);
      expect(out).toHaveLength(4);
      expect(new Set(out).size).toBe(4);
      expect([...out].sort()).toEqual([...ROLES].sort());
    }
  });
  it('does not mutate the input', () => {
    const input = [...ROLES];
    shuffleArray(input);
    expect(input).toEqual(ROLES);
  });
});

describe('assignRoles', () => {
  it('gives every player exactly one role and uses all four roles', () => {
    for (let i = 0; i < 200; i++) {
      const players = ['a', 'b', 'c', 'd'].map(u => ({ username: u, role: null }));
      assignRoles(players);
      expect(players.map(p => p.role).sort()).toEqual(['King', 'Police', 'Queen', 'Thief']);
    }
  });
  it('reaches all 24 permutations over many runs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const players = ['a', 'b', 'c', 'd'].map(u => ({ username: u, role: null }));
      assignRoles(players);
      seen.add(players.map(p => `${p.username}:${p.role}`).join(','));
    }
    expect(seen.size).toBe(24);
  });
});
```

**Step 2: Run — expect FAIL** with `Cannot find module '../do/roles'`

**Step 3: Implement `worker/src/do/roles.ts`**
```ts
export const ROLES = ['King', 'Queen', 'Police', 'Thief'] as const;
export type Role = (typeof ROLES)[number];

export function shuffleArray<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Player = { username: string; role: Role | null };

export function assignRoles(players: Player[]): void {
  const shuffled = shuffleArray(ROLES);
  players.forEach((p, i) => { p.role = shuffled[i] ?? null; });
}
```

**Step 4: Run — expect PASS** (7 tests)
**Step 5: Commit** `feat(worker): add role assignment with permutation tests`

---

### Task 3: Scoring and game state
**Files:**
- Create: `worker/src/do/game.ts`
- Test: `worker/src/test/game.test.ts`

**Step 1: Write the failing test** — cover all four scoring branches:
- King gains 1000 every round regardless of outcome
- Queen gains 500 every round
- Police gains 300 **only** when the guess is correct
- Thief gains 300 **only** when the guess is incorrect
- No `NaN` when a role is absent from the player list
- `createInitialGameState` seeds every player's score at 0 with `phase: 'role-spinning'`, `round: 1`

**Step 2: Run — expect FAIL**
**Step 3: Implement** `createInitialGameState(players)` and `updateScores(players, gameState, guessResult)` exactly matching [server/game-logic/state.js](../../../server/game-logic/state.js) semantics, but taking `players` directly rather than a `room` object.
**Step 4: Run — expect PASS**
**Step 5: Commit** `feat(worker): add scoring and initial game state`

---

### Task 4: Role redaction (bug B1)
**Files:**
- Create: `worker/src/do/protocol.ts`
- Test: `worker/src/test/protocol.test.ts`

**Step 1: Write the failing test**
```ts
it('never leaks role in a public player payload', () => {
  const p = { username: 'a', isReady: true, isHost: false, role: 'Thief' as const, isBot: false };
  const out = publicPlayer(p);
  expect(out).toEqual({ username: 'a', isReady: true, isHost: false });
  expect('role' in out).toBe(false);
  expect(JSON.stringify(out)).not.toContain('Thief');
});
```
Also test `allPublicPlayers` strips every player, and that `gameStartedFor` includes the viewer's **own** role but no one else's.

**Step 2: Run — expect FAIL**
**Step 3: Implement** `publicPlayer`, `allPublicPlayers`, `gameStartedFor`
**Step 4: Run — expect PASS** — this is the regression test for the role-leak bug
**Step 5: Commit** `fix(worker): redact role from all public player payloads`

---

## Phase 3 — Persistence (Day 3)

### Task 5: SQLite schema and queries
**Files:**
- Create: `worker/src/do/state.ts`
- Test: `worker/src/test/state.test.ts`

**Step 1: Write the failing test** (integration, real DO storage):
- `initSchema` is idempotent (running twice is safe)
- `saveRoom` / `loadRoom` round-trips
- `upsertPlayer` / `removePlayer` / `allPlayers`
- `clearRoom` deletes all three tables
- **Reliability test:** save, then construct a *new* instance pointing at the same storage and assert the state reloads — this is what proves persistence survives eviction

**Step 2: Run — expect FAIL**
**Step 3: Implement** the three tables from design §7 (`room`, `players`, `round_log`) using `ctx.storage.sql.exec`
**Step 4: Run — expect PASS**
**Step 5: Commit** `feat(worker): add SQLite persistence layer`

---

## Phase 4 — The Durable Object (Day 2–3)

### Task 6: GameRoom skeleton — accept, broadcast, echo
**Files:**
- Create: `worker/src/do/GameRoom.ts`

Implement `fetch()` handling the WebSocket upgrade, `webSocketMessage`, `webSocketClose`, `webSocketError`, plus `broadcast()` over `state.getWebSockets()` and `sendTo()` for one socket. Use `state.acceptWebSocket(ws)` and `ws.serializeAttachment({ username })`.

**Verify:** `npx wrangler dev` starts, client connects, a `ping` message round-trips.
**Commit** `feat(worker): GameRoom WebSocket skeleton with hibernation`

### Task 7: Lobby flow
`create-room`, `join-room`, `leave-room`, `get-lobby-state`, `toggle-ready`. Enforce: 4-player cap, duplicate-username rejection, host migration on host disconnect, and the route-consistency guard (`msg.roomCode === this.roomCode`, else `room-error`).

**Verify:** two browser tabs join one room and both see each other; a 5th is rejected.
**Commit** `feat(worker): lobby and room membership`

### Task 8: Phase machine on Alarms
Port `start-game`, `king-reveals-police`, `police-responds`, `police-guess-thief`, `leave-game`. **Replace all four `setTimeout` calls with `state.storage.setAlarm()`**, handled in `alarm()`. Every transition re-reads state from SQLite and checks the phase matches before acting. Exactly one alarm pending at a time; `setAlarm(null)` on cancel.

**Verify:** a full round completes start-to-finish; the 60s Police timeout fires on its own.
**Commit** `feat(worker): alarm-driven phase machine`

### Task 9: Eviction test (hard gate)
Assert that after the room has been idle long enough to hibernate, `alarm()` still advances the phase and state reloads intact from SQLite.

**This is the test that proves the $0 idle-cost claim.** It is a gate, not a nice-to-have.
**Commit** `test(worker): prove state survives hibernation`

---

## Phase 5 — Router and client (Day 2)

### Task 10: Worker router
**Files:**
- Create: `worker/src/index.ts`

Parse `/room/<code>` → route to DO stub; everything else → `env.ASSETS.fetch()`. Add SPA fallback so client-side routes don't 404.

**Commit** `feat(worker): router with assets binding`

### Task 11: Client socket layer
**Files:**
- Create: `client/src/socket.js` — `partysocket` factory + `.emit`/`.on` adapter so the 20 existing components are untouched
- Modify: `client/src/App.jsx` — swap `socket.io-client` for the new module, delete the `set-username` flow
- Modify: `client/src/pages/Home.jsx` — capture username *before* connecting

**Verify:** `npm run build` in `client/`, then full game playable in `wrangler dev`.
**Commit** `feat(client): swap socket.io for partysocket`

---

## Phase 6 — Bot, polish, deploy (Day 4–5)

### Task 12: Bot player
`worker/src/do/bot.ts`. Bot player rows with `is_bot = 1`, spawned only in the `lobby` phase when human count < 4 and never when 4 humans are present. Driven by the same alarms as phase transitions — **no separate timers**. King reveals after 3–8s, Police guesses after 5–15s, others idle and occasionally emote. `?bots=off` disables.

**Verify:** one browser tab alone can play a full round.
**Commit** `feat(worker): bot players fill empty seats`

### Task 13: Full test suite + CI
- Unit: `roles`, `game`, `protocol` (pure, fast)
- Integration: `GameRoom` against a real DO instance
- Replace `.github/workflows/progress-tracker.yml` with a real workflow: install → `tsc --noEmit` → `vitest run` → `wrangler deploy --dry-run`

**Commit** `ci(worker): replace progress tracker with build, typecheck and test`

### Task 14: README rewrite
Delete the emoji progress dashboard and the `0/12` counter. New README: what it is → **live demo link** → how to run → architecture → the DO/hibernation/alarm explanation → trade-offs → test coverage (real numbers).

**Commit** `docs: rewrite README around the deployed demo`

### Task 15: Deploy
`npx wrangler deploy` → live `*.workers.dev` URL. Update README, profile, and GitHub description.

---

## Verification checklist before calling this done

- [ ] `npx tsc --noEmit` clean
- [ ] `npx vitest run` all green, including the eviction test
- [ ] `npx wrangler deploy --dry-run` clean
- [ ] Live URL loads and one visitor can play a full round alone
- [ ] DO metrics confirm idle rooms incur **no duration charge**
- [ ] README contains no progress dashboard
- [ ] `legacy-express` branch still intact

## Rollback

Deploy `legacy-express` to Render's free tier (single Express process serving `client/dist` + Socket.IO on one port) in roughly an hour. The branch is already on the remote.
