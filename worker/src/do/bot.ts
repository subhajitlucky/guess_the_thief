/**
 * Bot players.
 *
 * The point is demoability, not difficulty. A four-player multiplayer game
 * opened by a single visitor shows an empty lobby, and the visitor closes the
 * tab. Bots fill the empty seats so one person can play a full round.
 *
 * Two constraints:
 *
 * - No separate timers. Every bot action is scheduled through the room's one
 *   pending Alarm, exactly like a human timeout. A second timer would both
 *   break the one-alarm-per-instance rule and add billable duration.
 * - Bots only exist in the lobby phase. A room with four humans never grows a
 *   bot, and bots are dropped the moment a human takes the seat.
 */

import type { PlayerRecord } from './protocol';
import type { Role } from './roles';
import { ROLES } from './roles';

const NAMES = ['Cipher', 'Rook', 'Nova', 'Vex', 'Juno', 'Onyx', 'Wren', 'Ash'] as const;

/** Deterministic-ish jitter so a bot does not feel robotic. */
const between = (min: number, max: number): number => min + Math.floor(Math.random() * (max - min));

export function botsEnabled(configured?: string): boolean {
  return configured !== 'off';
}

export function humanPlayers(players: PlayerRecord[]): PlayerRecord[] {
  return players.filter((p) => !p.isBot);
}

/**
 * Fills the room to MAX_PLAYERS with bots and marks everyone ready, so a
 * lone visitor can hit "start" immediately.
 */
export function fillWithBots(players: PlayerRecord[], max: number): PlayerRecord[] {
  let added = 0;
  for (const name of NAMES) {
    if (players.length >= max) break;
    if (players.some((p) => p.username === name)) continue;
    players.push({
      username: name,
      role: null,
      isReady: true, // bots never stall a lobby
      isHost: false,
      isBot: true,
    });
    added++;
  }
  return added > 0 ? players : players;
}

export function stripBots(players: PlayerRecord[]): boolean {
  const kept = players.filter((p) => !p.isBot);
  if (kept.length === players.length) return false;
  players.length = 0;
  players.push(...kept);
  return true;
}

export function roleHolder(players: PlayerRecord[], role: Role): PlayerRecord | undefined {
  return players.find((p) => p.role === role);
}

/** How long a human gets before a bot takes over their turn. */
export const HUMAN_GRACE_MS = 45_000;

/**
 * When should the next thing happen?
 *
 * Returns milliseconds, or null when a human must act and no timeout is
 * worth scheduling. Exactly one Alarm is pending at any moment.
 *
 * A human turn still gets a grace period rather than null: without it a solo
 * visitor who is dealt King and walks away leaves the room wedged forever,
 * because no human is left to trigger the next phase.
 */
export function nextBotDelay(
  players: PlayerRecord[],
  phase: string,
): number | null {
  if (phase === 'role-spinning') return 5_000;

  if (phase === 'king-turn') {
    return roleHolder(players, 'King')?.isBot ? between(3_000, 8_000) : HUMAN_GRACE_MS;
  }

  if (phase === 'waiting-police-response') {
    return roleHolder(players, 'Police')?.isBot ? between(3_000, 8_000) : HUMAN_GRACE_MS;
  }

  if (phase === 'police-investigation') {
    // A bot Police decides quickly; a human Police gets the full window.
    return roleHolder(players, 'Police')?.isBot ? between(5_000, 15_000) : 60_000;
  }

  if (phase === 'round-over') return 8_000;

  return null;
}

/**
 * Who acts on a timeout. Normally the role holder, but when the grace period
 * has expired on a human turn a bot stands in so the round cannot wedge.
 */
export function actorFor(
  players: PlayerRecord[],
  role: Role,
): PlayerRecord | undefined {
  const holder = roleHolder(players, role);
  if (holder && !holder.isBot) return holder;
  return holder ?? players.find((p) => p.isBot);
}

/**
 * The bot's guess. Deliberately beatable — roughly one in four it picks the
 * Thief, so a solo visitor usually wins a round and keeps playing.
 */
export function botGuess(players: PlayerRecord[]): string {
  const candidates = players.filter((p) => p.role !== 'Police');
  if (candidates.length === 0) return '';

  if (Math.random() < 0.25) {
    return candidates.find((p) => p.role === 'Thief')?.username ?? candidates[0]!.username;
  }

  const others = candidates.filter((p) => p.role !== 'Thief');
  return (others.length ? others : candidates)[Math.floor(Math.random() * (others.length || candidates.length))]!.username;
}

/** Idle chatter so the feed is not dead while waiting. */
export const EMOJI = ['🕵️', '🤔', '👀', '😈', '🫣'] as const;

export function botEmoji(): string {
  return EMOJI[Math.floor(Math.random() * EMOJI.length)] ?? '🤔';
}

export { ROLES };
