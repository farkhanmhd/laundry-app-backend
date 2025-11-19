import { randomUUIDv7 } from "bun";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { orders } from "./orders";

export const paymentTypeEnum = pgEnum("paymentType", ["qris", "cash"]);

export const payments = pgTable("payment_detail", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `pd-${randomUUIDv7()}`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  paymentType: paymentTypeEnum(),

  discountAmount: integer("discount_amount").notNull(),
  amountPaid: integer("amount_paid").notNull(), // if not cash then amountPaid === total
  change: integer("change"), // possible if cash. if not cash then 0
  total: integer("total").notNull(), // customer total payment

  transactionStatus: varchar("transaction_status"),
  transactionTime: timestamp("transaction_time", { mode: "string" })
    .defaultNow()
    .notNull(),
  fraudStatus: varchar("fraud_status", { length: 20 }).notNull(),
  expiryTime: timestamp("expiry_time", { mode: "string" }).notNull(),

  // QRIS specific fields
  qrString: varchar("qr_string", { length: 500 }),
  acquirer: varchar("acquirer", { length: 50 }),
  actions:
    jsonb("actions").$type<{ name: string; method: string; url: string }[]>(),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
