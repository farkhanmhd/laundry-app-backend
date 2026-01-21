import { randomUUIDv7 } from "bun";
import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { addresses } from "./addresses";
import { orders } from "./orders";
import { routes } from "./routes";

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
  addressId: varchar("address_id")
    .references(() => addresses.id, { onDelete: "cascade" })
    .notNull(),
  orderId: varchar("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  routeId: varchar("route_id").references(() => routes.id),
  index: integer("index"),
  type: deliveryTypeEnum().notNull(),
  status: deliveryStatusEnum().default("requested").notNull(),
  notes: varchar("notes", { length: 255 }),
  requestedAt: timestamp("requested_at", { mode: "string" }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: "string" }),
});

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  address: one(addresses, {
    fields: [deliveries.addressId],
    references: [addresses.id],
  }),
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
  route: one(routes, {
    fields: [deliveries.routeId],
    references: [routes.id],
  }),
}));
