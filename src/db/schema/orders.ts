import { relations } from "drizzle-orm";
import { integer, numeric, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { adjustmentLogs } from "./adjustment-logs";
import { user } from "./auth";
import { members } from "./members";
import { orderItems } from "./order-items";
import { payments } from "./payments";
import { redemptionHistory } from "./redemption-history";
import { weightRanges } from "./weight-ranges";

export const orderStatusEnum = pgEnum("orderStatus", [
  "cancelled",
  "pending", // waiting for payment
  "processing", // paid and work in progress
  "ready", // finished working and ready to be pickedup by customer
  "completed", // picked up by customer
]);

export const orders = pgTable("orders", {
  id: varchar("id", { length: 10 })
    .primaryKey()
    .$defaultFn(() => `o-${nanoid(7)}`),
  customerName: varchar("customer_name", { length: 50 }),
  memberId: varchar("member_id").references(() => members.id),
  userId: varchar("user_id").references(() => user.id),
  status: orderStatusEnum().notNull().default("pending"),
  weight: numeric("weight"),
  weightRangeId: integer("weight_range_id").references(() => weightRanges.id),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  member: one(members, {
    fields: [orders.memberId],
    references: [members.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
  redemptionHistory: one(redemptionHistory, {
    fields: [orders.id],
    references: [redemptionHistory.orderId],
  }),

  orderItems: many(orderItems),
  stockMovements: many(adjustmentLogs),
}));
