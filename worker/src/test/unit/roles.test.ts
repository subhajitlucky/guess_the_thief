import { describe, it, expect } from 'vitest';
import { ROLES, shuffleArray, assignRoles } from '../../do/roles';

describe('shuffleArray', () => {
  it('returns a permutation: no duplicates, nothing lost', () => {
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

  it('actually varies the order across runs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(shuffleArray(ROLES).join(','));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('assignRoles', () => {
  const players = () => [
    { username: 'a', role: null },
    { username: 'b', role: null },
    { username: 'c', role: null },
    { username: 'd', role: null },
  ];

  it('gives every player exactly one role and uses all four roles', () => {
    for (let i = 0; i < 200; i++) {
      const p = players();
      assignRoles(p);
      expect(p.map((x) => x.role).sort()).toEqual(['King', 'Police', 'Queen', 'Thief']);
    }
  });

  it('reaches all 24 permutations over many runs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const p = players();
      assignRoles(p);
      seen.add(p.map((x) => `${x.username}:${x.role}`).join(','));
    }
    expect(seen.size).toBe(24);
  });
});
