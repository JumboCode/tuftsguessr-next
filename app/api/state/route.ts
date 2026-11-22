import { errorResponse, KEYS, parseGuessList, readGame, redis } from "@/lib/store";
import type { PlayerView } from "@/lib/game";

export const dynamic = "force-dynamic";

// Polled by each player's phone.
export async function GET(request: Request) {
  try {
    const playerId = new URL(request.url).searchParams.get("playerId");
    const game = await readGame();

    if (!playerId) {
      return Response.json({ game, player: null, myGuesses: [] } satisfies PlayerView);
    }

    const [[name, points], guessed] = await Promise.all([
      redis().hmget<Record<string, unknown>>(
        KEYS.players,
        `${playerId}:name`,
        `${playerId}:points`
      ).then((r) => [r?.[`${playerId}:name`], r?.[`${playerId}:points`]]),
      game.round === null
        ? Promise.resolve(null)
        : redis().hget(KEYS.playerGuesses(game.round), playerId),
    ]);

    const view: PlayerView = {
      game,
      player:
        name === null || name === undefined
          ? null
          : { id: playerId, name: String(name), points: Number(points) || 0 },
      myGuesses: parseGuessList(guessed),
    };
    return Response.json(view);
  } catch (error) {
    return errorResponse(error);
  }
}
