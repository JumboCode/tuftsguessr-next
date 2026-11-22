"use client";

import { Button } from "@/components/button";
import { Field, Label } from "@/components/fieldset";
import { Input } from "@/components/input";
import usePlayerId from "@/hooks/usePlayerId";
import { postJson } from "@/hooks/usePoll";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const playerId = usePlayerId();

  return (
    <div className="p-6">
      <div className="flex items-center gap-x-4">
        <img src="/logo.png" alt="" className="h-16" />
        <p className="text-2xl font-bold text-gray-950">Tuftsguessr</p>
      </div>
      <form
        className="mt-8 max-w-xs space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!playerId || submitting) return;

          setSubmitting(true);
          setError(null);
          try {
            await postJson("/api/players", { id: playerId, name });
            router.push("/guess");
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setSubmitting(false);
          }
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
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" color="teal" disabled={!playerId || submitting}>
          Start
        </Button>
      </form>
    </div>
  );
}
