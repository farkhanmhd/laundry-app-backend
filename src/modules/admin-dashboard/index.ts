import { sleep } from "bun";
import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { AdminDashboardService } from "./service";

export const adminDashboardController = new Elysia({
  prefix: "/admin-dashboard",
})
  .use(betterAuth)
  .guard({
    tags: ["Admin Dashboard"],
  })
  .get(
    "/orders",
    async ({ status }) => {
      const data = await AdminDashboardService.getLatestOrders(10);
      return status(200, {
        status: "success",
        message: "Latest orders retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/low-stock",
    async ({ status }) => {
      await sleep(3000);
      const data = await AdminDashboardService.getLowStockItems();
      return status(200, {
        status: "success",
        message: "Low stock items retrieved successfully",
        data,
      });
    },
    {
      isSuperAdmin: true,
    }
  );
