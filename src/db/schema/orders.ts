import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { members } from "./members";
import { orderItems } from "./order-items";
import { payments } from "./payments";
import { redemptionHistory } from "./redemption-history";

export const orderStatusEnum = pgEnum("orderStatus", [
  "pending", // waiting for payment
  "processing", // paid and work in progress
  "ready", // finished working and ready to be pickedup by customer
  "completed", // picked up by customer
]);

export const orders = pgTable("orders", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `o-${nanoid(5)}`),
  customerName: varchar("customer_name", { length: 50 }), // handle non member
  memberId: varchar("member_id").references(() => members.id),
  userId: varchar("user_id") // staff id
    .references(() => user.id)
    .notNull(),
  status: orderStatusEnum().notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
}));
