import { Elysia, t } from "elysia";
import { orderItemSchema } from "../pos/model";

const requestPickupSchema = t.Object({
  items: t.Array(orderItemSchema),
  addressId: t.String(),
  points: t.Optional(t.Nullable(t.Number())),
  requestTime: t.String(),
  weightRangeId: t.Number(),
  weight: t.Optional(t.Nullable(t.Number())),
});

const requestDeliverySchema = t.Object({
  addressId: t.String(),
  orderId: t.String(),
  requestTime: t.String(),
});

const updateOrderItemSchema = t.Object({
  itemId: t.String(),
  itemType: t.Union([
    t.Literal("service"),
    t.Literal("inventory"),
    t.Literal("bundling"),
  ]),
  quantity: t.Integer({ minimum: 1 }),
});

const updateOrderItemsSchema = t.Object({
  data: t.Array(updateOrderItemSchema),
  weightRangeId: t.Number(),
  weight: t.Optional(t.Nullable(t.Number())),
});

export type PickupItem = typeof orderItemSchema.static;
export type RequestPickupSchema = typeof requestPickupSchema.static;
export type RequestDeliverySchema = typeof requestDeliverySchema.static;
export type UpdateOrderItem = typeof updateOrderItemSchema.static;
export type UpdateOrderItemsBody = typeof updateOrderItemsSchema.static;

export const customerOrdersModel = new Elysia({
  name: "customer-orders/model",
}).model({
  requestPickupSchema,
  requestDeliverySchema,
  updateOrderItemsSchema,
});
