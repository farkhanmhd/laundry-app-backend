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

export const posModel = new Elysia({ name: "pos/model" }).model({
  posItem,
});
