import Elysia from "elysia";
import { auth } from "./auth";
import { AuthorizationError } from "./exceptions";

export const betterAuth = new Elysia({ name: "better-auth" }).mount(auth.handler).macro({
  auth: {
    async resolve({ request: { headers } }) {
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        throw new AuthorizationError();
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
  isAdmin: {
    async resolve({ request: { headers } }) {
      const session = await auth.api.getSession({ headers });

      if (!session) {
        throw new AuthorizationError();
      }

      if (session.user.role === "staff") {
        throw new AuthorizationError();
      }
    },
  },
});
