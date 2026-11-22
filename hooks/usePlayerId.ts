import { useState, useEffect } from "react";

const PLAYER_ID_KEY = "tuftsguessr_player_id";

export default function usePlayerId() {
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(PLAYER_ID_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(PLAYER_ID_KEY, id);
      }
    } catch {
      // Private browsing can block storage; fall back to a per-tab ID.
      id = id ?? crypto.randomUUID();
    }
    setPlayerId(id);
  }, []);

  return playerId;
}
