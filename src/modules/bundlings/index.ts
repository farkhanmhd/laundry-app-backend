import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { InternalError, NotFoundError } from "@/exceptions";
import { bundlingsModel } from "./model";
import { Bundlings } from "./service";

export const bundlingsController = new Elysia({ prefix: "/bundlings" })
  .use(bundlingsModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Bundlings"],
    },
  })
  .get(
    "/",
    async ({ status }) => {
      try {
        const result = await Bundlings.getBundlings();
        return status(200, {
          status: "success",
          message: "Bundlings Retrieved",
          messageKey: "bundling.retrieved",
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
        const bundling = await Bundlings.getBundlingById(params.id as string);

        return status(200, {
          status: "success",
          message: "Bundling Retrieved",
          messageKey: "bundling.retrieved",
          data: bundling,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "bundling.notFound",
            messageParams: { id: params.id },
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
      auth: true,
    }
  )
  .guard({
    isSuperAdmin: true,
  })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const bundlingId = await Bundlings.addBundling(body);
        return status(201, {
          status: "success",
          message: "New Bundling Created",
          messageKey: "bundling.created",
          messageParams: { name: body.name },
          data: {
            bundlingId,
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
      body: "addBundling",
      parse: "formdata",
      transform({ body }) {
        if (
          body &&
          typeof body === "object" &&
          "items" in body &&
          typeof body.items === "string"
        ) {
          body.items = JSON.parse(body.items);
        }

        if (
          body &&
          typeof body === "object" &&
          "price" in body &&
          typeof body.price === "string"
        ) {
          body.price = Number(body.price);
        }
      },
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await Bundlings.updateBundlingData(id, body);

        return status(200, {
          status: "success",
          message: "Bundling data Updated",
          messageKey: "bundling.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "bundling.notFound",
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
      body: "updateBundlingData",
      parse: "application/json",
    }
  )
  .patch(
    "/:id/items",
    async ({ params: { id }, body, status }) => {
      try {
        await Bundlings.updateBundlingItems(id, body);
        return status(200, {
          status: "success",
          message: "Bundling Items Updated.",
          messageKey: "bundling.items.updated",
          data: null,
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
      body: "updateBundlingItemBody",
      parse: "application/json",
    }
  )
  .patch(
    "/:id/image",
    async ({ params: { id }, body, status }) => {
      try {
        await Bundlings.updateBundlingImage(id, body);
        return status(200, {
          status: "success",
          message: "Bundling image updated",
          messageKey: "bundling.image.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "bundling.notFound",
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
      body: "updateBundlingImage",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await Bundlings.deleteBundlingById(id);
      return status(200, {
        status: "success",
        message: "Bundling deleted",
        messageKey: "bundling.deleted",
        data: null,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "bundling.notFound",
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
