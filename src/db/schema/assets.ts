import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { routes } from "./routes";

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  licensePlate: varchar("license_plate", { length: 11 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const assetsRelations = relations(assets, ({ many }) => ({
  routes: many(routes),
}));
