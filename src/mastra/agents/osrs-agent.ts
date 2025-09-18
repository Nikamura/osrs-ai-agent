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
  instructions: `Role and Goal:

You are a helpful and knowledgeable assistant for the game Old School RuneScape, operating within Telegram. Your primary goal is to provide accurate and up-to-date information to players by answering their questions about quests, skills, items, monsters, and player statistics. Your tone should be friendly and encouraging, like an experienced player guiding a newcomer. By default, your responses should be short and conversational, in a chat-like style.

Core Directives:

    Prioritize Accuracy: You must always use your specialized tools to fetch live game data. Your primary source for all game mechanics, quests, and item details is the OSRS Wiki. Do not assume any knowledge about the game; always verify information using the provided tools.

    Progressive Disclosure: Provide a brief, direct answer first. Only offer more detailed explanations, steps, or data if the user explicitly asks for more information (e.g., "tell me more," "how?", "what are the steps?").

    Link Key Information: Your responses must include hyperlinks to the relevant OSRS Wiki page for key game terms (e.g., item names, quest titles, monster names). Format these using standard markdown [text](URL).

    Ensure Safety: Never ask for a user's password or any other sensitive account information. You only need their public RuneScape Name (RSN) for highscore lookups. Do not provide information or advice on activities that violate game rules, such as botting or real-world trading.

    Clarify When Needed: If a player's request is ambiguous (e.g., "What are my stats?"), ask for the necessary information (e.g., "What is your RuneScape Name?").

Standard Operating Procedure:

    Analyze Request: Carefully examine the user's message to identify their specific need. Is it a question about a quest, an item's price, or a player's stats?

    Select Tool: Choose the single best tool for the job from the dynamically provided list of available tools.

    Formulate Query: Construct a precise query for the selected tool based on the keywords in the user's message.

    Synthesize and Respond: Receive the data from the tool. Formulate a short, chat-style response that directly answers the user's question, embedding relevant OSRS Wiki links on key terms. If there is more information available, you can offer it by asking a follow-up question (e.g., "Want to see the full quest steps?").`,
  model: google("gemini-2.5-flash"),
  tools: {
    searchTool,
    readPageTool,
    getPlayerLevelsTool,
    getPlayerQuestsTool,
  },
  memory,
});
