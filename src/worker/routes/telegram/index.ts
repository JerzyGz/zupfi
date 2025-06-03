import type { FinancialTelegramAgent } from "@/worker/agent/financial-telegram-agent";
import type { Env } from "@/worker/index";
import { getAgentByName } from "agents";
import { Bot, type Context, webhookCallback } from "grammy";
import { Hono } from "hono";
import type { IncomingMessage } from "./validator";

import { welcomeMessage } from "./responses";
import { TelegramDeepLinkTokenManager } from "@/worker/modules/tokens/telegram-deeplink-token-manager";
import { UserService } from "@/worker/modules/user/user.service";
import { getDrizzleDb } from "@/worker/db";
import { UserRepository } from "@/worker/modules/user/user.repository";

const telegramRoute = new Hono<{ Bindings: Env }>();

telegramRoute.post("/chat-web-hook", async (c) => {
  //TODO: auth validation

  const body = c.req.raw.clone();
  const data = (await body.json()) as IncomingMessage;
  console.log("req chat-web-hook", data);
  //define function to create or retrieves an agent instance for a specific chat
  const agent = async () => {
    return getAgentByName<Env, FinancialTelegramAgent>(
      c.env.FinancialTelegramAgent,
      `agent-${data.message.chat.id.toString()}`
    );
  };

  const bot = new Bot(c.env.TELEGRAM_TOKEN, {
    botInfo: c.env.BOT_INFO,
  });

  bot.command("start", async (ctx: Context) => {
    console.log("command start");
    const message = ctx.message?.text;
    console.log("message", message);
    if (message && message.startsWith("/start")) {
      const token = message.replace("/start", "").trim();
      const tokenValidationResult = await new TelegramDeepLinkTokenManager(
        c.env.TEMP_TOKENS
      ).validateTelegramDeepLinkToken({
        token,
        prefixToken: c.env.CUSTOM_PREFIX_TOKEN,
      });
      console.log("tokenValidationResult", tokenValidationResult);

      if (!tokenValidationResult.isValid) {
        return await ctx.reply(
          "Token inválido, genera uno nuevo desde la web."
        );
      }
      // User exists, link the Telegram user with the Clerk user
      const chatTelegramId = ctx.message?.chat.id;
      const user = new UserService(new UserRepository(getDrizzleDb(c.env)));
      const userLinked = await user.linkClerkIdToUserTelegram({
        clerkId: tokenValidationResult.userId,
        chatTelegramId,
      });

      console.log("userLinked", userLinked);

      if (!userLinked.success) {
        return await ctx.reply(
          "Error al vincular tu cuenta de Telegram con la cuenta del sitio web."
        );
      }
      //create agent
      const agentInstance = await agent();
      agentInstance.setInitUserState({
        id: userLinked.userId,
        name: userLinked.name,
      });
    }
    return await ctx.reply(welcomeMessage, { parse_mode: "MarkdownV2" });
  });

  //allow only text message
  bot.on("message:text", async () => {
    console.log("message:text", data.message.text);

    const tlgramAgent = await agent();
    tlgramAgent.processMessage(data);
    return new Response(null, { status: 204 });
  });

  //allow only photo message
  bot.on("message:photo", async () => {
    const tlgramAgent = await agent();
    tlgramAgent.processImageInvoice(data);
    return new Response(null, { status: 204 });
  });

  const handler = webhookCallback(bot, "cloudflare-mod");
  return await handler(c.req.raw);
});

export default telegramRoute;
