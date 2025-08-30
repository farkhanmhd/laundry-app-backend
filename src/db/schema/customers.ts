import { relations } from "drizzle-orm";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { orders } from "./orders";
import { redemptionHistory } from "./redemption-history";

export const customers = pgTable("customers", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$defaultFn(() => `c-${nanoid()}`),
  name: varchar("name", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 24 }).unique().notNull(),
  points: integer("points").default(0).notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  redemptionHistory: many(redemptionHistory),
}));
