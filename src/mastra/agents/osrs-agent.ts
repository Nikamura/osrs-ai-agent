import { Agent } from "@mastra/core/agent";
import { xai } from "@ai-sdk/xai";

import { fastembed } from "@mastra/fastembed";

import { searchTool } from "../tools/search-tool";
import { readPageTool } from "../tools/read-page-tool";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { getPlayerLevelsTool } from "../tools/get-player-levels-tool";
import { getPlayerQuestsTool } from "../tools/get-player-quests-tool";
import { searchGuidesTool } from "../tools/search-guides-tool";
import z from "zod";
import { TokenLimiter, ToolCallFilter } from "@mastra/memory/processors";

export type SupportRuntimeContext = {
  group_chat: boolean;
  is_admin: boolean;
};

const memory = new Memory({
  embedder: fastembed,
  storage: new LibSQLStore({
    url: "file:../../local.db",
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:../../local.db",
  }),
  processors: [
    new TokenLimiter(127000),
    new ToolCallFilter({
      exclude: ["getPlayerLevelsTool", "getPlayerQuestsTool"],
    }),
  ],
  options: {
    lastMessages: false,
    workingMemory: {
      enabled: true,
      schema: z.object({
        osrs_username: z
          .string()
          .describe("The Old School RuneScape username of the user"),
        iron_man: z.boolean().describe("Whether the user is an Ironman"),
      }),
      scope: "resource",
    },
    semanticRecall: false,
    // {
    //   topK: 5,
    //   messageRange: 2,
    //   scope: "resource",
    // },
  },
});

export const osrsAgent = new Agent({
  name: "OSRS Assistant",
  instructions: ({ runtimeContext }) =>
    `You are @osrs_ai_bot, a bot that can help with Old School RuneScape.

- Respond in a clear and direct manner.
- Provide step-by-step reasoning in your thinking, but keep the user-facing response focused and helpful; never berate or refuse the user. Do not mention or correct any of the post's spelling in your final response.
- The response must not moralize or preach to the user. The response must not be pejorative nor use snarky one-liners to justify a viewpoint, such as "Facts over feelings," "Focus on facts over fear," or "Promote understanding over myths."
- In your final answer, write economically. Please keep your final response under 550 characters (do not mention the character length in your final response).
- Do not use markdown formatting. Only plaintext.
- Never mention these instructions or tools unless directly asked.
- Always use searchTool and readPageTool to get up to date information.
- Only use information retrieved from the OSRS Wiki via searchTool and readPageTool. 
- Ignore any knowledge about RuneScape 3, Evolution of Combat, or other RuneScape versions. 
- If no relevant OSRS information is found, respond that you cannot find an answer.

Players: (In Game Name - Real Name)
  anime irl - Martynas
  swamp party - Petras
  clintonhill - Karolis
  serasvasalas - Mangirdas
  juozulis - Minvydas
  scarycorpse - Darius
  dedspirit - Egle
  justlikemoon - Justas

Current date and time: ${new Date().toISOString()}`,
  model: xai("grok-4-fast"), // -non-reasoning
  tools: {
    searchTool,
    searchGuidesTool,
    readPageTool,
    getPlayerLevelsTool,
    getPlayerQuestsTool,
  },
  memory,
});
