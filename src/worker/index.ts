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
  CLERK_PUBLISHABLE_KEY: string;
  BOT_INFO: UserFromGetMe;
  CUSTOM_PREFIX_TOKEN: string;
  GEMINI_API_KEY: string;
  FinancialTelegramAgent: AgentNamespace<FinancialTelegramAgent>;
  DB: D1Database;
  TEMP_TOKENS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.route("/telegram", telegramRoute);
app.route("/api", userApp);

export default app;
