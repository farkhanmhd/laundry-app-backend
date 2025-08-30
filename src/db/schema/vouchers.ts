import { boolean, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { redemptionHistory } from "./redemption-history";

export const vouchers = pgTable("vouchers", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$defaultFn(() => `v-${nanoid()}`),
  name: varchar("name", { length: 128 }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  discountAmount: integer("discount_amount").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const vouchersRelations = relations(vouchers, ({ many }) => ({
  redemptionHistory: many(redemptionHistory),
}));
