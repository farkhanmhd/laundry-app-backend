import { boolean, numeric, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const weightRanges = pgTable("weight_ranges", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  minWeight: numeric("min_weight").notNull(),
  maxWeight: numeric("max_weight").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});
