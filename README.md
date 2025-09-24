## OSRS Wiki Agent

This project provides a Telegram-ready assistant for Old School RuneScape using the OSRS Wiki.

### Tools

- search-osrs-wiki: Search main OSRS Wiki articles.
- search-osrs-wiki-guides: Search Supplemental Guides in the `Guide:` namespace. Returns `snippet` in results.
- read-page: Fetch and convert a wiki page to Markdown.
- get-player-levels, get-player-quests: Fetch player info.

### New: Searching Supplemental Guides

The OSRS Wiki hosts community-written supplemental guides in the Guide namespace. See the wiki announcement at [RuneScape:Supplemental guides](https://oldschool.runescape.wiki/w/RuneScape:Supplemental_guides).

We added a new tool `search-osrs-wiki-guides` to query only that namespace.

Example tool invocation (pseudo):

```ts
await tools.searchGuidesTool.call({ query: "UIM herblore", max: 5 })
```

This returns pages from the `Guide:` namespace, such as "Guide:UIM Herblore training".

Guide search also returns a `snippet?: string` with highlighted HTML similar to on-wiki search.

### Update: `search-osrs-wiki` now returns snippets

The `search-osrs-wiki` tool now includes a short HTML snippet for each result, mirroring on-wiki search excerpts.

- **Output shape**: Each item in `pages` now has a `snippet?: string` field in addition to `title`, `pageid`, `size`, `wordcount`, and `timestamp`.
- **Notes**: The snippet may contain HTML with `<span class="searchmatch">` highlights.

Example (pseudo):

```ts
const { pages } = await tools.searchTool.call({ query: "ahrim's staff", max: 5 });
for (const p of pages) {
  console.log(p.title, p.snippet);
}
```

### Development

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`


