import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { user } from "./auth";
import { bundlings } from "./bundlings";
import { inventories } from "./inventories";
import { orders } from "./orders";

export const adjustmentLogs = pgTable("adjustment_logs", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `log-${nanoid(10)}`),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id)
    .notNull(),
  changeAmount: integer("change_amount").notNull(),
  stockRemaining: integer("stock_remaining").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  bundlingId: varchar("bundling_id").references(() => bundlings.id),
  actorId: varchar("actor_id")
    .references(() => user.id)
    .notNull(),
  note: varchar("note", { length: 255 }),
  adjustmentTime: timestamp("adjustment_time", {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const adjustmentLogsRelations = relations(adjustmentLogs, ({ one }) => ({
  inventory: one(inventories, {
    fields: [adjustmentLogs.inventoryId],
    references: [inventories.id],
  }),
  user: one(user, {
    fields: [adjustmentLogs.actorId],
    references: [user.id],
  }),
  order: one(orders, {
    fields: [adjustmentLogs.orderId],
    references: [orders.id],
  }),
  bundling: one(bundlings, {
    fields: [adjustmentLogs.bundlingId],
    references: [bundlings.id],
  }),
}));
