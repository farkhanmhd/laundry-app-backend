import { randomUUIDv7 } from "bun";
import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { addresses } from "./addresses";
import { user } from "./auth";
import { orders } from "./orders";

export const deliveryTypeEnum = pgEnum("deliveryType", ["pickup", "delivery"]);

export const deliveryStatusEnum = pgEnum("deliveryStatus", [
  "requested",
  "in_progress",
  "completed",
  "cancelled",
]);

export const deliveries = pgTable("deliveries", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `dlv-${randomUUIDv7()}`),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  addressId: varchar("address_id")
    .references(() => addresses.id, { onDelete: "cascade" })
    .notNull(),
  orderId: varchar("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  type: deliveryTypeEnum().notNull(),
  status: deliveryStatusEnum().default("requested").notNull(),
  notes: varchar("notes", { length: 255 }),
  requestedAt: timestamp("requested_at", { mode: "string" }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: "string" }),
});

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  user: one(user, { fields: [deliveries.userId], references: [user.id] }),
  address: one(addresses, {
    fields: [deliveries.addressId],
    references: [addresses.id],
  }),
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
}));
