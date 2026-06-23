import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { inventories } from "./inventories";

export const inventoryLogs = pgTable("inventory_logs", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `il-${nanoid()}`),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id, { onDelete: "cascade" })
    .notNull(),
  actorId: varchar("actor_id")
    .references(() => user.id)
    .notNull(),
  action: varchar("action", {
    enum: ["create", "update", "delete", "image_update"],
  }).notNull(),
  changedFields: jsonb("changed_fields"),
  summary: varchar("summary"),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  inventory: one(inventories, {
    fields: [inventoryLogs.inventoryId],
    references: [inventories.id],
  }),
  actor: one(user, {
    fields: [inventoryLogs.actorId],
    references: [user.id],
  }),
}));
