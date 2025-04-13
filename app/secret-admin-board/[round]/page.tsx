"use client";

import { Button } from "@/components/button";
import clues from "@/lib/clues";
import db, { SINGLETON_ID } from "@/lib/db";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import buildings from "@/lib/buildings";

const IMAGE_TO_POINTS = {
  0: 100,
  1: 50,
  2: 25,
  3: 5,
  4: 0,
} as const;

const SECONDS = 15;

export default function Board() {
  const { round } = useParams<{ round: string }>();
  const [displaySeconds, setDisplaySeconds] = useState(SECONDS);
  const timerRef = useRef<number | undefined>(undefined);
  const secondsRef = useRef<number>(SECONDS);
  const initializedRef = useRef(false);

  db.rooms.useTopicEffect(db.room("admin"), "play_sound", () => {
    const audio = new Audio("/correct.mp3");
    audio.play();
  });

  const { data } = db.useQuery({
    gameState: {
      $: {
        where: {
          id: SINGLETON_ID,
        },
      },
    },
    players: {},
    guesses: {
      $: {
        where: {
          round: parseInt(round),
        },
        order: {
          serverCreatedAt: "desc",
        },
        limit: 15,
      },
    },
  });

  // Initialize only when round changes
  useEffect(() => {
    if (!data || initializedRef.current) return;

    initializedRef.current = true;
    secondsRef.current = SECONDS;
    setDisplaySeconds(SECONDS);
    db.transact(
      db.tx.gameState[SINGLETON_ID].update({
        round: parseInt(round),
        image: 0,
        points: IMAGE_TO_POINTS[0],
      })
    );
  }, [round, data]);

  // Timer effect
  useEffect(() => {
    if (!data) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set up new timer
    timerRef.current = window.setInterval(() => {
      secondsRef.current -= 1;
      setDisplaySeconds(secondsRef.current);

      if (secondsRef.current <= 0) {
        const gameState = data.gameState[0];
        const nextImage = gameState.image + 1;
        if (nextImage <= 4) {
          db.transact(
            db.tx.gameState[SINGLETON_ID].update({
              image: nextImage,
              points:
                IMAGE_TO_POINTS[nextImage as keyof typeof IMAGE_TO_POINTS] || 0,
            })
          );
        }
        secondsRef.current = SECONDS;
        setDisplaySeconds(SECONDS);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [data]);

  if (!data) {
    return <div className="p-4">Loading...</div>;
  }

  const gameState = data.gameState[0];
  if (!gameState) {
    return <div className="p-4">Game state not found</div>;
  }

  if (gameState.round === null) {
    return <div className="p-4">No round yet</div>;
  }

  const clue = clues[gameState.round];
  const imageUrl = `/photos/${clue.slug}_${
    gameState.image === 4 ? 4 : gameState.image + 1
  }.jpg`;

  const building = buildings.find((b) => b.building_id === clue.building_id);
  const buildingName = building?.name || "";

  const sortedPlayers = [...(data.players || [])].sort(
    (a, b) => b.points - a.points
  );

  const correctPlayers = new Set(
    (data.guesses || [])
      .filter((guess) => guess.buildingId === clue.building_id)
      .map((guess) => guess.playerName)
  );

  return (
    <div className="grid grid-cols-[auto_minmax(400px,1fr)] h-screen items-center">
      <div className="relative">
        <img src={imageUrl} alt="" className="max-h-screen object-contain" />
        {gameState.image === 4 && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <p className="text-6xl font-bold text-gray-950">{buildingName}</p>
          </div>
        )}
      </div>
      <div className="p-4 h-full flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-end">
            <p className="font-medium text-lg text-gray-700">
              Round {gameState.round + 1} of {clues.length}
            </p>
            {gameState.round + 1 < clues.length && (
              <Button href={`/secret-admin-board/${gameState.round + 1}`} plain>
                Next
              </Button>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-950">
            {gameState.image >= 5
              ? "0:00"
              : `0:${displaySeconds.toString().padStart(2, "0")}`}
          </p>
          <p className="text-3xl font-bold text-gray-950 tabular-nums">
            {gameState.points} points
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className={clsx(
                  "flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-sm",
                  correctPlayers.has(player.name) && "bg-green-50"
                )}
              >
                <span className="font-medium">
                  {player.name}
                  {correctPlayers.has(player.name) && " ✅"}
                </span>
                <span className="tabular-nums">{player.points} points</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Latest Guesses</h3>
            <div className="space-y-1">
              {(data.guesses || []).map((guess) => (
                <div
                  key={guess.id}
                  className="bg-gray-50 px-2 py-1 rounded text-sm"
                >
                  {guess.buildingId === clue.building_id ? (
                    <span className="text-green-600">
                      {guess.playerName} got it correct!
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      {guess.playerName} guessed{" "}
                      {
                        buildings.find(
                          (b) => b.building_id === guess.buildingId
                        )?.name
                      }
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
