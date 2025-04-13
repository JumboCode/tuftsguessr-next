import { init } from "@instantdb/react";

const db = init({ appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID! });

export default db;

export const SINGLETON_ID = "00000000-0000-0000-0000-000000000000";
