import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
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
          data: result,
        });
      } catch {
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
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
          data: bundling,
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "Inventory not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
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
      const bundlingId = await Bundlings.addBundling(body);
      return status(201, {
        status: "success",
        message: "New Bundling Created",
        data: {
          bundlingId,
        },
      });
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
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "Inventory not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
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
      await Bundlings.updateBundlingItems(id, body);
      return status(200, {
        status: "success",
        message: "Bundling Items Updated.",
        data: {
          id,
          body,
        },
      });
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
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "inventory not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      body: "updateBundlingImage",
    }
  );
