import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { user } from "./auth";
import { inventories } from "./inventories";

export const stockAdjustments = pgTable("stock_adjustments", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `sa-${nanoid(5)}`),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id")
    .references(() => user.id)
    .notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: varchar("reason", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ one }) => ({
    inventory: one(inventories, {
      fields: [stockAdjustments.inventoryId],
      references: [inventories.id],
    }),
    user: one(user, {
      fields: [stockAdjustments.userId],
      references: [user.id],
    }),
  })
);
