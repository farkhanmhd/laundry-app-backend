import { sleep } from "bun";
import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { deliveriesModel } from "./model";
import { DeliveriesService } from "./service";

export const deliveriesController = new Elysia({ prefix: "/deliveries" })
  .use(betterAuth)
  .use(deliveriesModel)
  .guard({
    tags: ["Deliveries"],
    isAdmin: true,
  })
  .post(
    "/",
    async ({ status, body, user }) => {
      const newRouteId = await DeliveriesService.createDeliveryRoute({
        orderIds: body.orderIds,
        userId: user.id,
      });

      await sleep(200);
      return status(201, {
        status: "success",
        message: "New pickup route created",
        data: {
          routeId: newRouteId,
        },
      });
    },
    {
      body: "createRouteSchema",
    }
  )
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
      query: "deliveriesSearchQuery",
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
      query: "deliveriesSearchQuery",
    }
  );
