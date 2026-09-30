/**
 * Role assignment — pure functions, no Durable Object or WebSocket imports.
 *
 * Ported from server/game-logic/roles.js. The original defined shuffleArray
 * twice (once unused in handlers/game.js); there is one copy here.
 */

export const ROLES = ['King', 'Queen', 'Police', 'Thief'] as const;
export type Role = (typeof ROLES)[number];

/** Fisher-Yates. Returns a new array; never mutates the input. */
export function shuffleArray<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Both indices are in range by construction; the assertions satisfy
    // noUncheckedIndexedAccess rather than papering over a real gap.
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** The minimum shape assignRoles needs. Avoids coupling to storage types. */
export type AssignablePlayer = { username: string; role: Role | null };

/**
 * Assigns one role to every player, in place. Requires exactly four players —
 * the game enforces a four-player room before calling this.
 */
export function assignRoles(players: AssignablePlayer[]): void {
  const shuffled = shuffleArray(ROLES);
  players.forEach((player, i) => {
    player.role = shuffled[i] ?? null;
  });
}
