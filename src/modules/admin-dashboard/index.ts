import { sleep } from "bun";
import { endOfDay, format, startOfMonth } from "date-fns";
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
  )
  .get(
    "/metrics",
    async ({ query, status }) => {
      let { from, to } = query as { from?: string; to?: string };

      if (!from) {
        from = format(startOfMonth(new Date()), "dd-MM-yyyy");
      }
      if (!to) {
        to = format(endOfDay(new Date()), "dd-MM-yyyy");
      }

      const data = await AdminDashboardService.getDashboardMetrics(from, to);
      return status(200, {
        status: "success",
        message: "Dashboard metrics retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  );
