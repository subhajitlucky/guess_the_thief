import type { GameRoom } from './do/GameRoom';

export interface Env {
  /** Durable Object namespace. One instance per room, keyed by room code. */
  GAME: DurableObjectNamespace<GameRoom>;
  /** Static client build. */
  ASSETS: Fetcher;
  /** "on" (default) or "off". Bots fill empty seats so one visitor can play. */
  BOT_FILL?: string;
}
