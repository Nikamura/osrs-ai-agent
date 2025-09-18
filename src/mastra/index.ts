import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { osrsAgent } from "./agents/osrs-agent";
import { TelegramIntegration } from "./integrations/telegram";

export const mastra = new Mastra({
  agents: { osrsAgent },
  storage: new LibSQLStore({
    url: "file:local.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});

// Initialize Telegram bot if token is available
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
  process.exit(1);
}

// Start the Telegram bot
export const telegramBot = new TelegramIntegration(TELEGRAM_BOT_TOKEN);
