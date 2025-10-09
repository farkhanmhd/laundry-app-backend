import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { orders } from "./orders";
import { payments } from "./payments";

export const shiftStatusEnum = pgEnum("shift_status", ["active", "closed"]);

export const shifts = pgTable("shifts", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `sh-${nanoid(5)}`),
  userId: varchar("user_id")
    .references(() => user.id)
    .notNull(),
  startTime: timestamp("start_time", { mode: "string" }).defaultNow().notNull(),
  endTime: timestamp("end_time", { mode: "string" }),
  status: shiftStatusEnum()
    .notNull()
    .$defaultFn(() => "active"),
  startingCash: integer("starting_cash").notNull(),
  cashPaymentsTotal: integer("cash_payments_total"),
  onlinePaymentsTotal: integer("online_payments_total"),
  actualEndingCash: integer("actual_ending_cash"),
  cashDifference: integer("cash_difference"),
  notes: text("notes"),
});

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  user: one(user, {
    fields: [shifts.userId],
    references: [user.id],
  }),
  orders: many(orders),
  payments: many(payments),
}));
