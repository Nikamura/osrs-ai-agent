import TelegramBot from "node-telegram-bot-api";
import { osrsAgent } from "../agents/osrs-agent";
import telegramifyMarkdown from "telegramify-markdown";

export class TelegramIntegration {
  private bot: TelegramBot;
  private readonly MAX_MESSAGE_LENGTH = 4096; // Telegram's message length limit
  private readonly MAX_RESULT_LENGTH = 500; // Maximum length for tool results

  constructor(token: string) {
    // Create a bot instance
    this.bot = new TelegramBot(token, { polling: true });

    // Handle incoming messages
    this.bot.on("message", this.handleMessage.bind(this));
  }

  private escapeMarkdown(text: string): string {
    return telegramifyMarkdown(text, "remove");
    // Escape special Markdown characters
    // return text.replace(/(?<!\\)[_[\]()~`>#+=|{}.!-]/g, "\\$&");
  }

  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "... [truncated]";
  }

  private async updateOrSplitMessage(
    chatId: number,
    messageId: number | undefined,
    text: string
  ): Promise<number> {
    // If text is within limits, try to update existing message
    if (text.length <= this.MAX_MESSAGE_LENGTH && messageId) {
      try {
        await this.bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
        });
        return messageId;
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes(
              "message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message"
            )
          ) {
            return messageId;
          }
        }
        if (error instanceof Error) {
          console.error("Error updating message:", error.message);
        }
      }
    }

    // If text is too long or update failed, send as new message
    try {
      const newMessage = await this.bot.sendMessage(chatId, text, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      });
      return newMessage.message_id;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sending message:", error.message);
      }
      // If the message is still too long, truncate it
      const truncated =
        text.substring(0, this.MAX_MESSAGE_LENGTH - 100) +
        "\n\n... [Message truncated due to length]";
      const fallbackMsg = await this.bot.sendMessage(chatId, truncated, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      });
      return fallbackMsg.message_id;
    }
  }

  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from?.username || "unknown";
    const firstName = msg.from?.first_name || "unknown";
    const userId = msg.from?.id.toString() || `anonymous-${chatId}`;
    const threadId = `telegram-${chatId}`;
    const resourceId = userId;

    if (!text) {
      // await this.bot.sendMessage(
      //   chatId,
      //   "Sorry, I can only process text messages."
      // );
      return;
    }

    if (
      msg.chat.type !== "private" &&
      !msg.text?.includes("@rosetta_stone_bot") &&
      !msg.text?.includes("@osrs_ai_bot")
    ) {
      return;
    }

    console.log(
      `Handling message from ${firstName} (${username}) #${userId}: ${text}`
    );

    try {
      // Send initial message
      const sentMessage = await this.bot.sendMessage(chatId, "Thinking...");
      let currentMessageId = sentMessage.message_id;

      // Stream response using the agent
      const generate = await osrsAgent.generateVNext(text, {
        threadId, // Use chat ID as thread ID
        resourceId, // Use user ID as resource ID
        context: [
          {
            role: "system",
            content: `
            <current_user>
            <first_name>${firstName}</first_name>
            <telegram_username>${username}</telegram_username>
            </current_user>`,
          },
        ],
        runtimeContext: <any>{
          group_chat: msg.chat.type === "group",
          is_admin: false,
        },
      });

      // Final update
      await this.updateOrSplitMessage(
        chatId,
        currentMessageId,
        this.escapeMarkdown(generate.text)
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error processing message:", error.message);
      }

      await this.bot.sendMessage(
        chatId,
        "Sorry, I encountered an error processing your message. Please try again."
      );
    }
  }
}
