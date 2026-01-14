import { Elysia, t } from "elysia";

const posItem = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  price: t.Number(),
  image: t.Nullable(t.String()),
  stock: t.Nullable(t.Number()),
  itemType: t.String(),
});

export type PosItem = typeof posItem.static;

const orderItemSchema = t.Object({
  itemType: t.UnionEnum(["service", "inventory", "bundling", "voucher"]),
  serviceId: t.Optional(t.Nullable(t.String())),
  inventoryId: t.Optional(t.Nullable(t.String())),
  bundlingId: t.Optional(t.Nullable(t.String())),
  voucherId: t.Optional(t.Nullable(t.String())),
  note: t.Optional(t.Nullable(t.String())),
  quantity: t.Integer({ minimum: 1 }),
});

export type OrderItem = typeof orderItemSchema.static;

const newPosOrderBaseSchema = t.Object({
  customerName: t.String({
    minLength: 2,
    error: "Minimum 2 character for customer name",
  }),
  items: t.Array(orderItemSchema),
  memberId: t.Optional(t.Nullable(t.String())),
});

const newPosOrderSchema = t.Union([
  t.Composite([
    newPosOrderBaseSchema,
    t.Object({
      paymentType: t.Literal("cash"),
      amountPaid: t.Integer({ minimum: 1 }),
    }),
  ]),
  t.Composite([
    newPosOrderBaseSchema,
    t.Object({
      paymentType: t.Literal("qris"),
    }),
  ]),
]);

export type NewPosOrderSchema = typeof newPosOrderSchema.static;

export const posModel = new Elysia({ name: "pos/model" }).model({
  posItem,
  newPosOrderSchema,
});
