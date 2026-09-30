/**
 * Wire format and — more importantly — what must never leave the server.
 *
 * Regression guard for a real bug in the Express build: handlers/lobby.js
 * broadcast `room.players` unfiltered, so once assignRoles() attached a role
 * to each player, a later `lobby-update` handed every client every secret
 * role. In a social-deduction game that ends the game.
 *
 * Rule enforced here: a player's role is only ever included in a message
 * addressed to that player, and only via the `yourRole` field.
 */

import type { Role } from './roles';

export type PlayerRecord = {
  username: string;
  role: Role | null;
  isReady: boolean;
  isHost: boolean;
  isBot: boolean;
};

/** The only player shape that may ever be broadcast to every client. */
export type PublicPlayer = {
  username: string;
  isReady: boolean;
  isHost: boolean;
};

export function publicPlayer(player: PlayerRecord): PublicPlayer {
  return {
    username: player.username,
    isReady: player.isReady,
    isHost: player.isHost,
  };
}

export function allPublicPlayers(players: PlayerRecord[]): PublicPlayer[] {
  return players.map(publicPlayer);
}

export type GameStartedMessage = {
  message: string;
  yourRole: Role | null;
  allPlayers: PublicPlayer[];
};

/**
 * Builds the per-player `game-started` payload. `viewer` receives their own
 * role; nobody else's role appears anywhere in the message.
 */
export function gameStartedFor(
  players: PlayerRecord[],
  viewer: string,
  message = 'The game has begun!',
): GameStartedMessage {
  return {
    message,
    yourRole: players.find((p) => p.username === viewer)?.role ?? null,
    allPlayers: allPublicPlayers(players),
  };
}
