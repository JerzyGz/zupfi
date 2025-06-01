import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { Env } from "@/worker";
import { ClerkAuthService } from "../modules/auth/clerk-auth.service";

const UnAuthenticatedMessage =
  "Unauthorized access. Please provide a valid token.";
type Variables = {
  clerkId: string;
};
const authClerkMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: UnAuthenticatedMessage,
    });
  }

  const authService = new ClerkAuthService(c.env);
  const authResult = await authService.authenticateUser(c.req.raw);

  if (!authResult.isSignedIn) {
    throw new HTTPException(401, {
      message: UnAuthenticatedMessage,
    });
  }

  c.set("clerkId", authResult.userId);
  await next();
});

export { authClerkMiddleware };
