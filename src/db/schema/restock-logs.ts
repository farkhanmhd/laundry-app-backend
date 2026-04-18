import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { inventories } from "./inventories";

export const restockLogs = pgTable(
  "restock_logs",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => `rl-${nanoid()}`),
    inventoryId: varchar("inventory_id", { length: 255 }).notNull(),
    supplier: varchar("supplier", { length: 255 }).notNull(),
    stockRemaining: integer("stock_remaining").notNull(),
    restockQuantity: integer("restock_quantity").notNull(),
    note: varchar("note", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    restockTime: timestamp("restock_time", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("restock_quantity_check", sql`${table.restockQuantity} > 0`),
  ]
);

export const restockLogsRelations = relations(restockLogs, ({ one }) => ({
  inventory: one(inventories, {
    fields: [restockLogs.inventoryId],
    references: [inventories.id],
  }),
  user: one(user, {
    fields: [restockLogs.userId],
    references: [user.id],
  }),
}));
