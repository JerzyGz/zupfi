import { categories as categoriesScheme } from "@/db/schema";
import telegramRoute from "@/routes/telegram/telegram";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { drizzle } from "drizzle-orm/d1";
import { Bot, type Context, webhookCallback } from "grammy";
import type { Update, UserFromGetMe } from "grammy/types";
import { Hono } from "hono";
import { z } from "zod";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;

	DB: D1Database;
	BOT_INFO: UserFromGetMe;
	TELEGRAM_TOKEN: string;
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/message", async (c) => {});

app.route("/telegram", telegramRoute);

export default app;
