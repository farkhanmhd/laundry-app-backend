import { Elysia, t } from "elysia";

export const deliveriesSearchQuery = t.Object({
  search: t.Optional(t.String()),
  rows: t.Optional(t.Number()),
  page: t.Optional(t.Number()),
  status: t.Optional(
    t.Array(
      t.Union([
        t.Literal("requested"),
        t.Literal("picked_up"),
        t.Literal("in_progress"),
        t.Literal("completed"),
        t.Literal("cancelled"),
      ])
    )
  ),
});

export const createRouteSchema = t.Object({
  deliveryIds: t.Array(
    t.String({ minLength: 1, error: "Order ID(s) Cannot be empty" })
  ),
  driverId: t.String(),
  assetId: t.String(),
});

export const updateDeliveryStatusSchema = t.Object({
  image: t.File({
    type: "image/*",
    maxSize: "5m",
  }),
});

export type DeliveriesQuery = typeof deliveriesSearchQuery.static;

export const deliveriesModel = new Elysia({ name: "deliveries/model" }).model({
  deliveriesSearchQuery,
  createRouteSchema,
  updateDeliveryStatusSchema,
});
