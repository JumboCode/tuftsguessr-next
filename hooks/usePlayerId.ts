import { id } from "@instantdb/react";
import { useState, useEffect } from "react";

const PLAYER_ID_KEY = "tuftsguessr_player_id";

export default function usePlayerId() {
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem(PLAYER_ID_KEY);
      if (storedId) {
        setPlayerId(storedId);
      } else {
        const newId = id();
        localStorage.setItem(PLAYER_ID_KEY, newId);
        setPlayerId(newId);
      }
    }
  }, []);

  return playerId;
}
