import { randomUUIDv7 } from "bun";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { bundlingItems } from "./bundling-items";

export const bundlings = pgTable("bundlings", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `bnd-${randomUUIDv7()}`),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  price: integer("price").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const bundlingsRelations = relations(bundlings, ({ many }) => ({
  bundlingItems: many(bundlingItems),
}));
