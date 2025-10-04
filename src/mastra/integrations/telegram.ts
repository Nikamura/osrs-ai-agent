import TelegramBot from "node-telegram-bot-api";
import { SupportRuntimeContext } from "../agents/osrs-agent";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { Mastra } from "@mastra/core";

export class TelegramIntegration {
  private bot: TelegramBot;
  private readonly MAX_MESSAGE_LENGTH = 4096; // Telegram's message length limit

  constructor(
    token: string,
    private readonly mastra: Mastra
  ) {
    // Create a bot instance
    this.bot = new TelegramBot(token, { polling: true });

    // Handle incoming messages
    this.bot.on("message", this.handleMessage.bind(this));
  }

  private escapeMarkdown(text: string): string {
    console.log("Escaping markdown:", text);
    // Escape Telegram MarkdownV2 reserved characters
    // Reserved: _ * [ ] ( ) ~ ` > # + - = | { } . ! and \
    return text.replace(/([_*!\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
  }

  private async updateOrSplitMessage(
    chatId: number,
    messageId: number | undefined,
    textOrEmpty: string,
    replyToMessageId?: number
  ): Promise<number> {
    console.debug("Updating or splitting message: ", textOrEmpty);
    const text = textOrEmpty || "working\.\.\.";
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
        reply_to_message_id: replyToMessageId,
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
        reply_to_message_id: replyToMessageId,
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
    const threadId = `telegram-${chatId}-${userId}`;
    const resourceId = userId;

    console.log(
      `Handling message from ${firstName} (${username}) #${userId}: ${text}`
    );

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
    try {
      // Start typing action loop
      let stopTyping = false;
      const typingIntervalMs = 5000; // Telegram typing status lasts a few seconds; refresh periodically
      const triggerTyping = async () => {
        try {
          await this.bot.sendChatAction(chatId, "typing");
        } catch (e) {
          // Non-fatal; ignore typing errors
        }
      };
      // Immediately show typing, then keep it alive until we finish
      await triggerTyping();
      const typingTimer = setInterval(() => {
        if (stopTyping) {
          clearInterval(typingTimer);
          return;
        }
        void triggerTyping();
      }, typingIntervalMs);

      const runtimeContext = new RuntimeContext<SupportRuntimeContext>();
      runtimeContext.set("group_chat", msg.chat.type === "group");
      runtimeContext.set("is_admin", ["1388135549"].includes(userId));

      const agent = this.mastra.getAgent("osrsAgent");
      const generate = await agent.generateVNext(text, {
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
        runtimeContext,
      });

      // Stop typing and send final message
      stopTyping = true;
      await this.updateOrSplitMessage(
        chatId,
        undefined,
        this.escapeMarkdown(generate.text),
        msg.message_id
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error processing message:", error.message);
      } else {
        console.error("Error processing message:", error);
      }

      await this.bot.sendMessage(
        chatId,
        "Sorry, I encountered an error processing your message. Please try again."
      );
    }
  }
}
