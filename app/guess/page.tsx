"use client";

import { Button } from "@/components/button";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Input, InputGroup } from "@/components/input";
import usePlayerId from "@/hooks/usePlayerId";
import db, { SINGLETON_ID } from "@/lib/db";
import buildings from "@/lib/buildings";
import clues from "@/lib/clues";
import { useState } from "react";
import { clsx } from "clsx";
import { id } from "@instantdb/react";

interface Guess {
  id: string;
  round: number;
  playerName: string;
  buildingId: number;
}

export default function Guess() {
  const playerId = usePlayerId();
  const [buildingQuery, setBuildingQuery] = useState("");

  const { data: playerData } = db.useQuery(
    playerId
      ? {
          players: {
            $: {
              where: {
                id: playerId,
              },
            },
          },
        }
      : null
  );

  const { data: gameData } = db.useQuery({
    gameState: {
      $: {
        where: {
          id: SINGLETON_ID,
        },
      },
    },
  });

  const { data: guessData } = db.useQuery(
    playerData?.players[0]?.name && gameData?.gameState[0]?.round !== null
      ? {
          guesses: {
            $: {
              where: {
                playerName: playerData.players[0].name,
                round: gameData.gameState[0].round,
              },
            },
          },
        }
      : null
  );

  if (!playerData || !gameData) {
    return null;
  }

  const player = playerData.players[0];
  const gameState = gameData.gameState[0];
  const guesses = guessData?.guesses || [];
  const guessesLeft = gameState.round === null ? 0 : 2 - guesses.length;
  const currentClue = gameState.round === null ? null : clues[gameState.round];

  const handleGuess = (buildingId: number) => {
    if (guessesLeft <= 0 || !playerId || gameState.round === null) return;

    const isCorrect = buildingId === currentClue?.building_id;
    const newPoints = isCorrect
      ? (player.points || 0) + gameState.points
      : player.points || 0;

    db.transact([
      db.tx.guesses[id()].update({
        round: gameState.round,
        playerName: player.name,
        buildingId,
      }),
      db.tx.players[playerId].update({
        points: newPoints,
      }),
    ]);
  };

  const filteredBuildings = buildings.filter((building) =>
    building.name.toLowerCase().includes(buildingQuery.toLowerCase())
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

          <div className="-mt-1 px-4 pb-8 grid grid-cols-[max-content_1fr_max-content] items-baseline gap-x-4">
            {filteredBuildings.map((building) => {
              const guess = guesses.find(
                (g) => g.buildingId === building.building_id
              );
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
                      guessesLeft <= 0 || !!guess || gameState.round === null
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
