import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { bundlingItems } from "./bundling-items";
import { orderItems } from "./order-items";

export const services = pgTable(
  "services",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$default(() => `s-${nanoid()}`),
    name: varchar("name", { length: 128 }).notNull(),
    image: varchar("image"),
    description: varchar("description", { length: 512 }).notNull(),
    price: integer("price").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [check("price_check", sql`${table.price} >= 0`)]
);

export type ServiceInsert = typeof services.$inferInsert;

export const servicesRelations = relations(services, ({ many }) => ({
  orderItems: many(orderItems),
  bundlingItems: many(bundlingItems),
}));
