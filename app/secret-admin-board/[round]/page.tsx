"use client";

import clues from "@/lib/clues";
import db, { SINGLETON_ID } from "@/lib/db";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const IMAGE_TO_POINTS = {
  0: 100,
  1: 50,
  2: 25,
  3: 5,
  4: 0,
} as const;

export default function Board() {
  const { round } = useParams<{ round: string }>();

  const { data } = db.useQuery({
    gameState: {
      $: {
        where: {
          id: SINGLETON_ID,
        },
      },
    },
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    db.transact(
      db.tx.gameState[SINGLETON_ID].update({
        round: parseInt(round),
        image: 0,
        points: IMAGE_TO_POINTS[0],
      })
    );
  }, [round, data]);

  if (!data) {
    return null;
  }

  const gameState = data.gameState[0];

  const clue = clues[gameState.round];
  const imageUrl = `/photos/${clue.slug}_${
    gameState.image === 4 ? 4 : gameState.image + 1
  }.jpg`;

  console.log(imageUrl);

  return (
    <div className="grid grid-cols-[auto_minmax(400px,1fr)] h-screen items-center">
      <img src={imageUrl} alt="" className="max-h-screen object-contain" />
      <div className="p-4">
        <div>
          <p className="font-medium text-lg text-gray-700">
            Round {gameState.round + 1} of {clues.length}
          </p>
          <p className="text-3xl font-bold text-gray-950">0:08</p>
        </div>
      </div>
    </div>
  );
}
