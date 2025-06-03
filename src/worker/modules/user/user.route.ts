// routes/webhooks.ts
import { Hono } from "hono";
import { Webhook } from "svix";
import { Env } from "@/worker/index";
import { getDrizzleDb } from "@/worker/db";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { authClerkMiddleware } from "@/worker/middlewares/auth.middleware";
import { TelegramDeepLinkTokenManager } from "@/worker/modules/tokens/telegram-deeplink-token-manager";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email_addresses: {
      email_address: string;
    }[];
  };
}

const userApp = new Hono<{ Bindings: Env }>();

userApp.post("/user/clerk-webhook", async (c) => {
  const CLERK_WEBHOOK_SIGNING_SECRET = c.env.CLERK_WEBHOOK_SIGNING_SECRET;

  try {
    const headers = {
      "svix-id": c.req.header("svix-id") || "",
      "svix-timestamp": c.req.header("svix-timestamp") || "",
      "svix-signature": c.req.header("svix-signature") || "",
    };

    const payload = await c.req.json();
    // Create a new Webhook instance with the Clerk signing secret
    const wh = new Webhook(CLERK_WEBHOOK_SIGNING_SECRET);
    // Verify the webhook signature and parse the event
    const evt = wh.verify(
      JSON.stringify(payload),
      headers
    ) as ClerkWebhookEvent;

    const db = getDrizzleDb(c.env);
    const userRepository = new UserRepository(db);
    const userService = new UserService(userRepository);
    switch (evt.type) {
      case "user.created": {
        const { id, first_name, last_name, email_addresses } = evt.data;
        const [email] = email_addresses;
        await userService.create({
          clerkId: id,
          email: email.email_address,
          name: first_name,
          lastName: last_name,
        });
        break;
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Invalid signature" }, 400);
  }
});

userApp.get(
  "/user/generate-tlgram-deeplink",
  authClerkMiddleware,
  async (c) => {
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
