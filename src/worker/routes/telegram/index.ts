import type { FinancialTelegramAgent } from "@/worker/agent/financial-telegram-agent";
import type { Env } from "@/worker/index";
import { getAgentByName } from "agents";
import { Bot, type Context, webhookCallback } from "grammy";
import { Hono } from "hono";
import type { IncomingMessage } from "./validator";
import { drizzle } from "drizzle-orm/d1";
import { users } from "@/worker/db/schema";
import { getUtcDate } from "@/worker/helpers/date";
import { welcomeMessage } from "./responses";

const telegramRoute = new Hono<{ Bindings: Env }>();

telegramRoute.post("/chat-web-hook", async (c) => {
  //TODO: auth validation

  const body = c.req.raw.clone();
  const data = (await body.json()) as IncomingMessage;
  console.log("req", data);
  //Creates or retrieves an agent instance for a specific chat
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
    // first time interaction save user in db

    //TODO:
    const db = drizzle(c.env.DB);
    const date = getUtcDate();
    const userInserted = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        chatTelegramId: data.message.chat.id,
        userName: data.message.from.username,
        email: data.message.from.username,
        name: data.message.from.first_name,
        lastName: data.message.from.last_name,
        createdAt: date,
        updatedAt: date,
      })
      .onConflictDoNothing({ target: users.chatTelegramId })
      .returning({ id: users.id });

    if (userInserted.length) {
      // first time interaction create agent
      const tlgramAgent = await agent();

      tlgramAgent.setInitUserState({
        id: userInserted[0].id,
        name: data.message.from.first_name,
        languageCode: data.message.from.language_code,
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
    //TODO: pending to implement
    const tlgramAgent = await agent();
    tlgramAgent.processImageInvoice(data);
    return new Response(null, { status: 204 });
    // return ctx.reply("Bot to handle photo!");
  });

  const handler = webhookCallback(bot, "cloudflare-mod");
  return await handler(c.req.raw);
});

export default telegramRoute;
