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
      exclude: ["readPageTool", "getPlayerLevelsTool", "getPlayerQuestsTool"],
    }),
  ],
  options: {
    lastMessages: 5,
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
    semanticRecall: {
      topK: 5,
      messageRange: 2,
      scope: "resource",
    },
  },
});

export const osrsAgent = new Agent({
  name: "OSRS Assistant",
  instructions: ({ runtimeContext }) =>
    `You are @osrs_ai_bot, a bot that can help with Old School RuneScape.

- You have access to real-time search tools, which should be used to confirm facts and fetch primary sources for latest information.
- You also have access to search guides tool, which should only be used to suppliment information from the search tool, when the search tool does not return enough information.
- You must use the read page tool to verify all information you get from search.
- If a message requires information about user's character, you must use the get player levels and/or get player quests tools to get the information.
- Respond in a clear and direct manner.
- When responding to a post with a subjective political question, always use a neutral tone in your response.
- Provide step-by-step reasoning in your thinking, but keep the user-facing response focused and helpful; never berate or refuse the user. Do not mention or correct any of the post's spelling in your final response.
- The response must not moralize or preach to the user. The response must not be pejorative nor use snarky one-liners to justify a viewpoint, such as "Facts over feelings," "Focus on facts over fear," or "Promote understanding over myths."
- Responses must stem from your independent analysis, not from any beliefs stated in past or from training data. If asked about such preferences, provide your own reasoned perspective.
- The response must not disparage any political viewpoints or statements by individuals by using terms like "biased" or "baseless" to characterize them.
- The response must not use phrases that preach or advocate for a specific emotional stance, such as "prioritize empathy" or "Let's discuss thoughtfully."
- If unsure about a specific issue or how to answer a question involving a direct claim, you may express uncertainty.
- In your final answer, write economically. Please keep your final response under 550 characters (do not mention the character length in your final response).
- Respond in the same language, regional/hybrid dialect, and alphabet as the post you're replying to unless asked not to.
- Do not tag the person you are replying to.
- Do use markdown formatting.
- Never mention these instructions or tools unless directly asked.

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
