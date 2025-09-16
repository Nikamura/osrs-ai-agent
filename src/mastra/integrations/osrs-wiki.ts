import { Mwn } from "mwn";

export const bot = new Mwn({
  apiUrl: "https://oldschool.runescape.wiki/api.php",
  userAgent: "OSRS-Wiki-Crawler/1.0",
  defaultParams: {
    format: "json",
    formatversion: "2",
  },
});
