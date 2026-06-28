import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { deliveries } from "./deliveries";
import { vehicles } from "./vehicles";

export const routes = pgTable("routes", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `rt-${nanoid()}`),
  userId: varchar("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),
});

export const routesRelations = relations(routes, ({ one, many }) => ({
  user: one(user, {
    fields: [routes.userId],
    references: [user.id],
  }),
  vehicle: one(vehicles, {
    fields: [routes.vehicleId],
    references: [vehicles.id],
  }),
  deliveries: many(deliveries),
}));
