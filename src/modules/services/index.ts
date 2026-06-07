import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
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
      try {
        const result = await Services.getServices();

        return status(200, {
          status: "success",
          message: "Services Retrieved",
          messageKey: "service.retrieved",
          data: result,
        });
      } catch (error) {
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
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
    "/:id",
    async ({ params, status }) => {
      try {
        const service = await Services.getServiceById(params.id as string);

        return status(200, {
          status: "success",
          message: "Service Retrieved",
          messageKey: "service.retrieved",
          data: service,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "service.notFound",
            messageParams: { id: params.id },
            data: null,
          });
        }
        throw error;
      }
    },
    { auth: true }
  )
  .guard({
    isSuperAdmin: true,
  })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const newServiceId = await Services.addService(body);

        return status(201, {
          status: "success",
          message: "New Service Created",
          messageKey: "service.created",
          messageParams: { name: body.name },
          data: {
            id: newServiceId,
          },
        });
      } catch (error) {
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      parse: "multipart/form-data",
      body: "addService",
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await Services.updateService(id, body);

        return status(200, {
          status: "success",
          message: "Service updated",
          messageKey: "service.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "service.notFound",
            messageParams: { id },
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      parse: "application/json",
      body: "updateService",
    }
  )
  .patch(
    "/:id/image",
    async ({ params: { id }, body, status }) => {
      try {
        await Services.updateServiceImage(id, body);

        return status(200, {
          status: "success",
          message: "Service updated",
          messageKey: "service.image.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "service.notFound",
            messageParams: { id },
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "updateServiceImage",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await Services.deleteService(id as string);

      return status(200, {
        status: "success",
        message: "Service deleted",
        messageKey: "service.deleted",
        data: null,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "service.notFound",
          messageParams: { id },
          data: null,
        });
      }
      if (error instanceof ConflictError) {
        return status(409, {
          status: "error",
          message: error.message,
          messageKey: "service.inUse",
          messageParams: { id },
          data: null,
        });
      }
      if (error instanceof InternalError) {
        return status(500, {
          status: "error",
          message: error.message,
          messageKey: "common.unexpectedError",
          data: null,
        });
      }
      throw error;
    }
  });
