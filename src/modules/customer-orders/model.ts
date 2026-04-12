import { Elysia, t } from "elysia";
import { orderItemSchema } from "../pos/model";

const requestPickupSchema = t.Object({
  items: t.Array(orderItemSchema),
  addressId: t.String(),
  points: t.Optional(t.Nullable(t.Number())),
});

const requestDeliverySchema = t.Object({
  addressId: t.String(),
  orderId: t.String(),
});

export type RequestPickupSchema = typeof requestPickupSchema.static;
export type RequestDeliverySchema = typeof requestDeliverySchema.static;

export const customerOrdersModel = new Elysia({
  name: "customer-orders/model",
}).model({ requestPickupSchema, requestDeliverySchema });
