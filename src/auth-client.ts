import { createAuthClient } from "better-auth/client";
import { adminClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient()],
  baseURL: process.env.BETTER_AUTH_URL,
});
