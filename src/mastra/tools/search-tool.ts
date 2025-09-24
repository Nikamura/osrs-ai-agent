import { createTool } from "@mastra/core";
import { bot } from "../integrations/osrs-wiki";
import z from "zod";

const PagesType = z.array(
  z.object({
    title: z.string(),
    pageid: z.number(),
    size: z.number(),
    wordcount: z.number(),
    timestamp: z.string(),
    snippet: z.string().optional(),
  })
);

export const searchTool = createTool({
  id: "search-osrs-wiki",
  description: "Search the OSRS Wiki for a given query",
  inputSchema: z.object({
    query: z.string().describe("The query to search for on OSRS wiki"),
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
      `[search-osrs-wiki] Searching for query: "${context.query}" with max results: ${context.max ?? 10}`
    );
    // Request additional props to include snippets similar to on-wiki search
    const result = await bot.search(
      context.query,
      context.max ?? 10,
      [
        "size",
        "timestamp",
        "wordcount",
        "snippet",
        "titlesnippet",
        "sectionsnippet",
        "redirectsnippet",
      ],
      {
        // wrap in <span class="searchmatch"> like wiki does; we can keep raw HTML
        srprop: [
          "size",
          "timestamp",
          "wordcount",
          "snippet",
          "titlesnippet",
          "sectionsnippet",
          "redirectsnippet",
        ] as any,
      } as any
    );

    // Ensure compatibility with schema: pick `snippet` if provided
    const pagesWithSnippet = result.map((p: any) => ({
      ...p,
      snippet: p.snippet,
    }));
    return { pages: PagesType.parse(pagesWithSnippet) };
  },
});
