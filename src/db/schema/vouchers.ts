import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { orderItems } from "./order-items";
import { redemptionHistory } from "./redemption-history";

export const vouchers = pgTable("vouchers", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$defaultFn(() => `v-${nanoid()}`),
  code: varchar("code", { length: 32 }).unique().notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  discountAmount: integer("discount_amount").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
});

export const vouchersRelations = relations(vouchers, ({ many }) => ({
  redemptionHistory: many(redemptionHistory),
  orderItems: many(orderItems),
}));
