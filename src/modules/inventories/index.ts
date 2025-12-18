import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { inventoriesModel } from "./model";
import { Inventories } from "./service";

export const inventoriesController = new Elysia({ prefix: "/inventories" })
  .use(inventoriesModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Inventory"],
    },
  })
  .get(
    "/",
    async ({ status }) => {
      try {
        const result = await Inventories.getInventories();
        return status(200, {
          status: "success",
          message: "Inventories Retrieved",
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
      const inventory = await Inventories.getInventoryById(params.id as string);
      return status(200, {
        status: "success",
        message: "Inventory Retrieved",
        data: inventory,
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
      try {
        const inventory = await Inventories.addInventory(body);
        return status(201, {
          status: "success",
          message: "New inventory Created",
          data: inventory,
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "InternalError"
        ) {
          return status(400, {
            status: "error",
            message: "Failed to create inventory",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      parse: "multipart/form-data",
      body: "addInventory",
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await Inventories.updateInventory(id, body);
        return status(200, {
          status: "success",
          message: "Inventory Updated",
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
      body: "updateInventory",
      parse: "application/json",
    }
  )
  .patch(
    "/:id/image",
    async ({ params: { id }, body, status }) => {
      try {
        await Inventories.updateInventoryImage(id as string, body);
        return status(200, {
          status: "success",
          message: "inventory updated",
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
      body: "updateInventoryImage",
    }
  )
  .patch(
    "/:id/stock",
    async ({ params: { id }, status, body, user }) => {
      try {
        await Inventories.adjustQuantity(user.id, id as string, body);
        return status(200, {
          status: "success",
          message: "Quantity Updated",
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
      parse: "application/json",
      body: "adjustQuantity",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await Inventories.deleteInventory(id as string);
      return status(200, {
        status: "success",
        message: "Inventory deleted",
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
  });
