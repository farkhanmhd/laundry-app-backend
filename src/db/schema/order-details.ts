import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { orders } from "./orders";
import { products } from "./products";
import { services } from "./services";

export const orderDetails = pgTable("order_details", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `od-${nanoid(5)}`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  serviceId: varchar("service_id").references(() => services.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const orderDetailsRelations = relations(orderDetails, ({ one }) => ({
  order: one(orders, {
    fields: [orderDetails.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [orderDetails.serviceId],
    references: [services.id],
  }),
  product: one(products, {
    fields: [orderDetails.productId],
    references: [products.id],
  }),
}));
