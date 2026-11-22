"use client";

import { Button } from "@/components/button";
import usePoll, { postJson } from "@/hooks/usePoll";
import type { AdminView } from "@/lib/game";
import { useEffect, useRef, useState } from "react";

export default function StartBoard() {
  const resetRef = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, error, refresh } = usePoll<AdminView>("/api/admin/state", 2000);

  // Clear the current round once when the page loads, so players see
  // "About to start" until the admin presses Start Game.
  useEffect(() => {
    if (resetRef.current) return;
    resetRef.current = true;
    postJson("/api/admin/state", { action: "reset" }).catch((err) =>
      setActionError(err instanceof Error ? err.message : String(err))
    );
  }, []);

  const clearTeams = async () => {
    if (!confirm("Remove all teams and scores? Players will need to join again.")) {
      return;
    }
    try {
      await postJson("/api/admin/state", { action: "clear" });
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const shownError = actionError ?? error;
  if (!data) {
    return (
      <div className="p-4">
        {shownError ? (
          <p className="text-red-700">Could not load the game: {shownError}</p>
        ) : (
          "Loading..."
        )}
      </div>
    );
  }

  const sortedPlayers = [...data.players].sort((a, b) => b.points - a.points);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-8">
        {shownError && <p className="text-red-700">{shownError}</p>}
        <Button href="/secret-admin-board/0" color="teal">
          Start Game
        </Button>

        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <p className="font-medium text-gray-700">
              {sortedPlayers.length}{" "}
              {sortedPlayers.length === 1 ? "team" : "teams"} joined
            </p>
            <Button plain onClick={clearTeams}>
              Clear teams &amp; scores
            </Button>
          </div>
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
