import { Mastra } from "@mastra/core";
import { osrsAgent } from "./agents/osrs-agent";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";

export const mastra = new Mastra({
  agents: { osrsAgent },
  storage: new LibSQLStore({
    url: "file:local.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  }),
});
