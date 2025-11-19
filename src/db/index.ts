import { drizzle } from "drizzle-orm/bun-sql";

export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL,
    // ssl: process.env.NODE_ENV === "production",
    max: 50,
    idleTimeout: 30,
    maxLifetime: 3600,
    connectionTimeout: 10,
  },
});
