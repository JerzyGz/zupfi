import type { FinancialTelegramAgent } from "@/agent/financial-telegram-agent";
import type { Env } from "@/index";
import { getAgentByName } from "agents";
import { Bot, type Context, webhookCallback } from "grammy";
import { Hono } from "hono";
import type { IncomingMessage } from "./validator";

const telegramRoute = new Hono<{ Bindings: Env }>();

telegramRoute.post("/chat-web-hook", async (c) => {
	//TODO: auth validation

	const body = c.req.raw.clone();
	const data = (await body.json()) as IncomingMessage;
	console.log("req", data);
	const tlgramAgent = await getAgentByName<Env, FinancialTelegramAgent>(
		c.env.FinancialTelegramAgent,
		data.message.chat.id.toString(),
	);

	const bot = new Bot(c.env.TELEGRAM_TOKEN, {
		botInfo: c.env.BOT_INFO,
	});

	bot.command("start", async (ctx: Context) => {
		//TODO: add welcome message, and minimal introduction about what the agent can do
		return await ctx.reply("Hello, world!");
	});

	//allow only text message
	bot.on("message:text", async (ctx) => {
		tlgramAgent.processMessage(data);
		return new Response(null, { status: 204 });
	});

	//allow only photo message
	bot.on("message:photo", (ctx) => {
		//TODO: pending to implement

		tlgramAgent.processImageInvoice({
			chatId: data.message.chat.id,
			fileId: data.message.photo[3].file_id,
			caption: data.message.caption,
		});
		return new Response(null, { status: 204 });
		// return ctx.reply("Bot to handle photo!");
	});

	const handler = webhookCallback(bot, "cloudflare-mod");
	return await handler(c.req.raw);
});

export default telegramRoute;
