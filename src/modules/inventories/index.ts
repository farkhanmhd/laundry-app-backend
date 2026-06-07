import { endOfDay, format, startOfMonth } from "date-fns";
import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
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
          messageKey: "inventory.retrieved",
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
    "/report/total-items",
    async ({ status }) => {
      try {
        const totalItems = await Inventories.getTotalItems();
        return status(200, {
          status: "success",
          message: "Total items retrieved",
          messageKey: "inventory.report.totalItems",
          data: { totalItems },
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
    "/report/low-stock",
    async ({ status }) => {
      try {
        const result = await Inventories.getLowStockItems();
        return status(200, {
          status: "success",
          message: "Low stock items retrieved",
          messageKey: "inventory.report.lowStock",
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
    "/report/usage",
    async ({ status, query }) => {
      try {
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
          messageKey: "inventory.report.usage",
          data: { totalUsage, from, to },
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
      query: "inventoryReportQuery",
      auth: true,
    }
  )
  .get(
    "/report/average-usage",
    async ({ status, query }) => {
      try {
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
          messageKey: "inventory.report.averageUsage",
          data: { averageUsagePerOrder, from, to },
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
      query: "inventoryReportQuery",
      auth: true,
    }
  )
  .get(
    "/:id",
    async ({ params, status }) => {
      try {
        const inventory = await Inventories.getInventoryById(params.id as string);
        return status(200, {
          status: "success",
          message: "Inventory Retrieved",
          messageKey: "inventory.retrieved",
          data: inventory,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "inventory.notFound",
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
  .get(
    "/adjustments",
    async ({ status, query }) => {
      try {
        const result = await Inventories.getAdjustmentHistory(query);
        return status(200, {
          status: "success",
          message: "Inventory history retrieved",
          messageKey: "inventory.adjustments.retrieved",
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
      query: "inventoryHistoryQuery",
    }
  )
  .get(
    "/usage",
    async ({ status, query }) => {
      try {
        const result = await Inventories.getUsageHistory(query);
        return status(200, {
          status: "success",
          message: "Usage history retrieved",
          messageKey: "inventory.usage.retrieved",
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
      query: "inventoryHistoryQuery",
    }
  )
  .get(
    "/restock-history",
    async ({ status, query }) => {
      try {
        const result = await Inventories.getRestockHistory(query);
        return status(200, {
          status: "success",
          message: "Restock history retrieved",
          messageKey: "inventory.restockHistory.retrieved",
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
      query: "inventoryHistoryQuery",
    }
  )
  .get("/options", async ({ status }) => {
    try {
      const options = await Inventories.getInventoryOptions();
      return status(200, {
        status: "success",
        message: "Inventory options retrieved",
        messageKey: "inventory.options.retrieved",
        data: options,
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
  })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const inventory = await Inventories.addInventory(body);
        return status(201, {
          status: "success",
          message: "New inventory Created",
          messageKey: "inventory.created",
          messageParams: { name: body.name },
          data: inventory,
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
          messageKey: "inventory.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Inventory not found",
            messageKey: "inventory.notFound",
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
          message: "Inventory updated",
          messageKey: "inventory.image.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Inventory not found",
            messageKey: "inventory.notFound",
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
      body: "updateInventoryImage",
    }
  )
  .patch(
    "/:id/stock",
    async ({ params: { id }, status, body, user }) => {
      try {
        await Inventories.adjustQuantity(user.id, id, body);
        return status(200, {
          status: "success",
          message: "Quantity Updated",
          messageKey: "inventory.stock.adjusted",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "inventory.notFound",
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
      body: "adjustQuantity",
    }
  )
  .post(
    "/:id/restock",
    async ({ params: { id }, status, body, user }) => {
      try {
        await Inventories.restockInventory(user.id, id, body);
        return status(200, {
          status: "success",
          message: "Inventory restocked successfully",
          messageKey: "inventory.restocked",
          messageParams: { id },
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "inventory.notFound",
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
      body: "restockQuantity",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await Inventories.deleteInventory(id as string);
      return status(200, {
        status: "success",
        message: "Inventory deleted",
        messageKey: "inventory.deleted",
        messageParams: { id },
        data: null,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "inventory.notFound",
          messageParams: { id },
          data: null,
        });
      }
      if (error instanceof ConflictError) {
        return status(409, {
          status: "error",
          message: error.message,
          messageKey: "inventory.inUse",
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
