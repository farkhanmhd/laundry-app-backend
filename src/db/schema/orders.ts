import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { customers } from "./customers";
import { orderDetails } from "./order-details";
import { payments } from "./payments";
import { redemptionHistory } from "./redemption-history";
import { shifts } from "./shifts";

export const orders = pgTable("orders", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `o-${nanoid(5)}`),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id")
    .references(() => user.id)
    .notNull(),
  shiftId: varchar("shift_id")
    .references(() => shifts.id)
    .notNull(),
  status: varchar("status", {
    length: 50,
    enum: ["pending", "processing", "ready", "completed"],
  }).notNull(),
  totalAmount: integer("total_amount").notNull(),
  discountApplied: integer("discount_applied").default(0).notNull(),
  amountPaid: integer("amount_paid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  shift: one(shifts, {
    fields: [orders.shiftId],
    references: [shifts.id],
  }),
  orderDetails: many(orderDetails),
  payments: many(payments),
  redemptionHistory: many(redemptionHistory),
}));
