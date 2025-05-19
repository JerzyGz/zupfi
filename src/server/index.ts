import { FinancialTelegramAgent } from "@/agent/financial-telegram-agent";
import telegramRoute from "@/routes/telegram/telegram";
import type { AgentNamespace } from "agents";
import type { UserFromGetMe } from "grammy/types";
import { Hono } from "hono";

// The Durable Objects need to be exported from the entrypoint file defined in wrangler.jsonc
export { FinancialTelegramAgent };

export interface Env {
  TELEGRAM_TOKEN: string;
  BOT_INFO: UserFromGetMe;
  GEMINI_API_KEY: string;
  FinancialTelegramAgent: AgentNamespace<FinancialTelegramAgent>;
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.post("/message", async (c) => {
  console.log("req", await c.req.json());
  return c.text("ok");
});

app.route("/telegram", telegramRoute);

export default app;
