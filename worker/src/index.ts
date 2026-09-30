/**
 * Worker entry point.
 *
 * Two jobs: route /room/<CODE> to the Durable Object that *is* that room,
 * and serve the React build for everything else.
 *
 * The room code has to be in the URL path rather than in a message. Durable
 * Objects are addressed by path, so there is no server-side room table to
 * look one up in — which is also why the old post-connect `set-username`
 * step no longer exists: identity travels in the query string.
 */

import { GameRoom } from './do/GameRoom';

export interface Env {
  GAME: DurableObjectNamespace<GameRoom>;
  ASSETS: Fetcher;
  /** "on" (default) or "off". See design doc §9. */
  BOT_FILL?: string;
}

const ROOM_PATH = /^\/room\/([A-Za-z0-9]{1,12})\/?$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = ROOM_PATH.exec(url.pathname);

    if (match?.[1]) {
      const code = match[1].toUpperCase();
      const stub = env.GAME.get(env.GAME.idFromName(code));
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export { GameRoom };
