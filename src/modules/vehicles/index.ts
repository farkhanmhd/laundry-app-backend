import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { NotFoundError } from "@/exceptions";
import { searchQueryModel } from "@/search-query";
import { vehiclesModel } from "./model";
import { VehicleService } from "./service";

export const vehiclesController = new Elysia({ prefix: "/vehicles" })
  .use(betterAuth)
  .use(searchQueryModel)
  .use(vehiclesModel)
  .guard({
    detail: {
      tags: ["Vehicles"],
    },
  })
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const result = await VehicleService.getVehicle(id);
        return status(200, {
          status: "success",
          message: "Vehicle retrieved",
          messageKey: "vehicle.retrieved",
          data: result,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "vehicle.notFound",
            messageParams: { id },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      auth: true,
    }
  )
  .get(
    "/",
    async ({ status, query }) => {
      const result = await VehicleService.getVehicles(query);
      return status(200, {
        status: "success",
        message: "Vehicles retrieved",
        messageKey: "vehicle.retrieved",
        data: result,
      });
    },
    {
      query: "searchQuery",
      auth: true,
    }
  )
  .post(
    "/",
    async ({ status, body }) => {
      const vehicle = await VehicleService.createVehicle(body);
      return status(201, {
        status: "success",
        message: "Vehicle created",
        messageKey: "vehicle.created",
        data: vehicle,
      });
    },
    {
      body: "createVehicleSchema",
      isSuperAdmin: true,
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await VehicleService.updateVehicle(id, body);
        return status(200, {
          status: "success",
          message: "Vehicle updated",
          messageKey: "vehicle.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "vehicle.notFound",
            messageParams: { id },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "updateVehicleSchema",
      isSuperAdmin: true,
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        await VehicleService.deleteVehicle(id);
        return status(200, {
          status: "success",
          message: "Vehicle deleted",
          messageKey: "vehicle.deleted",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "vehicle.notFound",
            messageParams: { id },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      isSuperAdmin: true,
    }
  );
