import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { bundlingItems } from "./bundling-items";
import { stockLogs } from "./stock-logs";

export const bundlings = pgTable("bundlings", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `bnd-${nanoid()}`),
  name: varchar("name", { length: 100 }).notNull(),
  image: varchar("image").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
});

export const bundlingsRelations = relations(bundlings, ({ many }) => ({
  bundlingItems: many(bundlingItems),
  stockLogs: many(stockLogs),
}));
