import { createTool } from "@mastra/core";
import z from "zod";
import { bot } from "../integrations/osrs-wiki";

const PagesType = z.array(
  z.object({
    title: z.string(),
    pageid: z.number(),
    size: z.number(),
    wordcount: z.number(),
    timestamp: z.string(),
  })
);

export const searchGuidesTool = createTool({
  id: "search-osrs-wiki-guides",
  description:
    "Search the OSRS Wiki Supplemental Guides (Guide namespace) for a given query",
  inputSchema: z.object({
    query: z.string().describe("The query to search for within Guide pages"),
    max: z
      .number()
      .default(10)
      .describe("The maximum number of pages to return"),
  }),
  outputSchema: z.object({
    pages: PagesType,
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info(
      `[search-osrs-wiki-guides] Searching supplemental guides for query: "${context.query}" with max results: ${
        context.max ?? 10
      }`
    );

    // Ensure namespace mappings are loaded so we can get the numeric id for "Guide"
    // If it fails, fall back to the known Guide namespace id 3002.
    let guideNsId: number | undefined;
    try {
      await bot.getSiteInfo();
      const resolved = (bot.Title as any).nameIdMap?.["Guide"];
      if (typeof resolved === "number") guideNsId = resolved;
    } catch (e) {
      // Ignore and use fallback
    }
    if (typeof guideNsId !== "number") {
      guideNsId = 3002; // Guide namespace id on OSRS Wiki
      logger?.warn(
        `[search-osrs-wiki-guides] Falling back to hardcoded Guide namespace id ${guideNsId}`
      );
    }

    const result = await bot.search(
      context.query,
      context.max ?? 10,
      undefined,
      { srnamespace: guideNsId }
    );

    return { pages: PagesType.parse(result) };
  },
});
