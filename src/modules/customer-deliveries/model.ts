import { Elysia, t } from "elysia";

const deliveryListItem = t.Object({
  id: t.String(),
  orderId: t.String(),
  type: t.Union([t.Literal("pickup"), t.Literal("delivery")]),
  status: t.Union([
    t.Literal("requested"),
    t.Literal("in_progress"),
    t.Literal("picked_up"),
    t.Literal("completed"),
    t.Literal("cancelled"),
  ]),
  address: t.String(),
  date: t.String(),
});

const deliveryDetail = t.Object({
  id: t.String(),
  type: t.Union([t.Literal("pickup"), t.Literal("delivery")]),
  status: t.Union([
    t.Literal("requested"),
    t.Literal("in_progress"),
    t.Literal("picked_up"),
    t.Literal("completed"),
    t.Literal("cancelled"),
  ]),
  notes: t.Nullable(t.String()),
  requestedAt: t.String(),
  completedAt: t.Nullable(t.String()),
  orderId: t.String(),
  addressLabel: t.Nullable(t.String()),
  address: t.String(),
  addressNotes: t.Nullable(t.String()),
  latitude: t.Nullable(t.String()),
  longitude: t.Nullable(t.String()),
});

export type DeliveryListItem = typeof deliveryListItem.static;
export type DeliveryDetail = typeof deliveryDetail.static;

export const customerDeliveriesModel = new Elysia({
  name: "customer-deliveries/model",
}).model({
  deliveryListItem,
  deliveryDetail,
});
