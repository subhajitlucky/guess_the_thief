/**
 * Scoring and game-state transitions — pure functions.
 *
 * Ported from server/game-logic/state.js. The original took a whole `room`
 * object; this takes the roster directly, which keeps it testable without a
 * Durable Object.
 */

import type { Role } from './roles';

export type Phase =
  | 'role-spinning'
  | 'king-turn'
  | 'waiting-police-response'
  | 'police-investigation'
  | 'round-over';

export type GameState = {
  phase: Phase;
  round: number;
  scores: Record<string, number>;
};

export type ScoredPlayer = { username: string; role: Role | null };

export function createInitialGameState(players: ScoredPlayer[]): GameState {
  return {
    phase: 'role-spinning',
    round: 1,
    scores: players.reduce<Record<string, number>>((acc, player) => {
      acc[player.username] = 0;
      return acc;
    }, {}),
  };
}

/**
 * King and Queen score every round regardless of outcome. The remaining 300
 * points go to the Police on a correct guess, otherwise to the Thief.
 *
 * Missing roles are skipped rather than scored, so a partial roster cannot
 * produce NaN.
 */
export function updateScores(
  players: ScoredPlayer[],
  gameState: GameState,
  guessResult: 'correct' | 'incorrect',
): void {
  const add = (role: Role, points: number): void => {
    const player = players.find((p) => p.role === role);
    if (!player) return;
    gameState.scores[player.username] = (gameState.scores[player.username] ?? 0) + points;
  };

  add('King', 1000);
  add('Queen', 500);

  if (guessResult === 'correct') add('Police', 300);
  else add('Thief', 300);
}
