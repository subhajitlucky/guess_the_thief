/**
 * SQLite persistence for one game room.
 *
 * Everything the room knows lives here rather than in module variables,
 * because a hibernating Durable Object is evicted from memory between
 * requests. That constraint is also what keeps idle rooms free: a room with
 * no live sockets holds no billable in-memory state.
 *
 * Write discipline: rows-written allowance is 50x scarcer than row-reads on
 * the free tier, so handlers read once at the top, mutate, and persist once
 * at the end rather than writing after every field change.
 */

import type { SqlStorage } from '@cloudflare/workers-types';
import type { Role } from './roles';
import type { Phase } from './game';
import type { PlayerRecord } from './protocol';

export type RoomStatus = 'lobby' | 'playing' | 'over';

export type RoomRecord = {
  host: string | null;
  phase: Phase;
  round: number;
  scores: Record<string, number>;
  status: RoomStatus;
  updatedAt: number;
};

/** Consumes a cursor so writes actually execute. */
function run(sql: SqlStorage, query: string, ...bindings: unknown[]): void {
  sql.exec(query, ...bindings).raw();
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS room (
     id         INTEGER PRIMARY KEY CHECK (id = 1),
     host       TEXT,
     phase      TEXT    NOT NULL DEFAULT 'role-spinning',
     round      INTEGER NOT NULL DEFAULT 1,
     scores     TEXT    NOT NULL DEFAULT '{}',
     status     TEXT    NOT NULL DEFAULT 'lobby',
     updated_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS players (
     username  TEXT PRIMARY KEY,
     is_ready  INTEGER NOT NULL DEFAULT 0,
     is_host   INTEGER NOT NULL DEFAULT 0,
     role      TEXT,
     is_bot    INTEGER NOT NULL DEFAULT 0,
     joined_at INTEGER NOT NULL
   )`,
  // The visible payoff of persistence: a finished game keeps its history.
  `CREATE TABLE IF NOT EXISTS round_log (
     id      INTEGER PRIMARY KEY AUTOINCREMENT,
     round   INTEGER NOT NULL,
     event   TEXT    NOT NULL,
     payload TEXT,
     at      INTEGER NOT NULL
   )`,
];

export function initSchema(sql: SqlStorage): void {
  for (const stmt of SCHEMA) run(sql, stmt);
}

export function loadRoom(sql: SqlStorage): RoomRecord | null {
  const row = sql
    .exec<{
      host: string | null;
      phase: Phase;
      round: number;
      scores: string;
      status: RoomStatus;
      updated_at: number;
    }>(
      `SELECT host, phase, round, scores, status, updated_at FROM room WHERE id = 1`,
    )
    .toArray()[0];

  if (!row) return null;

  return {
    host: row.host,
    phase: row.phase,
    round: row.round,
    scores: JSON.parse(row.scores) as Record<string, number>,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function saveRoom(sql: SqlStorage, room: RoomRecord): void {
  run(
    sql,
    `INSERT INTO room (id, host, phase, round, scores, status, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       host = excluded.host,
       phase = excluded.phase,
       round = excluded.round,
       scores = excluded.scores,
       status = excluded.status,
       updated_at = excluded.updated_at`,
    room.host,
    room.phase,
    room.round,
    JSON.stringify(room.scores),
    room.status,
    room.updatedAt,
  );
}

export function allPlayers(sql: SqlStorage): PlayerRecord[] {
  const rows = sql
    .exec<{
      username: string;
      is_ready: number;
      is_host: number;
      role: Role | null;
      is_bot: number;
    }>(
      `SELECT username, is_ready, is_host, role, is_bot
       FROM players ORDER BY joined_at ASC`,
    )
    .toArray();

  return rows.map((r) => ({
    username: r.username,
    isReady: r.is_ready === 1,
    isHost: r.is_host === 1,
    isBot: r.is_bot === 1,
    role: r.role,
  }));
}

export function playerCount(sql: SqlStorage, botsOnly = false): number {
  const where = botsOnly ? 'WHERE is_bot = 1' : '';
  const row = sql
    .exec<{ n: number }>(`SELECT COUNT(*) AS n FROM players ${where}`)
    .toArray()[0];
  return row?.n ?? 0;
}

export function upsertPlayer(sql: SqlStorage, player: PlayerRecord, now: number): void {
  run(
    sql,
    `INSERT INTO players (username, is_ready, is_host, role, is_bot, joined_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       is_ready = excluded.is_ready,
       is_host  = excluded.is_host,
       role     = excluded.role,
       is_bot   = excluded.is_bot`,
    player.username,
    player.isReady ? 1 : 0,
    player.isHost ? 1 : 0,
    player.role,
    player.isBot ? 1 : 0,
    now,
  );
}

export function removePlayer(sql: SqlStorage, username: string): void {
  run(sql, `DELETE FROM players WHERE username = ?`, username);
}

export function clearRoles(sql: SqlStorage): void {
  run(sql, `UPDATE players SET role = NULL`);
}

export function appendRoundLog(
  sql: SqlStorage,
  round: number,
  event: string,
  payload: unknown,
  now: number,
): void {
  run(
    sql,
    `INSERT INTO round_log (round, event, payload, at) VALUES (?, ?, ?, ?)`,
    round,
    event,
    payload === undefined ? null : JSON.stringify(payload),
    now,
  );
}

export function roundHistory(
  sql: SqlStorage,
): Array<{ round: number; event: string; payload: unknown; at: number }> {
  return sql
    .exec<{ round: number; event: string; payload: string | null; at: number }>(
      `SELECT round, event, payload, at FROM round_log ORDER BY id ASC`,
    )
    .toArray()
    .map((r) => ({
      round: r.round,
      event: r.event,
      at: r.at,
      payload: r.payload === null ? null : (JSON.parse(r.payload) as unknown),
    }));
}

/** Full teardown. Used when the last player leaves so abandoned rooms do
 *  not accumulate against the 5 GB storage cap. */
export function clearRoom(sql: SqlStorage): void {
  run(sql, `DELETE FROM room`);
  run(sql, `DELETE FROM players`);
  run(sql, `DELETE FROM round_log`);
}

export function roomExists(sql: SqlStorage): boolean {
  const row = sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM room`).toArray()[0];
  return (row?.n ?? 0) > 0;
}
