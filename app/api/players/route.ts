import { errorResponse, KEYS, redis } from "@/lib/store";

export const dynamic = "force-dynamic";

// Register (or rename) a team. Joining resets the team's points to 0.
export async function POST(request: Request) {
  try {
    const { id, name } = (await request.json()) as { id?: string; name?: string };
    const trimmed = name?.trim().slice(0, 60);
    if (!id || !trimmed) {
      return errorResponse("A player id and team name are required.", 400);
    }

    await redis().hset(KEYS.players, {
      [`${id}:name`]: trimmed,
      [`${id}:points`]: 0,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
