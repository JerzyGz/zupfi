import { Hono } from "hono";
import { Env } from "@/worker/index";
import { authBetterAuthMiddleware } from "@/worker/middlewares/auth.middleware";
import { TelegramDeepLinkTokenManager } from "@/worker/modules/tokens/telegram-deeplink-token-manager";

const userApp = new Hono<{ Bindings: Env }>();

userApp.get(
  "/generate-telegram-deeplink",
  authBetterAuthMiddleware,
  async (c) => {
    const user = c.get("user");

    const url = await new TelegramDeepLinkTokenManager(
      c.env.TEMP_TOKENS
    ).generateTelegramDeepLinkTokenUrl({
      id: user!.id,
      botName: c.env.BOT_INFO.username,
      prefixToken: c.env.CUSTOM_PREFIX_TOKEN,
    });

    return c.json({
      url,
    });
  }
);

export default userApp;
