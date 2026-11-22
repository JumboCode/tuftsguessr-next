// Server-only: import this from API routes, never from client components.
import { Redis } from "@upstash/redis";
import clues from "@/lib/clues";
import type { GameState, Player } from "@/lib/game";

// Redis layout:
//   game                hash   round, image, points (missing = no round yet)
//   players             hash   "<id>:name" -> name, "<id>:points" -> points
//   pguesses:<round>    hash   playerId -> "56,44" (building IDs guessed)
//   guesses:<round>     list   recent guesses for the admin feed, newest first
//   correct:<round>     string count of correct guesses (admin plays a sound)
export const KEYS = {
  game: "game",
  players: "players",
  playerGuesses: (round: number) => `pguesses:${round}`,
  guesses: (round: number) => `guesses:${round}`,
  correct: (round: number) => `correct:${round}`,
};

let client: Redis | null = null;

// Vercel's Upstash integration sets KV_REST_API_*; Upstash's own docs use
// UPSTASH_REDIS_REST_*. Either pair works.
export function redis() {
  if (client) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Redis is not configured. Connect Upstash Redis to this Vercel project (Storage tab) and redeploy, or add KV_REST_API_URL and KV_REST_API_TOKEN to .env.local."
    );
  }
  client = new Redis({ url, token });
  return client;
}

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function readGame(): Promise<GameState> {
  const g = await redis().hgetall<Record<string, unknown>>(KEYS.game);
  return {
    round: toNumberOrNull(g?.round),
    image: toNumberOrNull(g?.image),
    points: toNumberOrNull(g?.points),
  };
}

export function parsePlayers(raw: Record<string, unknown> | null): Player[] {
  const byId = new Map<string, Player>();
  for (const [field, value] of Object.entries(raw ?? {})) {
    const sep = field.lastIndexOf(":");
    const id = field.slice(0, sep);
    const key = field.slice(sep + 1);
    const player = byId.get(id) ?? { id, name: "", points: 0 };
    if (key === "name") player.name = String(value);
    if (key === "points") player.points = Number(value) || 0;
    byId.set(id, player);
  }
  return [...byId.values()].filter((p) => p.name);
}

export function parseGuessList(value: unknown): number[] {
  if (value === null || value === undefined || value === "") return [];
  return String(value)
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export function clueForRound(round: number) {
  return clues[round] ?? null;
}

export function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ error: message }, { status });
}
