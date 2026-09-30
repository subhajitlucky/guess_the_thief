/**
 * GameRoom — one Durable Object per game room.
 *
 * The DO *is* the room. There is no room registry: the Worker routes
 * /room/<CODE> to the instance whose ID is idFromName(CODE), so state can
 * never be addressed across rooms.
 *
 * Three constraints shape everything here:
 *
 *  1. Hibernation. state.acceptWebSocket() lets the runtime evict this
 *     instance while sockets stay open, which is what keeps idle rooms off
 *     the bill. The consequence is that no game state may live in a module
 *     or instance variable — it all lives in SQLite.
 *
 *  2. Alarms, not setTimeout. An in-memory timer dies with the instance on
 *     eviction, so every phase delay is a Durable Object Alarm, which
 *     survives eviction.
 *
 *  3. One writer. A DO is single-threaded, so there are no locks and no
 *     cross-room interference.
 */

import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import type { PlayerRecord } from './protocol';
import { allPublicPlayers, gameStartedFor } from './protocol';
import { assignRoles, type Role } from './roles';
import { createInitialGameState, updateScores, type GameState } from './game';
import * as db from './state';

export const MAX_PLAYERS = 4;
export const MAX_ROUNDS = 10;
const SPIN_MS = 5_000;
const INVESTIGATION_MS = 60_000;
const ROUND_RESULT_MS = 8_000;
const BOT_NAMES = ['Cipher', 'Rook', 'Nova', 'Vex', 'Juno', 'Onyx'] as const;

type Attachment = { username: string };
type Outbound = { t: string } & Record<string, unknown>;
type Inbound = { t: string; roomCode?: string; guess?: string; emoji?: string };

export class GameRoom extends DurableObject<Env> {
  /** Set during construction from the URL path; never changes afterwards. */
  private readonly roomCode: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // For a named ID, .name is the room code. ctx.id.toString() would return
    // the bare name, not a URL.
    this.roomCode = ctx.id.name ?? 'LOBBY';
    // schema creation must not interleave with a first request
    ctx.blockConcurrencyWhile(async () => {
      db.initSchema(ctx.storage.sql);
    });
  }

  // ---------------------------------------------------------------- routing

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Guess the Thief — connect over WebSocket', { status: 426 });
    }

    const name = (url.searchParams.get('name') ?? '').trim().slice(0, 20);
    if (!name) {
      return new Response('Missing ?name=', { status: 400 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // acceptWebSocket hands the socket to the runtime, which may then evict
    // this instance while the connection stays open. That is the whole point:
    // an idle room costs nothing once it is hibernated.
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ username: name } satisfies Attachment);

    const admitted = await this.admit(name);
    if (admitted.ok) {
      server.send(
        JSON.stringify({ t: 'room-joined', roomCode: this.roomCode, players: admitted.players }),
      );
      this.broadcastLobby();
    } else {
      server.send(JSON.stringify({ t: 'room-error', message: admitted.reason } satisfies Outbound));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // ------------------------------------------------------------- WebSocket

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    let msg: Inbound;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)) as Inbound;
    } catch {
      ws.send(JSON.stringify({ t: 'room-error', message: 'Malformed message' } satisfies Outbound));
      return;
    }

    // The DO is addressed by path. A message naming a different room is a
    // confused-deputy attempt and is refused before touching state.
    if (msg.roomCode && msg.roomCode !== this.roomCode) {
      ws.send(JSON.stringify({ t: 'room-error', message: 'Room code mismatch' } satisfies Outbound));
      return;
    }

    const me = this.usernameOf(ws);
    if (!me) {
      ws.send(JSON.stringify({ t: 'room-error', message: 'Not in a room' } satisfies Outbound));
      return;
    }

    const room = this.load();
    if (!room) {
      ws.send(JSON.stringify({ t: 'room-error', message: 'Room not found' } satisfies Outbound));
      return;
    }
    const players = db.allPlayers(this.sql);

    switch (msg.t) {
      case 'create-room':
      case 'join-room': {
        const res = await this.admit(me);
        if (res.ok) {
          ws.send(JSON.stringify({ t: 'room-joined', roomCode: this.roomCode, players: res.players }));
          this.broadcastLobby();
        } else {
          ws.send(JSON.stringify({ t: 'room-error', message: res.reason } satisfies Outbound));
        }
        return;
      }

      case 'leave-room':
      case 'leave-game':
        this.removePlayer(me, players, room);
        return;

      case 'get-lobby-state':
        this.broadcastLobby();
        return;

      case 'toggle-ready': {
        const player = players.find((p) => p.username === me);
        if (!player) return;
        player.isReady = !player.isReady;
        this.persistPlayers(players);
        this.broadcastLobby();
        return;
      }

      case 'start-game':
        this.startGame(room, players, me);
        return;

      case 'join-room-for-game':
        // Replay state to someone who navigated in late.
        if (room.status === 'playing') {
          const view = gameStartedFor(players, me, 'Game in progress');
          ws.send(
            JSON.stringify({
              t: 'game-started',
              ...view,
              gameState: this.gameState(room),
            } satisfies Outbound),
          );
        }
        return;

      case 'king-reveals-police':
        this.transition(room, players, 'king-turn', me, 'King');
        return;

      case 'police-responds':
        this.transition(room, players, 'waiting-police-response', me, 'Police');
        return;

      case 'police-guess-thief':
        this.resolveGuess(room, players, me, msg.guess ?? '');
        return;

      case 'send-emoji':
        this.broadcast({
          t: 'emoji-broadcast',
          emoji: String(msg.emoji ?? '').slice(0, 8),
          from: me, // server-supplied, never the client's word for it
        });
        return;

      default:
        ws.send(JSON.stringify({ t: 'room-error', message: `Unknown event: ${msg.t}` } satisfies Outbound));
    }
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    const me = this.usernameOf(ws);
    if (!me) return;
    this.removePlayer(me, db.allPlayers(this.sql), this.load());
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  // ---------------------------------------------------------------- alarms

  /**
   * Replaces all four setTimeout calls in the Express build. Each branch
   * re-reads state from SQLite and re-checks the phase, so a stale alarm
   * that outlives its phase is a no-op rather than a corruption.
   */
  override async alarm(): Promise<void> {
    const room = this.load();
    if (!room) return;

    const players = db.allPlayers(this.sql);

    switch (room.phase) {
      case 'role-spinning':
        this.enterKingTurn(room, players);
        return;

      case 'police-investigation':
        // Police ran out of time: the Thief evades.
        this.scoreAndEndRound(room, players, 'incorrect', `Time's up! The Police failed to catch the thief.`);
        return;

      case 'round-over':
        this.advanceRound(room, players);
        return;

      default:
        return; // king-turn / waiting-police-response: waiting on a human
    }
  }

  // ------------------------------------------------------------- game flow

  private startGame(room: db.RoomRecord, players: PlayerRecord[], me: string): void {
    if (room.host !== me) return this.sendError(me, 'lobby-error', 'Only the host can start the game');
    if (players.length !== MAX_PLAYERS) return this.sendError(me, 'lobby-error', `Need ${MAX_PLAYERS} players to start`);
    if (!players.every((p) => p.isReady)) return this.sendError(me, 'lobby-error', 'All players must be ready');

    assignRoles(players);
    const gs = createInitialGameState(players);

    room.status = 'playing';
    room.phase = 'role-spinning';
    room.round = 1;
    room.scores = gs.scores;
    room.updatedAt = Date.now();

    this.persistPlayers(players);
    db.saveRoom(this.sql, room);
    db.appendRoundLog(this.sql, 1, 'round-start', { roles: Object.fromEntries(players.map((p) => [p.username, p.role])) }, Date.now());

    for (const p of players) {
      this.sendTo(p.username, { t: 'game-started', ...gameStartedFor(players, p.username), gameState: gs });
    }

    // The spinner, then the King's turn. This is the alarm that setTimeout
    // used to provide — and the reason the game no longer dies when the
    // instance is evicted during the spin.
    this.alarmIn(SPIN_MS);
  }

  private enterKingTurn(room: db.RoomRecord, players: PlayerRecord[]): void {
    if (room.phase !== 'role-spinning') return;
    room.phase = 'king-turn';
    room.updatedAt = Date.now();
    db.saveRoom(this.sql, room);
    this.broadcastGameUpdate(room, "The King is now in charge!");
  }

  private transition(
    room: db.RoomRecord,
    players: PlayerRecord[],
    from: GameState['phase'],
    me: string,
    role: Role,
  ): void {
    const actor = players.find((p) => p.username === me);
    if (!actor || actor.role !== role) return; // not your move
    if (room.phase !== from) return;

    if (from === 'king-turn') {
      room.phase = 'waiting-police-response';
      room.updatedAt = Date.now();
      db.saveRoom(this.sql, room);
      this.broadcastChat(me, 'Who is the Police here? Find the thief in 1 minute!');
      this.broadcastGameUpdate(room, 'Waiting for Police to respond...');
      return;
    }

    // Police has answered: open the investigation window.
    room.phase = 'police-investigation';
    room.updatedAt = Date.now();
    db.saveRoom(this.sql, room);
    this.broadcastChat(me, 'Your Majesty, I am the Police! I will find the thief in 1 minute!');
    this.broadcastGameUpdate(room, 'The Police is now investigating. 1 minute remaining!');
    this.alarmIn(INVESTIGATION_MS);
  }

  private resolveGuess(room: db.RoomRecord, players: PlayerRecord[], me: string, guess: string): void {
    const police = players.find((p) => p.username === me);
    if (!police || police.role !== 'Police') return;
    if (room.phase !== 'police-investigation') return;

    const thief = players.find((p) => p.role === 'Thief');
    const correct = thief !== undefined && thief.username === guess;
    this.scoreAndEndRound(room, players, correct ? 'correct' : 'incorrect', null);
  }

  private scoreAndEndRound(
    room: db.RoomRecord,
    players: PlayerRecord[],
    result: 'correct' | 'incorrect',
    message: string | null,
  ): void {
    const gs = this.gameState(room);
    updateScores(players, gs, result);

    room.phase = 'round-over';
    room.scores = gs.scores;
    room.updatedAt = Date.now();
    db.saveRoom(this.sql, room);
    db.appendRoundLog(this.sql, room.round, 'round-result', { result, scores: gs.scores }, Date.now());

    const thief = players.find((p) => p.role === 'Thief');
    this.broadcastGameUpdate(
      room,
      message ??
        `The Police guessed ${thief?.username ?? 'no one'}. The guess was ${result.toUpperCase()}! The Thief was ${thief?.username ?? 'unknown'}.`,
    );

    // The Express build left the game stranded here when the Police timed
    // out — it only scheduled a continuation after an explicit guess. Both
    // paths now continue.
    this.alarmIn(ROUND_RESULT_MS);
  }

  private advanceRound(room: db.RoomRecord, players: PlayerRecord[]): void {
    if (room.round >= MAX_ROUNDS) {
      room.status = 'over';
      room.updatedAt = Date.now();
      db.saveRoom(this.sql, room);
      db.appendRoundLog(this.sql, room.round, 'game-over', { scores: room.scores }, Date.now());
      this.broadcast({ t: 'game-over', message: 'Game Over! Final Scores:', scores: room.scores });
      return;
    }

    room.round += 1;
    room.phase = 'role-spinning';
    room.updatedAt = Date.now();

    assignRoles(players);
    this.persistPlayers(players);
    db.saveRoom(this.sql, room);
    db.appendRoundLog(this.sql, room.round, 'round-start', { roles: Object.fromEntries(players.map((p) => [p.username, p.role])) }, Date.now());

    for (const p of players) {
      this.sendTo(p.username, {
        t: 'game-started',
        ...gameStartedFor(players, p.username, `Round ${room.round} has begun!`),
        gameState: this.gameState(room),
      });
    }

    this.alarmIn(SPIN_MS);
  }

  // ------------------------------------------------------------ membership

  private async admit(name: string): Promise<
    | { ok: true; players: ReturnType<typeof allPublicPlayers> }
    | { ok: false; reason: string }
  > {
    const players = db.allPlayers(this.sql);
    const existing = players.find((p) => p.username === name);

    if (existing) {
      // Reconnect: treat the socket as the same player.
      if (this.socketsOf(name).length > 0 && !existing.isBot) {
        return { ok: false, reason: 'That name is already in the room' };
      }
      existing.isReady = false;
      this.persistPlayers(players);
      return { ok: true, players: allPublicPlayers(players) };
    }

    if (players.length >= MAX_PLAYERS) {
      return { ok: false, reason: `Room is full (${MAX_PLAYERS}/${MAX_PLAYERS} players)` };
    }

    let room = this.load();
    if (!room) {
      room = {
        host: name,
        phase: 'role-spinning',
        round: 1,
        scores: {},
        status: 'lobby',
        updatedAt: Date.now(),
      };
    }

    const isFirst = players.length === 0;
    const player: PlayerRecord = {
      username: name,
      role: null,
      isReady: false,
      isHost: isFirst || room.host === null,
      isBot: false,
    };
    players.push(player);

    if (player.isHost) room.host = name;
    room.updatedAt = Date.now();

    this.persistPlayers(players);
    db.saveRoom(this.sql, room);

    if (isFirst) {
      wsSend(this.ctx, { t: 'room-created', roomCode: this.roomCode, players: allPublicPlayers(players) });
    }

    return { ok: true, players: allPublicPlayers(players) };
  }

  private removePlayer(me: string, players: PlayerRecord[], room: db.RoomRecord | null): void {
    const idx = players.findIndex((p) => p.username === me);
    if (idx === -1) return;

    const wasPlaying = room?.status === 'playing';
    players.splice(idx, 1);
    db.removePlayer(this.sql, me);

    if (wasPlaying && players.length > 0) {
      this.broadcast({ t: 'game-over', message: `Game Over: ${me} has left the game.`, scores: room?.scores ?? {} });
      this.teardown();
      return;
    }

    if (players.length === 0) {
      this.teardown();
      return;
    }

    // Host migration.
    const record = this.load();
    if (record) {
      if (record.host === me) {
        const next = players[0];
        if (next) {
          next.isHost = true;
          record.host = next.username;
        }
      }
      record.updatedAt = Date.now();
      this.persistPlayers(players);
      db.saveRoom(this.sql, record);
    }

    this.broadcastLobby();
  }

  private teardown(): void {
    this.ctx.storage.deleteAlarm();
    db.clearRoom(this.sql);
  }

  // ---------------------------------------------------------------- output

  private broadcastLobby(): void {
    const room = this.load();
    if (!room) return;
    const players = db.allPlayers(this.sql);
    this.broadcast({
      t: 'lobby-update',
      players: allPublicPlayers(players),
      host: room.host,
      canStart: players.length === MAX_PLAYERS && players.every((p) => p.isReady),
    });
  }

  private broadcastGameUpdate(room: db.RoomRecord, message: string): void {
    this.broadcast({ t: 'game-update', gameState: this.gameState(room), message });
  }

  private broadcastChat(from: string, text: string): void {
    this.broadcast({ t: 'chat-message', from, text, timestamp: Date.now(), type: 'player' });
  }

  private broadcast(msg: Outbound): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        /* socket went away mid-broadcast */
      }
    }
  }

  /** Send to every socket belonging to one player. */
  private sendTo(username: string, msg: Outbound): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.socketsOf(username)) {
      try {
        ws.send(payload);
      } catch {
        /* ignore */
      }
    }
  }

  private sendError(username: string, event: string, message: string): void {
    this.sendTo(username, { t: event, message });
  }

  // ----------------------------------------------------------------- utils

  private get sql(): SqlStorage {
    return this.ctx.storage.sql;
  }

  private load(): db.RoomRecord | null {
    return db.loadRoom(this.sql);
  }

  private gameState(room: db.RoomRecord): GameState {
    return { phase: room.phase, round: room.round, scores: room.scores };
  }

  private persistPlayers(players: PlayerRecord[]): void {
    const now = Date.now();
    for (const p of players) db.upsertPlayer(this.sql, p, now);
  }

  private usernameOf(ws: WebSocket): string | null {
    return ws.deserializeAttachment()?.username ?? null;
  }

  private socketsOf(username: string): WebSocket[] {
    return this.ctx.getWebSockets().filter((ws) => this.usernameOf(ws) === username);
  }

  private alarmIn(ms: number): void {
    this.ctx.storage.setAlarm(Date.now() + ms);
  }
}

/** Broadcast before any socket exists, i.e. the very first join. */
function wsSend(ctx: DurableObjectState, msg: Outbound): void {
  for (const ws of ctx.getWebSockets()) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* ignore */
    }
  }
}

export { BOT_NAMES };
