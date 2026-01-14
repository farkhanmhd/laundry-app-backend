import { randomUUIDv7 } from "bun";
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { bundlings } from "./bundlings";
import { inventories } from "./inventories";
import { services } from "./services";

export const bundlingType = pgEnum("bundlingType", ["service", "inventory"]);

export const bundlingItems = pgTable("bundling_items", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `bi-${randomUUIDv7()}`),
  bundlingId: varchar("bundling_id")
    .references(() => bundlings.id, { onDelete: "cascade" })
    .notNull(),
  itemType: bundlingType("item_type").notNull(),
  serviceId: varchar("service_id").references(() => services.id),
  inventoryId: varchar("inventory_id").references(() => inventories.id),
  quantity: integer("quantity").notNull(),
});

export const bundlingItemsRelations = relations(bundlingItems, ({ one }) => ({
  bundling: one(bundlings, {
    fields: [bundlingItems.bundlingId],
    references: [bundlings.id],
  }),
  service: one(services, {
    fields: [bundlingItems.serviceId],
    references: [services.id],
  }),
  inventory: one(inventories, {
    fields: [bundlingItems.inventoryId],
    references: [inventories.id],
  }),
}));
