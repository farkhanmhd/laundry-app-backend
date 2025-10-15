import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "../utils";

export const services = pgTable(
  "services",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$default(() => `s-${nanoid()}`),
    name: varchar("name", { length: 128 }).notNull(),
    image: varchar("image"),
    price: integer("price").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [check("price_check", sql`${table.price} >= 0`)]
);

export type ServiceInsert = typeof services.$inferInsert;
