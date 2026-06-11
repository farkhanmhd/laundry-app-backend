import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { assets } from "./assets";
import { user } from "./auth";
import { deliveries } from "./deliveries";

export const routes = pgTable("routes", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `rt-${nanoid()}`),
  userId: varchar("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  assetId: uuid("asset_id").references(() => assets.id, {
    onDelete: "set null",
  }),
});

export const routesRelations = relations(routes, ({ one, many }) => ({
  user: one(user, {
    fields: [routes.userId],
    references: [user.id],
  }),
  asset: one(assets, {
    fields: [routes.assetId],
    references: [assets.id],
  }),
  deliveries: many(deliveries),
}));
