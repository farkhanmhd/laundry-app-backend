import { Elysia, t } from "elysia";
import { orderItemSchema } from "../pos/model";

const requestPickupSchema = t.Object({
  items: t.Array(orderItemSchema),
  addressId: t.String(),
  points: t.Optional(t.Nullable(t.Number())),
});

export type RequestPickupSchema = typeof requestPickupSchema.static;

export const customerOrdersModel = new Elysia({
  name: "customer-orders/model",
}).model({ requestPickupSchema });
