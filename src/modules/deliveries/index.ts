import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { DeliveriesService } from "./service";

export const deliveriesController = new Elysia({ prefix: "/deliveries" })
  .use(betterAuth)
  .guard({
    tags: ["Deliveries"],
    isAdmin: true,
  })
  .get(
    "/pickups",
    async ({ status, query }) => {
      const { data, totalData, totalPages } =
        await DeliveriesService.getPickups(
          query.search,
          query.rows,
          query.page,
          query.status
        );

      return status(200, {
        status: "success",
        message: "Pickups retrieved successfully",
        data,
        totalData,
        totalPages,
      });
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        rows: t.Optional(t.Number()),
        page: t.Optional(t.Number()),
        status: t.Optional(
          t.Union([
            t.Literal("requested"),
            t.Literal("assigned"),
            t.Literal("in_progress"),
            t.Literal("completed"),
            t.Literal("cancelled"),
          ])
        ),
      }),
    }
  )
  .get(
    "/deliveries",
    async ({ status, query }) => {
      const { data, totalData, totalPages } =
        await DeliveriesService.getDeliveries(
          query.search,
          query.rows,
          query.page,
          query.status
        );

      return status(200, {
        status: "success",
        message: "Deliveries retrieved successfully",
        data,
        totalData,
        totalPages,
      });
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        rows: t.Optional(t.Number()),
        page: t.Optional(t.Number()),
        status: t.Optional(
          t.Union([
            t.Literal("requested"),
            t.Literal("assigned"),
            t.Literal("in_progress"),
            t.Literal("completed"),
            t.Literal("cancelled"),
          ])
        ),
      }),
    }
  );
