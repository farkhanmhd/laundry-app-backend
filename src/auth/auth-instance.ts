import Elysia from "elysia";
import { AccountService } from "@/modules/account/service";
import { AuthorizationError } from "../exceptions";
import { auth } from "./auth";

export const betterAuth = new Elysia({ name: "better-auth" })
  .mount("/", auth.handler)
  .macro({
    auth: {
      async resolve({ request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) {
          throw new AuthorizationError();
        }

        const userData = await AccountService.getUserData(session.user.id);
        return {
          user: userData,
          session: session.session,
        };
      },
    },
    isCustomer: {
      async resolve({ request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) {
          throw new AuthorizationError();
        }

        const userData = await AccountService.getUserData(session.user.id);

        if (userData.role !== "user") {
          throw new AuthorizationError();
        }

        return {
          user: userData,
          session: session.session,
        };
      },
    },
    isAdmin: {
      async resolve({ request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) {
          throw new AuthorizationError();
        }

        const userData = await AccountService.getUserData(session.user.id);

        if (userData.role === "user") {
          throw new AuthorizationError();
        }

        return {
          user: userData,
          session: session.session,
        };
      },
    },
    isSuperAdmin: {
      async resolve({ request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) {
          throw new AuthorizationError();
        }

        const userData = await AccountService.getUserData(session.user.id);

        if (userData.role !== "superadmin") {
          throw new AuthorizationError();
        }

        return {
          user: userData,
          session: session.session,
        };
      },
    },
  })
  .as("global");
