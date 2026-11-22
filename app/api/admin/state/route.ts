import clues from "@/lib/clues";
import {
  errorResponse,
  KEYS,
  parsePlayers,
  readGame,
  redis,
} from "@/lib/store";
import { pointsForImage, type AdminView, type Guess } from "@/lib/game";

export const dynamic = "force-dynamic";

function parseGuess(value: unknown): Guess | null {
  try {
    return (typeof value === "string" ? JSON.parse(value) : value) as Guess;
  } catch {
    return null;
  }
}

// Polled by the admin board.
export async function GET(request: Request) {
  try {
    const roundParam = new URL(request.url).searchParams.get("round");
    const round = roundParam === null ? null : Number(roundParam);
    const db = redis();

    const [game, rawPlayers, rawGuesses, correct] = await Promise.all([
      readGame(),
      db.hgetall<Record<string, unknown>>(KEYS.players),
      round === null ? Promise.resolve([]) : db.lrange(KEYS.guesses(round), 0, 14),
      round === null ? Promise.resolve(0) : db.get<number>(KEYS.correct(round)),
    ]);

    const view: AdminView = {
      game,
      players: parsePlayers(rawPlayers),
      guesses: rawGuesses.map(parseGuess).filter((g): g is Guess => g !== null),
      correctCount: Number(correct) || 0,
    };
    return Response.json(view);
  } catch (error) {
    return errorResponse(error);
  }
}

type Action =
  | { action: "reset" }
  | { action: "clear" }
  | { action: "set"; round: number; image: number };

// The admin board drives the game: reset, clear teams, or set round/image.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Action;
    const db = redis();

    if (body.action === "reset") {
      await db.del(KEYS.game);
    } else if (body.action === "clear") {
      const roundKeys = clues.flatMap((_, r) => [
        KEYS.guesses(r),
        KEYS.playerGuesses(r),
        KEYS.correct(r),
      ]);
      await db.del(KEYS.game, KEYS.players, ...roundKeys);
    } else if (body.action === "set") {
      const { round, image } = body;
      if (!Number.isInteger(round) || round < 0 || round >= clues.length) {
        return errorResponse("Invalid round.", 400);
      }
      await db.hset(KEYS.game, { round, image, points: pointsForImage(image) });
    } else {
      return errorResponse("Unknown action.", 400);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
