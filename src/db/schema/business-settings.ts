import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const businessSettings = pgTable("business_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  maxDistanceKm: numeric("max_distance_km", {
    precision: 5,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
