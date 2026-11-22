"use client";

import { Button } from "@/components/button";
import db, { INSTANT_APP_ID, SINGLETON_ID } from "@/lib/db";
import { useEffect, useRef } from "react";

export default function StartBoard() {
  const resetRef = useRef(false);
  const { data, error } = db.useQuery({
    gameState: {
      $: {
        where: {
          id: SINGLETON_ID,
        },
      },
    },
    players: {},
  });

  // Reset game state once when the page loads. `update` also creates the
  // singleton record if it does not exist yet (for example, a new Instant app).
  useEffect(() => {
    if (!data || resetRef.current) return;
    resetRef.current = true;

    db.transact(
      db.tx.gameState[SINGLETON_ID].update({
        round: null,
        image: null,
        points: null,
      })
    );
  }, [data]);

  if (!INSTANT_APP_ID) {
    return (
      <div className="p-4 text-red-700">
        NEXT_PUBLIC_INSTANT_APP_ID is not set. Add it in Vercel (Project
        Settings → Environment Variables) and redeploy.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-700">
        Could not load the game from InstantDB: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="p-4">Loading...</div>;
  }

  const gameState = data.gameState[0];
  if (!gameState) {
    return <div className="p-4">Setting up game state...</div>;
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
