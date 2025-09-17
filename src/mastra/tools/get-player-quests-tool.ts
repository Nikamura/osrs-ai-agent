import { createTool } from "@mastra/core";
import z from "zod";

export const getPlayerQuestsTool = createTool({
  id: "get-player-quests",
  description: "Reads player's quests quests and exp from highscores.",
  inputSchema: z.object({
    name: z.string(),
  }),
  outputSchema: z.object({
    quests: z.record(z.string(), z.number().int()),
  }),
  execute: async ({ context }) => {
    const resp = await fetch(
      `https://sync.runescape.wiki/runelite/player/${context.name}/STANDARD`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "en-US,en;q=0.5",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
        },
        referrer: "https://oldschool.runescape.wiki/",
        method: "GET",
        mode: "cors",
      }
    );
    const data = await resp.json();
    return {
      quests: z.record(z.string(), z.number().int()).parse(data.quests),
    };
  },
});
