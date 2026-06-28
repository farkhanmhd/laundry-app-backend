import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { routes } from "./routes";

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  licensePlate: varchar("license_plate", { length: 11 }).notNull(),
  ownerId: varchar("owner_id").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const vehiclesRelations = relations(vehicles, ({ many, one }) => ({
  routes: many(routes),
  user: one(user, {
    fields: [vehicles.ownerId],
    references: [user.id],
  }),
}));
