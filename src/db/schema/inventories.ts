import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { orderItems } from "./order-items";
import { stockLogs } from "./stock-logs";

export const inventoryUnitEnum = pgEnum("inventoryUnit", [
  "kilogram",
  "gram",
  "litre",
  "milliliter",
  "pieces",
]);

export const inventories = pgTable(
  "inventories",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$defaultFn(() => `p-${nanoid()}`),
    name: varchar("name", { length: 128 }).notNull(),
    description: varchar("description", { length: 512 }).notNull(),
    image: varchar("image").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").notNull(),
    safetyStock: integer("safety_stock").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [
    check("current_quantity_check", sql`${table.stock} >= 0`),
    check("price_check", sql`${table.price} >= 0`),
  ]
);

export const inventoriesRelations = relations(inventories, ({ many }) => ({
  orderItems: many(orderItems),
  logs: many(stockLogs),
}));

export type InventoryInsert = typeof inventories.$inferInsert;
