import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { DriverDashboardService } from "./service";

export const driverDashboardController = new Elysia({
  prefix: "/driver-dashboard",
})
  .use(betterAuth)
  .guard({
    tags: ["Driver Dashboard"],
    isDriver: true,
  })
  .get("/metrics", async ({ status, user }) => {
    const data = await DriverDashboardService.getMetrics(user.id);
    return status(200, {
      status: "success",
      message: "Driver metrics retrieved successfully",
      data,
    });
  })
  .get("/active-route", async ({ status, user }) => {
    const data = await DriverDashboardService.getActiveRoute(user.id);
    return status(200, {
      status: "success",
      message: "Active route retrieved successfully",
      data,
    });
  })
  .get("/recent-deliveries", async ({ status, user }) => {
    const data = await DriverDashboardService.getRecentDeliveries(user.id, 5);
    return status(200, {
      status: "success",
      message: "Recent deliveries retrieved successfully",
      data,
    });
  })
  .get("/delivery-status", async ({ status, user }) => {
    const data = await DriverDashboardService.getDeliveryStatusDistribution(
      user.id
    );
    return status(200, {
      status: "success",
      message: "Delivery status distribution retrieved successfully",
      data,
    });
  });
