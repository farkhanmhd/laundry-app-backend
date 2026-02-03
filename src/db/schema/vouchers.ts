import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { orderItems } from "./order-items";
import { redemptionHistory } from "./redemption-history";

export const vouchers = pgTable(
  "vouchers",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$defaultFn(() => `v-${nanoid()}`),
    code: varchar("code", { length: 32 }).unique().notNull(),
    description: text("description").notNull(),
    discountPercentage: numeric("discount_percentage", {
      precision: 5,
      scale: 2,
    }),
    discountAmount: bigint("discount_amount", { mode: "number" }),
    minSpend: bigint("min_spend", { mode: "number" }).notNull(),
    maxDiscountAmount: bigint("max_discount_amount", {
      mode: "number",
    }).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [
    check(
      "one_discount_type_only",
      sql`
        (
            (${table.discountPercentage} IS NOT NULL AND ${table.discountAmount} IS NULL)
        ) OR
        (
            (${table.discountPercentage} IS NULL AND ${table.discountAmount} IS NOT NULL)
        )
    `
    ),
    check(
      "percentage_requires_cap",
      sql`
        (${table.discountPercentage} IS NULL OR ${table.maxDiscountAmount} IS NOT NULL)
      `
    ),
  ]
);

export const vouchersRelations = relations(vouchers, ({ many }) => ({
  redemptionHistory: many(redemptionHistory),
  orderItems: many(orderItems),
}));
