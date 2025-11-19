import { randomUUIDv7 } from "bun";
import { numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { user } from "./auth";

export const addresses = pgTable("addresses", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `addr-${randomUUIDv7()}`),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  label: varchar("label", { length: 50 }),
  address: varchar("address", { length: 255 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, { fields: [addresses.userId], references: [user.id] }),
}));
