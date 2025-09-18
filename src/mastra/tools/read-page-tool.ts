import { createTool } from "@mastra/core";
import z from "zod";
import { bot } from "../integrations/osrs-wiki";
import html2md from "html-to-md";

export const readPageTool = createTool({
  id: "read-page",
  description:
    "Fetch and return the HTML content of a OSRS wiki page for the agent to analyze.",
  inputSchema: z.object({
    pageid: z.number(),
  }),
  outputSchema: z.object({
    md: z.string().describe("HTML of the page converted to MD"),
    title: z.string().describe("Title of the page"),
    pageid: z.number().describe("Page ID of the page"),
    url: z.string().describe("URL of the page on OSRS Wiki"),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info(`[read-page] Reading page with ID: ${context.pageid}`);
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
        // // remove links [Tradeable](/w/Items#Tradeability "Items") leave only Tradeable text
        // md = md.replace(
        //   /\[\s*!\[([^\]]+)\]\((?:[^)(]|\([^)]*\))+?\)\s*\]\((?:[^)(]|\([^)]*\))+?\)|\[(?!\s*!\[)([^\]]+)\]\((?:[^)(]|\([^)]*\))+?\)|\[\s*!\[\s*\]\((?:[^)(]|\([^)]*\))+?\)\s*\]\((?:[^)(]|\([^)]*\))+?\)/g,
        //   "$1$2"
        // );
        // writeFileSync(
        //   path.join(process.cwd(), `${result.pageid}.md`),
        //   md,
        //   "utf-8"
        // );
        const url = `https://oldschool.runescape.wiki/w/${encodeURIComponent(result.title.replace(/\s+/g, "_"))}`;
        return {
          title: result.title,
          md: md,
          pageid: result.pageid,
          url: url,
        };
      }
    }
    throw new Error("No content found");
  },
});
