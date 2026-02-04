import { Elysia, t } from "elysia";
import { models } from "@/db/models";

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

const orderItemSchema = t.Omit(t.Object(models.insert.orderItems), [
  "orderId",
  "id",
  "subtotal",
]);

export type OrderItem = typeof orderItemSchema.static;

const newPosOrderBaseSchema = t.Object({
  customerName: t.String({
    minLength: 2,
    error: "Minimum 2 character for customer name",
  }),
  items: t.Array(orderItemSchema),
  memberId: t.Optional(t.Nullable(t.String())),
  newMember: t.Optional(t.Nullable(t.Boolean())),
  phone: t.Optional(t.Nullable(t.String())),
  points: t.Optional(t.Nullable(t.Number())),
});

const newPosOrderSchema = t.Union([
  t.Composite([
    newPosOrderBaseSchema,
    t.Object({
      paymentType: t.Literal("cash"),
      amountPaid: t.Integer({ minimum: 0 }),
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
