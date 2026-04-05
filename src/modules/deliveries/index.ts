import { randomUUIDv7, sleep } from "bun";
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
  .post("/pickups", async ({ status }) => {
    await sleep(200);
    return status(201, {
      status: "success",
      message: "New pickup route created",
      data: {
        routeId: randomUUIDv7(),
      },
    });
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
