import {
  clueForRound,
  errorResponse,
  KEYS,
  parseGuessList,
  readGame,
  redis,
} from "@/lib/store";
import { FINAL_IMAGE, MAX_GUESSES_PER_ROUND, type Guess } from "@/lib/game";

export const dynamic = "force-dynamic";

// The server decides whether a guess is correct and how many points it earns,
// so players can't award themselves points from the browser.
export async function POST(request: Request) {
  try {
    const { playerId, buildingId } = (await request.json()) as {
      playerId?: string;
      buildingId?: number;
    };
    if (!playerId || typeof buildingId !== "number") {
      return errorResponse("playerId and buildingId are required.", 400);
    }

    const game = await readGame();
    if (game.round === null || game.image === null || game.image >= FINAL_IMAGE) {
      return errorResponse("Guessing is closed for this round.", 409);
    }
    const round = game.round;
    const clue = clueForRound(round);
    if (!clue) return errorResponse("Unknown round.", 409);

    const db = redis();
    const [name, previous] = await Promise.all([
      db.hget(KEYS.players, `${playerId}:name`),
      db.hget(KEYS.playerGuesses(round), playerId),
    ]);
    if (name === null || name === undefined) {
      return errorResponse("Team not found. Join again from the home page.", 404);
    }

    const guessed = parseGuessList(previous);
    if (guessed.length >= MAX_GUESSES_PER_ROUND) {
      return errorResponse("No guesses left this round.", 409);
    }
    if (guessed.includes(buildingId)) {
      return errorResponse("You already guessed that building.", 409);
    }

    const correct = buildingId === clue.building_id;
    const guess: Guess = {
      id: crypto.randomUUID(),
      round,
      playerName: String(name),
      buildingId,
    };

    const tx = db.multi();
    tx.hset(KEYS.playerGuesses(round), {
      [playerId]: [...guessed, buildingId].join(","),
    });
    tx.lpush(KEYS.guesses(round), JSON.stringify(guess));
    tx.ltrim(KEYS.guesses(round), 0, 49);
    if (correct) {
      tx.hincrby(KEYS.players, `${playerId}:points`, game.points ?? 0);
      tx.incr(KEYS.correct(round));
    }
    await tx.exec();

    return Response.json({ correct });
  } catch (error) {
    return errorResponse(error);
  }
}
