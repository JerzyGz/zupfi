import { Hono } from "hono";
import { auth } from "@/worker/lib/auth";
import type { AuthType } from "@/worker/lib/auth";

const authRouter = new Hono<{ Bindings: AuthType }>({
  //https://hono.dev/docs/api/hono#strict-mode
  strict: false,
});

authRouter.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

export { authRouter };
