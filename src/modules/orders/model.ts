import { Elysia, t } from "elysia";
import { searchQuery } from "@/search-query";

export const ordersQuery = t.Composite([
  searchQuery,
  t.Object({
    status: t.Optional(
      t.Array(
        t.Union([
          t.Literal("cancelled"),
          t.Literal("pending"),
          t.Literal("processing"),
          t.Literal("ready"),
          t.Literal("completed"),
        ])
      )
    ),
  }),
]);

export type OrdersQuery = typeof ordersQuery.static;

export const ordersModel = new Elysia({ name: "orders/model" }).model({
  ordersQuery,
});
