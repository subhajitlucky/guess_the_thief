import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the pure game logic (roles, scoring, protocol shaping).
 *
 * These deliberately run in the plain Node environment rather than the
 * Cloudflare Workers pool: none of them touch Durable Objects, SQLite, or
 * WebSockets, so spinning up workerd would cost seconds per run for nothing.
 *
 * Durable Object integration tests live in `vitest.workers.config.ts` and
 * run under `@cloudflare/vitest-pool-workers`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/test/unit/**/*.test.ts'],
  },
});
