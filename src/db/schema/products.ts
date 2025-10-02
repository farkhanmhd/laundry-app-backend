import { sql } from "drizzle-orm";
import { check, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
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
    reorderPoint: integer("reorder_point").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [check("current_quantity_check", sql`${table.currentQuantity} >= 0`), check("price_check", sql`${table.price} >= 0`)],
);

export const productsRelations = relations(products, ({ many }) => ({
  orderDetails: many(orderDetails),
  stockAdjustments: many(stockAdjustments),
}));

export type ProductInsert = typeof products.$inferInsert;
