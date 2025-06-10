import { FinancialTelegramAgent } from "@/worker/agent/financial-telegram-agent";
import telegramRoute from "./routes/telegram";
import type { AgentNamespace } from "agents";
import type { UserFromGetMe } from "grammy/types";
import { Hono } from "hono";
import userApp from "./modules/user/user.route";
import { authRouter } from "@/worker/modules/auth/auth.route";

// The Durable Objects need to be exported from the entrypoint file defined in wrangler.jsonc
export { FinancialTelegramAgent };

export interface Env {
  TELEGRAM_TOKEN: string;

  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  BOT_INFO: UserFromGetMe;
  CUSTOM_PREFIX_TOKEN: string;
  GEMINI_API_KEY: string;
  FinancialTelegramAgent: AgentNamespace<FinancialTelegramAgent>;
  TEMP_TOKENS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.route("/telegram", telegramRoute);

app.route("/api", authRouter);
app.route("/api/user", userApp);

export default app;
