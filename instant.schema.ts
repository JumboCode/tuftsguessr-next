// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.any(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    players: i.entity({
      name: i.string(),
      points: i.number(),
    }),
    gameState: i.entity({
      round: i.number(),
      image: i.number(),
      points: i.number(),
      delaySeconds: i.number(),
    }),
    guesses: i.entity({
      round: i.number(),
      playerName: i.string(),
      buildingId: i.number(),
    }),
  },
  links: {},
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
