import { integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { bundlings } from "./bundlings";
import { inventories } from "./inventories";
import { orders } from "./orders";
import { services } from "./services";
import { vouchers } from "./vouchers";

export const itemTypeEnum = pgEnum("orderItemType", [
  "service",
  "inventory",
  "bundling",
  "voucher",
  "points",
]);

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `od-${nanoid(5)}`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  note: varchar("note"),
  serviceId: varchar("service_id").references(() => services.id),
  inventoryId: varchar("inventory_id").references(() => inventories.id),
  bundlingId: varchar("bundling_id").references(() => bundlings.id),
  voucherId: varchar("voucher_id").references(() => vouchers.id),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export type OrderItemInsert = typeof orderItems.$inferInsert;

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
  inventory: one(inventories, {
    fields: [orderItems.inventoryId],
    references: [inventories.id],
  }),
  bundling: one(bundlings, {
    fields: [orderItems.bundlingId],
    references: [bundlings.id],
  }),
  voucher: one(vouchers, {
    fields: [orderItems.voucherId],
    references: [vouchers.id],
  }),
}));
