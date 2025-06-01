import { Env } from "@/worker";
import { ClerkClient, createClerkClient } from "@clerk/backend";

export class ClerkAuthService {
  private clerkClient: ClerkClient;
  constructor(env: Env) {
    this.clerkClient = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });
  }

  async authenticateUser(
    request: Request
  ): Promise<{ isSignedIn: false } | { isSignedIn: true; userId: string }> {
    const result = await this.clerkClient.authenticateRequest(request, {
      //TODO: add production url  to authorizedParties
      // authorizedParties: [""]
    });

    if (!result.isSignedIn) {
      return { isSignedIn: false };
    }

    const auth = result.toAuth();

    if (!auth?.userId) {
      return { isSignedIn: false };
    }

    return { isSignedIn: true, userId: auth.userId };
  }
}
