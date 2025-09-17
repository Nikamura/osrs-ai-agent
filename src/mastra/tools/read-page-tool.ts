import { createTool } from "@mastra/core";
import z from "zod";
import { bot } from "../integrations/osrs-wiki";
import html2md from "html-to-md";
// import { writeFileSync } from "node:fs";

export const readPageTool = createTool({
  id: "read-page",
  description: "Read a page from the OSRS Wiki",
  inputSchema: z.object({
    pageid: z.number(),
  }),
  outputSchema: z.object({
    content: z.string(),
  }),
  execute: async ({ context }) => {
    const result = await bot.read(context.pageid);
    if (result.revisions && result.revisions[0]?.content) {
      const lastRevision = result.revisions[0];
      if (lastRevision.content) {
        let content = lastRevision.content;
        content = content.split("==References==")[0];
        content = content.replace(/\{\{CiteForum.*?\}\}/g, "");

        const html = await bot.parseWikitext(content);
        // writeFileSync(`${result.pageid}.html`, html, "utf-8");
        let md = html2md(html);
        // remove links [Tradeable](/w/Items#Tradeability "Items") leave only Tradeable text
        // md = md.replace(
        //   /\[\s*!\[([^\]]+)\]\((?:[^)(]|\([^)]*\))+?\)\s*\]\((?:[^)(]|\([^)]*\))+?\)|\[(?!\s*!\[)([^\]]+)\]\((?:[^)(]|\([^)]*\))+?\)|\[\s*!\[\s*\]\((?:[^)(]|\([^)]*\))+?\)\s*\]\((?:[^)(]|\([^)]*\))+?\)/g,
        //   "$1$2"
        // );
        // writeFileSync(`${result.pageid}.md`, md, "utf-8");
        return {
          content: md,
        };
      }
    }
    throw new Error("No content found");
  },
});
