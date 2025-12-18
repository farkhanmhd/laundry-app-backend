import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { servicesModel } from "./model";
import { Services } from "./service";

export const servicesController = new Elysia({ prefix: "/services" })
  .use(servicesModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Service"],
    },
  })
  .get(
    "/",
    async ({ status }) => {
      const result = await Services.getServices();

      return status(200, {
        status: "success",
        message: "Services Retrieved",
        data: result,
      });
    },
    {
      auth: true,
    }
  )
  .get(
    "/:id",
    async ({ params, status }) => {
      const service = await Services.getServiceById(params.id as string);
      return status(200, {
        status: "success",
        message: "Service Retrieved",
        data: service,
      });
    },
    { auth: true }
  )
  .guard({
    isSuperAdmin: true,
  })
  .post(
    "/",
    async ({ body, status }) => {
      const newServiceId = await Services.addService(body);

      return status(201, {
        status: "success",
        message: "New Service Created",
        data: {
          id: newServiceId,
        },
      });
    },
    {
      parse: "multipart/form-data",
      body: "addService",
      response: {
        201: "addServiceResponse",
      },
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      await Services.updateService(id, body);

      return status(200, {
        status: "success",
        message: "Service updated",
      });
    },
    {
      parse: "application/json",
      body: "updateService",
    }
  )
  .patch(
    "/:id/image",
    async ({ params: { id }, body, status }) => {
      await Services.updateServiceImage(id, body);

      return status(200, {
        status: "success",
        message: "Service updated",
      });
    },
    {
      body: "updateServiceImage",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    await Services.deleteService(id as string);

    return status(200, {
      status: "success",
      message: "Service deleted",
    });
  });
