// Shared game constants and types used by both the pages and the API routes.

export const SECONDS_PER_IMAGE = 15;
export const FINAL_IMAGE = 4;
export const IMAGE_TO_POINTS = [100, 50, 25, 5, 0] as const;
export const MAX_GUESSES_PER_ROUND = 2;

export function pointsForImage(image: number) {
  return IMAGE_TO_POINTS[image] ?? 0;
}

export type GameState = {
  round: number | null;
  image: number | null;
  points: number | null;
};

export type Player = {
  id: string;
  name: string;
  points: number;
};

export type Guess = {
  id: string;
  round: number;
  playerName: string;
  buildingId: number;
};

// GET /api/state?playerId=...
export type PlayerView = {
  game: GameState;
  player: Player | null;
  myGuesses: number[];
};

// GET /api/admin/state?round=...
export type AdminView = {
  game: GameState;
  players: Player[];
  guesses: Guess[];
  correctCount: number;
};
