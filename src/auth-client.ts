import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
  baseURL: process.env.BETTER_AUTH_URL,
});
