/** biome-ignore-all lint/suspicious/noExplicitAny: copied directly from better-auth docs */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, openAPI, username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import {
  account,
  session,
  user as userTable,
  verification,
} from "@/db/schema/auth";
import { db } from "../db";
import { accessControl, admin, superadmin, user } from "./permissions";

export const auth = betterAuth({
  basePath: "/api",
  trustedOrigins: [process.env.FRONTEND_URL as string],
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account,
      session,
      user: userTable,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    openAPI(),
    adminPlugin({
      ac: accessControl,
      roles: {
        user,
        admin,
        superadmin,
      },
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 3600,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const ownerEmail = process.env.OWNER_EMAIL;
          if (user.email === ownerEmail) {
            await db
              .update(userTable)
              .set({
                role: "superadmin",
              })
              .where(eq(userTable.email, ownerEmail));
          }
        },
      },
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
    },
  },
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
// biome-ignore lint/suspicious/noAssignInExpressions: copied directly from better-auth docs
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = "/auth/api") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path] as any;

        for (const method of Object.keys(paths[path] as any)) {
          const operation = (reference[key] as any)[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;
