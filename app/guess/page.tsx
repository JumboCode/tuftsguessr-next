"use client";

import { Button } from "@/components/button";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Input, InputGroup } from "@/components/input";
import usePlayerId from "@/hooks/usePlayerId";
import usePoll, { postJson } from "@/hooks/usePoll";
import buildings from "@/lib/buildings";
import clues from "@/lib/clues";
import {
  FINAL_IMAGE,
  MAX_GUESSES_PER_ROUND,
  type PlayerView,
} from "@/lib/game";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";

const POLL_MS = 1500;

export default function Guess() {
  const playerId = usePlayerId();
  const [buildingQuery, setBuildingQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guessError, setGuessError] = useState<string | null>(null);

  const { data, error, refresh } = usePoll<PlayerView>(
    playerId ? `/api/state?playerId=${encodeURIComponent(playerId)}` : null,
    POLL_MS
  );

  if (!data) {
    return (
      <div className="p-4">
        {error ? (
          <p className="text-red-700">Could not load the game: {error}</p>
        ) : (
          "Loading..."
        )}
      </div>
    );
  }

  const { game: gameState, player, myGuesses: guesses } = data;

  if (!player) {
    return (
      <div className="p-4">
        <p>We couldn’t find your team.</p>
        <Link href="/" className="text-teal-700 underline">
          Join the game
        </Link>
      </div>
    );
  }

  const roundOpen =
    gameState.round !== null &&
    gameState.image !== null &&
    gameState.image < FINAL_IMAGE;
  const guessesLeft =
    gameState.round === null ? 0 : MAX_GUESSES_PER_ROUND - guesses.length;
  const currentClue = gameState.round === null ? null : clues[gameState.round];

  const handleGuess = async (buildingId: number) => {
    if (guessesLeft <= 0 || !playerId || !roundOpen || submitting) return;

    setSubmitting(true);
    setGuessError(null);
    try {
      await postJson("/api/guess", { playerId, buildingId });
    } catch (err) {
      setGuessError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      refresh();
    }
  };

  const filteredBuildings = buildings.filter((building) =>
    `${building.building_id} ${building.name}`
      .toLowerCase()
      .includes(buildingQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-[auto_minmax(400px,1fr)] h-screen items-center">
      <img
        src="/map.png"
        alt="Campus Map"
        className="max-h-screen object-contain"
      />
      <div className="grid grid-rows-[max-content_1fr] gap-2 h-full overflow-hidden">
        <div className="p-4 bg-white rounded-lg">
          <p className="font-semibold">Hello, {player.name}!</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <div className="text-xs bg-gray-100 border border-gray-200 rounded-full w-max px-2 text-gray-600">
              {gameState.round === null
                ? "About to start"
                : `Round ${gameState.round + 1} of ${clues.length}`}
            </div>
            {gameState.round !== null && (
              <div className="text-xs bg-gray-100 border border-gray-200 rounded-full w-max px-2 text-gray-600">
                {guessesLeft} {guessesLeft === 1 ? "guess" : "guesses"} left
              </div>
            )}
          </div>
          {(guessError || error) && (
            <p className="mt-2 text-sm text-red-700">{guessError ?? error}</p>
          )}
        </div>

        <div className="bg-white rounded-lg h-full overflow-scroll">
          <div className="p-4 pt-0 sticky top-0 z-10 bg-gradient-to-b from-white via-white via-70% to-transparent">
            <InputGroup>
              <MagnifyingGlassIcon />
              <Input
                type="search"
                placeholder="Search buildings..."
                value={buildingQuery}
                onChange={(e) => setBuildingQuery(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="-mt-1 px-4 pb-8 grid grid-cols-[max-content_1fr_max-content] items-center gap-x-4">
            {filteredBuildings.map((building) => {
              const guess = guesses.includes(building.building_id);
              const isCorrect =
                guess && building.building_id === currentClue?.building_id;
              const isIncorrect =
                guess && building.building_id !== currentClue?.building_id;

              return (
                <div key={building.building_id} className="contents group">
                  <span className="text-right tabular-nums text-gray-400 text-sm font-medium">
                    {building.building_id}
                  </span>
                  <span className="font-medium group-has-[button:hover]:bg-amber-100 max-w-max">
                    {building.name}
                  </span>
                  <Button
                    plain
                    onClick={() => handleGuess(building.building_id)}
                    disabled={
                      guessesLeft <= 0 || guess || !roundOpen || submitting
                    }
                    className={clsx({
                      "bg-green-500/15 text-green-700": isCorrect,
                      "bg-red-500/15 text-red-700": isIncorrect,
                    })}
                  >
                    {isCorrect
                      ? "Correct"
                      : isIncorrect
                      ? "Incorrect"
                      : "Guess"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
