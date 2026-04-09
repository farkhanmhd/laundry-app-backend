import { sleep } from "bun";
import { endOfDay, format, startOfMonth } from "date-fns";
import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { AdminDashboardService } from "./service";

export type {
  BundlingStatsItem,
  InventoryUsageItem,
  OrderStatusData,
  TopServiceItem,
} from "./service";

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
  )
  .get(
    "/order-status",
    async ({ query, status }) => {
      const { from, to } = query as { from?: string; to?: string };

      const data = await AdminDashboardService.getOrderStatusData(from, to);
      return status(200, {
        status: "success",
        message: "Order status data retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/top-services",
    async ({ query, status }) => {
      const { from, to } = query as { from?: string; to?: string };

      const data = await AdminDashboardService.fetchTopServices(from, to);
      return status(200, {
        status: "success",
        message: "Top services retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/inventory-usage",
    async ({ query, status }) => {
      const { from, to } = query as { from?: string; to?: string };

      const data = await AdminDashboardService.fetchInventoryUsage(from, to);
      return status(200, {
        status: "success",
        message: "Inventory usage retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/bundling-stats",
    async ({ query, status }) => {
      const { from, to } = query as { from?: string; to?: string };

      const data = await AdminDashboardService.fetchBundlingStats(from, to);
      return status(200, {
        status: "success",
        message: "Bundling stats retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/operational-metrics",
    async ({ status }) => {
      const data = await AdminDashboardService.getOperationalMetrics();
      return status(200, {
        status: "success",
        message: "Operational metrics retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/recent-pickups",
    async ({ status }) => {
      const data = await AdminDashboardService.getRecentPickups(3);
      return status(200, {
        status: "success",
        message: "Recent pickups retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/recent-deliveries",
    async ({ status }) => {
      const data = await AdminDashboardService.getRecentDeliveries(3);
      return status(200, {
        status: "success",
        message: "Recent deliveries retrieved successfully",
        data,
      });
    },
    {
      isAdmin: true,
    }
  );
