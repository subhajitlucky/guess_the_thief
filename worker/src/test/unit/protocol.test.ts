import { describe, it, expect } from 'vitest';
import { publicPlayer, allPublicPlayers, gameStartedFor, type PlayerRecord } from '../../do/protocol';

const p = (username: string, role: PlayerRecord['role'] = null): PlayerRecord => ({
  username,
  role,
  isReady: false,
  isHost: false,
  isBot: false,
});

describe('publicPlayer', () => {
  it('never leaks role', () => {
    const out = publicPlayer(p('a', 'Thief'));
    expect(out).toEqual({ username: 'a', isReady: false, isHost: false });
    expect('role' in out).toBe(false);
    expect(JSON.stringify(out)).not.toContain('Thief');
  });
});

describe('allPublicPlayers', () => {
  it('strips role from every player', () => {
    const roster = [p('a', 'King'), p('b', 'Thief'), p('c', 'Police'), p('d', 'Queen')];
    const out = allPublicPlayers(roster);
    const serialised = JSON.stringify(out);
    for (const role of ['King', 'Queen', 'Police', 'Thief']) {
      expect(serialised).not.toContain(role);
    }
    expect(out.map((x) => x.username)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('gameStartedFor', () => {
  const roster = [p('a', 'King'), p('b', 'Thief'), p('c', 'Police'), p('d', 'Queen')];

  it("includes the viewer's own role", () => {
    expect(gameStartedFor(roster, 'b').yourRole).toBe('Thief');
  });

  it('excludes every other player role', () => {
    const msg = gameStartedFor(roster, 'b');
    const serialised = JSON.stringify(msg);
    expect(serialised).toContain('Thief'); // only because it is yours
    expect(msg.allPlayers.map((x) => x.username)).toEqual(['a', 'b', 'c', 'd']);
    for (const pl of msg.allPlayers) {
      expect('role' in pl).toBe(false);
    }
  });

  it('yields yourRole null for a viewer who is not in the roster', () => {
    expect(gameStartedFor(roster, 'ghost').yourRole).toBeNull();
  });
});
