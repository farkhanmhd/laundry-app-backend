import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { CustomerDashboardService } from "./service";

export const customerDashboardController = new Elysia({
  prefix: "/customer-dashboard",
})
  .use(betterAuth)
  .guard({
    tags: ["Customer Dashboard"],
    isCustomer: true,
  })
  .get("/customer", async ({ status, user }) => {
    const data = await CustomerDashboardService.getCustomerInfo(user.id);
    return status(200, {
      status: "success",
      message: "Customer info retrieved successfully",
      data,
    });
  })
  .get("/orders", async ({ status, user }) => {
    const data = await CustomerDashboardService.getLatestOrders(user.id, 3);
    return status(200, {
      status: 200,
      message: "Dashboard orders retrieved successfully",
      data,
    });
  })
  .get("/deliveries", async ({ status, user }) => {
    const data = await CustomerDashboardService.getLatestDeliveries(user.id, 3);
    return status(200, {
      status: "success",
      message: "Dashboard deliveries retrieved successfully",
      data,
    });
  })
  .get("/vouchers", async ({ status }) => {
    const result = await CustomerDashboardService.getVisibleVouchers(3);
    return status(200, {
      status: "success",
      message: "Available vouchers retrieved",
      data: result,
    });
  });
