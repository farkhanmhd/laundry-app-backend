import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { customers } from "./customers";
import { orders } from "./orders";
import { vouchers } from "./vouchers";

export const redemptionHistory = pgTable("redemption_history", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id")
    .references(() => customers.id)
    .notNull(),
  voucherId: varchar("voucher_id")
    .references(() => vouchers.id)
    .notNull(),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  pointsSpent: integer("points_spent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const redemptionHistoryRelations = relations(redemptionHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [redemptionHistory.customerId],
    references: [customers.id],
  }),
  voucher: one(vouchers, {
    fields: [redemptionHistory.voucherId],
    references: [vouchers.id],
  }),
  order: one(orders, {
    fields: [redemptionHistory.orderId],
    references: [orders.id],
  }),
}));
