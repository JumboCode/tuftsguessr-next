import { init } from "@instantdb/react";

// NEXT_PUBLIC_* values are inlined at build time. If you add or change this
// variable in Vercel, you must redeploy for the change to take effect.
export const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "";

if (!INSTANT_APP_ID && typeof window !== "undefined") {
  console.error(
    "NEXT_PUBLIC_INSTANT_APP_ID is not set. Add it to your environment and rebuild."
  );
}

const db = init({ appId: INSTANT_APP_ID });

export default db;

export const SINGLETON_ID = "00000000-0000-0000-0000-000000000000";
