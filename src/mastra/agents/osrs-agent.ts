import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

import { fastembed } from "@mastra/fastembed";

import { searchTool } from "../tools/search-tool";
import { readPageTool } from "../tools/read-page-tool";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { getPlayerLevelsTool } from "../tools/get-player-levels-tool";
import { getPlayerQuestsTool } from "../tools/get-player-quests-tool";

const memory = new Memory({
  embedder: fastembed,
  storage: new LibSQLStore({
    url: "file:../../local.db",
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:../../local.db",
  }),
  options: {
    // Keep last 20 messages in context
    lastMessages: 20,
    workingMemory: {
      enabled: true,
      template: `<user>
          <first_name></first_name>
          <osrs_username></osrs_username>
          <osrs_goals></osrs_goals>
          <osrs_interests></osrs_interests>
        </user>`,
      scope: "resource",
    },
    // Enable semantic search to find relevant past conversations
    semanticRecall: {
      topK: 3,
      messageRange: 2,
      scope: "resource",
    },
  },
});

export const osrsAgent = new Agent({
  name: "OSRS Assistant",
  instructions: `You are a helpful personal assistant that can help with various questions related to old school runescape.`,
  model: google("gemini-2.5-flash"),
  tools: {
    searchTool,
    readPageTool,
    getPlayerLevelsTool,
    getPlayerQuestsTool,
  },
  memory,
});
