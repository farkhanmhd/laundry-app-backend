import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { AuthorizationError, NotFoundError } from "@/exceptions";
import { deliveriesModel } from "./model";
import { DeliveriesService } from "./service";

export const deliveriesController = new Elysia({ prefix: "/deliveries" })
  .use(betterAuth)
  .use(deliveriesModel)
  .guard({
    tags: ["Deliveries"],
    auth: true,
  })
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const newRouteId = await DeliveriesService.createDeliveryRoute({
          deliveryIds: body.deliveryIds,
          driverId: body.driverId,
          vehicleId: body.vehicleId,
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
      isAdmin: true,
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
      isAdmin: true,
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
      isAdmin: true,
    }
  )
  .patch(
    "/:id/status",
    async ({ status, params, user, body }) => {
      const role = user.role ?? "user";
      if (role !== "superadmin" && role !== "driver") {
        throw new AuthorizationError();
      }

      try {
        const result = await DeliveriesService.updateDeliveryStatus(
          params.id,
          body.image
        );

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
      body: "updateDeliveryStatusSchema",
    }
  );
