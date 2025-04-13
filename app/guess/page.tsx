"use client";

import { Button } from "@/components/button";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Input, InputGroup } from "@/components/input";
import usePlayerId from "@/hooks/usePlayerId";
import db from "@/lib/db";
import buildings from "@/lib/buildings";
import { useState } from "react";

export default function Guess() {
  const playerId = usePlayerId();

  const [buildingQuery, setBuildingQuery] = useState("");

  const { data } = db.useQuery(
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

  if (!data) {
    return null;
  }

  const player = data.players[0];

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
              Round 1 of 5
            </div>
            <div className="text-xs bg-gray-100 border border-gray-200 rounded-full w-max px-2 text-gray-600">
              2 guesses left
            </div>
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
            {filteredBuildings.map((building) => (
              <div key={building.building_id} className="contents group">
                <span className="text-right tabular-nums text-gray-400 text-sm font-medium">
                  {building.building_id}
                </span>
                <span className="font-medium group-has-[button:hover]:bg-amber-100 max-w-max">
                  {building.name}
                </span>
                <Button plain>Guess</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
