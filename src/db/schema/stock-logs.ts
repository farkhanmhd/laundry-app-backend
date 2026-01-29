import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { user } from "./auth";
import { bundlings } from "./bundlings";
import { inventories } from "./inventories";
import { orders } from "./orders";

// Removed 'RETURN' as requested
export const logTypeEnum = pgEnum("log_type", [
  "order", // Stock went OUT (Sale)
  "adjustment", // Manual correction (e.g. found lost item, or fixed count)
  "restock", // Stock went IN (Purchase from supplier)
  "waste", // Stock went OUT (Broken/Expired)
]);

export const stockLogs = pgTable("stock_logs", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `log-${nanoid(10)}`),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id)
    .notNull(),
  type: logTypeEnum("type").notNull(),
  changeAmount: integer("change_amount").notNull(),
  stockRemaining: integer("stock_remaining").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  bundlingId: varchar("bundling_id").references(() => bundlings.id),
  actorId: varchar("actor_id")
    .references(() => user.id)
    .notNull(),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockLogsRelations = relations(stockLogs, ({ one }) => ({
  inventory: one(inventories, {
    fields: [stockLogs.inventoryId],
    references: [inventories.id],
  }),
  user: one(user, {
    fields: [stockLogs.actorId],
    references: [user.id],
  }),
  order: one(orders, {
    fields: [stockLogs.orderId],
    references: [orders.id],
  }),
  bundling: one(bundlings, {
    fields: [stockLogs.bundlingId],
    references: [bundlings.id],
  }),
}));
