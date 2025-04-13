"use client";

import { Button } from "@/components/button";
import { Field, Label } from "@/components/fieldset";
import { Input } from "@/components/input";
import usePlayerId from "@/hooks/usePlayerId";
import db from "@/lib/db";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();

  const [name, setName] = useState("");
  const playerId = usePlayerId();

  return (
    <div className="p-6">
      <div className="flex items-center gap-x-4">
        <img src="/logo.png" alt="" className="h-16" />
        <p className="text-2xl font-bold text-gray-950">Tuftsguessr</p>
      </div>
      <form
        className="mt-8 max-w-xs space-y-4"
        onSubmit={(e) => {
          e.preventDefault();

          if (!playerId) {
            return;
          }

          db.transact(db.tx.players[playerId].update({ name, points: 0 }));

          router.push("/guess");
        }}
      >
        <Field>
          <Label>What’s your team’s name?</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" color="teal">
          Start
        </Button>
      </form>
    </div>
  );
}
