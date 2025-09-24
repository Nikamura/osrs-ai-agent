## OSRS Wiki Agent

This project provides a Telegram-ready assistant for Old School RuneScape using the OSRS Wiki.

### Tools

- search-osrs-wiki: Search main OSRS Wiki articles.
- search-osrs-wiki-guides: Search Supplemental Guides in the `Guide:` namespace.
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

### Development

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`


