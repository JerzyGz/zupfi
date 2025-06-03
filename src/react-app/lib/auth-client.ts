import { createAuthClient } from "better-auth/react";
export const { signIn, signOut, signUp, getSession, useSession } =
  createAuthClient();
