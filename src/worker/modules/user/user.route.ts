import { Hono } from "hono";
import { Env } from "@/worker/index";

import { authClerkMiddleware } from "@/worker/middlewares/auth.middleware";
import { TelegramDeepLinkTokenManager } from "@/worker/modules/tokens/telegram-deeplink-token-manager";

const userApp = new Hono<{ Bindings: Env }>();

userApp.get(
  "/user/generate-telegram-deeplink",
  // TODO: middleware - create new one for better-auth
  authClerkMiddleware,
  async (c) => {
    // TODO: replace by userId
    const clerkId = c.get("clerkId");

    const url = await new TelegramDeepLinkTokenManager(
      c.env.TEMP_TOKENS
    ).generateTelegramDeepLinkTokenUrl({
      id: clerkId,
      botName: c.env.BOT_INFO.username,
      prefixToken: c.env.CUSTOM_PREFIX_TOKEN,
    });
    return c.json({
      url,
    });
  }
);

export default userApp;
