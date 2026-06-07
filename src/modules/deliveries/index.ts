import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { deliveriesModel } from "./model";
import { DeliveriesService } from "./service";
import { NotFoundError } from "@/exceptions";

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
      try {
        const newRouteId = await DeliveriesService.createDeliveryRoute({
          deliveryIds: body.deliveryIds,
          userId: user.id,
        });

        return status(201, {
          status: "success",
          message: "New pickup route created",
          messageKey: "delivery.route.created",
          data: {
            routeId: newRouteId,
          },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Some deliveries could not be found",
            messageKey: "delivery.route.createNotFound",
          });
        }
        throw error;
      }
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
        messageKey: "delivery.pickups.retrieved",
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
        messageKey: "delivery.deliveries.retrieved",
        data,
        totalData,
        totalPages,
      });
    },
    {
      query: "deliveriesSearchQuery",
    }
  )
  .patch(
    "/:id/status",
    async ({ status, params }) => {
      try {
        const result = await DeliveriesService.updateDeliveryStatus(params.id);

        return status(200, {
          status: "success",
          message: "Delivery status updated",
          messageKey: "delivery.status.updated",
          data: result,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Delivery not found",
            messageKey: "delivery.notFound",
          });
        }
        throw error;
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
