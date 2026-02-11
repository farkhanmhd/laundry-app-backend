import { endOfDay, format, startOfMonth } from "date-fns";
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
    "/report/total-items",
    async ({ status }) => {
      const totalItems = await Inventories.getTotalItems();
      return status(200, {
        status: "success",
        message: "Total items retrieved",
        data: { totalItems },
      });
    },
    {
      auth: true,
    }
  )
  .get(
    "/report/low-stock",
    async ({ status }) => {
      const result = await Inventories.getLowStockItems();
      return status(200, {
        status: "success",
        message: "Low stock items retrieved",
        data: result,
      });
    },
    {
      auth: true,
    }
  )
  .get(
    "/report/usage",
    async ({ status, query }) => {
      let { from, to } = query;
      if (!from) {
        from = format(startOfMonth(new Date()), "dd-MM-yyyy");
      }
      if (!to) {
        to = format(endOfDay(new Date()), "dd-MM-yyyy");
      }
      const totalUsage = await Inventories.getTotalUsage(from, to);
      return status(200, {
        status: "success",
        message: "Total usage retrieved",
        data: { totalUsage, from, to },
      });
    },
    {
      query: "inventoryReportQuery",
      auth: true,
    }
  )
  .get(
    "/report/average-usage",
    async ({ status, query }) => {
      let { from, to } = query;
      if (!from) {
        from = format(startOfMonth(new Date()), "dd-MM-yyyy");
      }
      if (!to) {
        to = format(endOfDay(new Date()), "dd-MM-yyyy");
      }
      const totalUsage = await Inventories.getTotalUsage(from, to);
      const uniqueOrderCount = await Inventories.getUniqueOrderCount(from, to);
      const averageUsagePerOrder =
        uniqueOrderCount > 0 ? totalUsage / uniqueOrderCount : 0;
      return status(200, {
        status: "success",
        message: "Average usage per order retrieved",
        data: { averageUsagePerOrder, from, to },
      });
    },
    {
      query: "inventoryReportQuery",
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
  .get(
    "/history",
    async ({ status, query }) => {
      const result = await Inventories.getInventoryHistory(query);

      return status(200, {
        status: "success",
        message: "Inventory history retrieved",
        data: result,
      });
    },
    {
      query: "inventoryHistoryQuery",
    }
  )
  .get("/options", async ({ status }) => {
    const options = await Inventories.getInventoryOptions();
    return status(200, {
      status: "success",
      message: "Inventory options retrieved",
      data: options,
    });
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
        await Inventories.updateInventoryImage(id, body);
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
      await Inventories.adjustQuantity(user.id, id, body);
      return status(200, {
        status: "success",
        message: "Quantity Updated",
      });
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
