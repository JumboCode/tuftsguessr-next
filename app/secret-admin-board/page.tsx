"use client";

import { Button } from "@/components/button";
import db, { SINGLETON_ID } from "@/lib/db";
import { useEffect } from "react";

export default function StartBoard() {
  const { data } = db.useQuery({
    gameState: {
      $: {
        where: {
          id: SINGLETON_ID,
        },
      },
    },
    players: {},
  });

  // Reset game state when page loads
  useEffect(() => {
    if (!data) return;

    db.transact(
      db.tx.gameState[SINGLETON_ID].update({
        round: null,
        image: null,
        points: null,
      })
    );
  }, [data]);

  if (!data) {
    return <div className="p-4">Loading...</div>;
  }

  const gameState = data.gameState[0];
  if (!gameState) {
    return <div className="p-4">Game state not found</div>;
  }

  const sortedPlayers = [...(data.players || [])].sort(
    (a, b) => b.points - a.points
  );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-8">
        <Button href="/secret-admin-board/0" color="teal">
          Start Game
        </Button>

        <div className="w-full">
          <div className="space-y-1">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
              >
                <span className="font-medium">{player.name}</span>
                <span className="tabular-nums">{player.points} points</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
