import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { members } from "./members";
import { orders } from "./orders";
import { vouchers } from "./vouchers";

export const redemptionHistory = pgTable("redemption_history", {
  id: varchar("id").primaryKey(),
  memberId: varchar("member_id")
    .references(() => members.id)
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
  member: one(members, {
    fields: [redemptionHistory.memberId],
    references: [members.id],
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
