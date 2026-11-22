"use client";

import { Button } from "@/components/button";
import usePoll, { postJson } from "@/hooks/usePoll";
import buildings from "@/lib/buildings";
import clues from "@/lib/clues";
import {
  FINAL_IMAGE,
  SECONDS_PER_IMAGE,
  pointsForImage,
  type AdminView,
} from "@/lib/game";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export default function Board() {
  const { round } = useParams<{ round: string }>();
  const roundNum = parseInt(round);
  const clue = clues[roundNum];

  // The admin browser owns the timer and pushes each image change to the server.
  const [image, setImage] = useState(0);
  const [seconds, setSeconds] = useState(SECONDS_PER_IMAGE);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { data, error } = usePoll<AdminView>(
    `/api/admin/state?round=${roundNum}`,
    1000
  );

  useEffect(() => {
    if (!clue) return;
    let currentImage = 0;
    let remaining = SECONDS_PER_IMAGE;

    const push = (img: number) =>
      postJson("/api/admin/state", { action: "set", round: roundNum, image: img })
        .then(() => setSyncError(null))
        .catch((err) =>
          setSyncError(err instanceof Error ? err.message : String(err))
        );

    setImage(0);
    setSeconds(SECONDS_PER_IMAGE);
    push(0);

    const timer = window.setInterval(() => {
      if (currentImage >= FINAL_IMAGE) return;
      remaining -= 1;
      if (remaining <= 0) {
        currentImage += 1;
        remaining = SECONDS_PER_IMAGE;
        setImage(currentImage);
        push(currentImage);
      }
      setSeconds(remaining);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [roundNum, clue]);

  // Play a sound whenever a new correct guess comes in.
  const lastCorrect = useRef<number | null>(null);
  const correctCount = data?.correctCount;
  useEffect(() => {
    if (correctCount === undefined) return;
    if (lastCorrect.current !== null && correctCount > lastCorrect.current) {
      new Audio("/correct.mp3").play().catch(() => {});
    }
    lastCorrect.current = correctCount;
  }, [correctCount]);
  useEffect(() => {
    lastCorrect.current = null;
  }, [roundNum]);

  if (!clue) {
    return <div className="p-4">Round {round} doesn’t exist.</div>;
  }

  const imageUrl = `/photos/${clue.slug}_${Math.min(image + 1, 4)}.jpg`;
  const building = buildings.find((b) => b.building_id === clue.building_id);
  const buildingName = building?.name || "";

  const players = data?.players ?? [];
  const guesses = data?.guesses ?? [];
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  const correctPlayers = new Set(
    guesses
      .filter((guess) => guess.buildingId === clue.building_id)
      .map((guess) => guess.playerName)
  );
  const shownError = syncError ?? error;

  return (
    <div className="grid grid-cols-[auto_minmax(400px,1fr)] h-screen items-center">
      <div className="relative">
        <img src={imageUrl} alt="" className="max-h-screen object-contain" />
        {image === FINAL_IMAGE && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <p className="text-6xl font-bold text-gray-950">{buildingName}</p>
          </div>
        )}
      </div>
      <div className="p-4 h-full flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-end">
            <p className="font-medium text-lg text-gray-700">
              Round {roundNum + 1} of {clues.length}
            </p>
            {roundNum + 1 < clues.length ? (
              <Button href={`/secret-admin-board/${roundNum + 1}`} plain>
                Next
              </Button>
            ) : (
              <Button href="/secret-admin-board" plain>
                Final scores
              </Button>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-950">
            {image >= FINAL_IMAGE
              ? "0:00"
              : `0:${seconds.toString().padStart(2, "0")}`}
          </p>
          <p className="text-3xl font-bold text-gray-950 tabular-nums">
            {pointsForImage(image)} points
          </p>
          {shownError && (
            <p className="mt-2 text-sm text-red-700">{shownError}</p>
          )}
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
              {guesses.map((guess) => (
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
