import { FinancialTelegramAgent } from "@/worker/agent/financial-telegram-agent";
import telegramRoute from "./routes/telegram";
import type { AgentNamespace } from "agents";
import type { UserFromGetMe } from "grammy/types";
import { Hono } from "hono";
import userApp from "./modules/user/user.route";

// The Durable Objects need to be exported from the entrypoint file defined in wrangler.jsonc
export { FinancialTelegramAgent };

export interface Env {
  TELEGRAM_TOKEN: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SIGNING_SECRET: string;
  JWT_SECRET: string; // created with `openssl rand -base64 32`
  BOT_INFO: UserFromGetMe;
  GEMINI_API_KEY: string;
  FinancialTelegramAgent: AgentNamespace<FinancialTelegramAgent>;
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.route("/telegram", telegramRoute);
app.route("/api", userApp);

export default app;
