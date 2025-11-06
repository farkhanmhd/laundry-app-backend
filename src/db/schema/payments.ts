import { randomUUIDv7 } from "bun";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { orders } from "./orders";
import { shifts } from "./shifts";

export const paymentTypeEnum = pgEnum("paymentType", ["qris", "cash"]);

export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `pd-${randomUUIDv7()}`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  shiftId: varchar("shift_id")
    .references(() => shifts.id)
    .notNull(),
  grossAmount: integer("amount").notNull(),
  paymentType: paymentTypeEnum(),
  transactionTime: timestamp("transaction_time", { mode: "string" })
    .defaultNow()
    .notNull(),
  fraudStatus: varchar("fraud_status", { length: 20 }).notNull(),
  expiryTime: timestamp("expiry_time", { mode: "string" }).notNull(),

  // QRIS specific fields
  qrString: varchar("qr_string", { length: 500 }),
  acquirer: varchar("acquirer", { length: 50 }),
  actions:
    json("actions").$type<{ name: string; method: string; url: string }[]>(),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  shift: one(shifts, {
    fields: [payments.shiftId],
    references: [shifts.id],
  }),
}));
