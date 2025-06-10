import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { Env } from "@/worker";
import { AuthType, auth } from "@/worker/lib/auth";

const UnAuthenticatedMessage =
  "Unauthorized access. Please provide a valid token.";

const authBetterAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AuthType;
}>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new HTTPException(401, {
      message: UnAuthenticatedMessage,
    });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

export { authBetterAuthMiddleware };
