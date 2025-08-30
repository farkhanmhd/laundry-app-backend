import { sql } from "drizzle-orm";
import { check, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { orderDetails } from "./order-details";
import { stockAdjustments } from "./stock-adjustments";

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$defaultFn(() => `p-${nanoid()}`),
    name: varchar("name", { length: 128 }).notNull(),
    image: varchar("image"),
    price: integer("price").notNull(),
    currentQuantity: integer("current_quantity").notNull().default(0),
  },
  (table) => [check("current_quantity_check", sql`${table.currentQuantity} >= 0`), check("price_check", sql`${table.price} >= 0`)],
);

export const productsRelations = relations(products, ({ many }) => ({
  orderDetails: many(orderDetails),
  stockAdjustments: many(stockAdjustments),
}));
