import { describe, it, expect } from 'vitest';
import { createInitialGameState, updateScores, type ScoredPlayer } from '../../do/game';

const four = (): ScoredPlayer[] =>
  [
    { username: 'king', role: 'King' },
    { username: 'queen', role: 'Queen' },
    { username: 'police', role: 'Police' },
    { username: 'thief', role: 'Thief' },
  ] as ScoredPlayer[];

describe('createInitialGameState', () => {
  it('starts at round 1 in the role-spinning phase', () => {
    const gs = createInitialGameState(four());
    expect(gs.phase).toBe('role-spinning');
    expect(gs.round).toBe(1);
  });

  it('seeds every player at zero', () => {
    const gs = createInitialGameState(four());
    expect(gs.scores).toEqual({ king: 0, queen: 0, police: 0, thief: 0 });
  });

  it('handles an empty roster without throwing', () => {
    expect(createInitialGameState([]).scores).toEqual({});
  });
});

describe('updateScores', () => {
  it('awards the King 1000 and the Queen 500 on a correct guess', () => {
    const players = four();
    const gs = createInitialGameState(players);
    updateScores(players, gs, 'correct');
    expect(gs.scores).toEqual({ king: 1000, queen: 500, police: 300, thief: 0 });
  });

  it('awards the Thief 300 and the Police nothing on an incorrect guess', () => {
    const players = four();
    const gs = createInitialGameState(players);
    updateScores(players, gs, 'incorrect');
    expect(gs.scores).toEqual({ king: 1000, queen: 500, police: 0, thief: 300 });
  });

  it('accumulates across rounds', () => {
    const players = four();
    const gs = createInitialGameState(players);
    updateScores(players, gs, 'correct');
    updateScores(players, gs, 'incorrect');
    expect(gs.scores).toEqual({ king: 2000, queen: 1000, police: 300, thief: 300 });
  });

  it('never produces NaN when a role is missing from the roster', () => {
    const players = [{ username: 'king', role: 'King' }] as ScoredPlayer[];
    const gs = createInitialGameState(players);
    expect(() => updateScores(players, gs, 'correct')).not.toThrow();
    expect(Number.isNaN(gs.scores.king ?? NaN)).toBe(false);
    expect(gs.scores).toEqual({ king: 1000 });
  });
});
