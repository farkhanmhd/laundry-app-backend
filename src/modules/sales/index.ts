import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { salesModel } from "./model";
import { SalesService } from "./service";

export const salesController = new Elysia({ prefix: "/sales" })
  .use(salesModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Sales Analytics"],
    },
    isSuperAdmin: true,
  })
  .get(
    "/net-revenue",
    async ({ query: { from, to }, status }) => {
      const value = await SalesService.getNetRevenue(from, to);
      return status(200, {
        status: "success",
        message: "Net revenue calculated",
        data: { value, currency: "IDR" },
      });
    },
    {
      query: "dateRangeQuery",
    }
  )
  .get(
    "/gross-revenue",
    async ({ query: { from, to }, status }) => {
      const value = await SalesService.getGrossRevenue(from, to);
      return status(200, {
        status: "success",
        message: "Gross revenue calculated",
        data: { value, currency: "IDR" },
      });
    },
    {
      query: "dateRangeQuery",
    }
  )
  .get(
    "/count",
    async ({ query: { from, to }, status }) => {
      const count = await SalesService.getTotalTransactions(from, to);
      return status(200, {
        status: "success",
        message: "Transaction count retrieved",
        data: { count },
      });
    },
    {
      query: "dateRangeQuery",
    }
  )
  .get(
    "/average-value",
    async ({ query: { from, to }, status }) => {
      const value = await SalesService.getAverageOrderValue(from, to);
      return status(200, {
        status: "success",
        message: "Average order value calculated",
        data: { value, currency: "IDR" },
      });
    },
    {
      query: "dateRangeQuery",
    }
  )
  .get(
    "/scorecard",
    async ({ query: { from, to }, status }) => {
      const data = await SalesService.getScorecardData(from, to);
      return status(200, {
        status: "success",
        message: "Scorecard data retrieved",
        data,
      });
    },
    {
      query: "dateRangeQuery",
    }
  )
  .get(
    "/chart",
    async ({ query: { from, to }, status }) => {
      const data = await SalesService.getChartData(from, to);
      return status(200, {
        status: "success",
        message: "Chart data retrieved",
        data,
      });
    },
    {
      query: "dateRangeQuery",
    }
  )
  .get(
    "/best-sellers",
    async ({ query, status }) => {
      const page = query.page ?? 1;
      const rows = query.rows ?? 50;
      const { from, to, search, item_id, item_type } = query;

      // Pass as a single object now
      const result = await SalesService.getBestSellers({
        from,
        to,
        page,
        rows,
        search,
        item_id,
        item_type,
      });

      return status(200, {
        status: "success",
        message: "Best sellers retrieved",
        data: result,
      });
    },
    {
      query: "bestSellersQuery",
    }
  )
  .get(
    "/item-options",
    async ({ status }) => {
      const data = await SalesService.getOrderItemOptions();
      return status(200, {
        status: "success",
        message: "Order item options retrieved",
        data,
      });
    },
    {
      detail: {
        description: "Retrieves a list of order item options (id and name).",
      },
    }
  )
  .get(
    "/by-orders",
    async ({ query, status }) => {
      const { from, to, payment_type } = query;
      const page = query.page ?? 1;
      const rows = query.rows ?? 10;

      const result = await SalesService.getSalesByOrder({
        from,
        to,
        payment_type,
        page,
        rows,
      });

      return status(200, {
        status: "success",
        message: "Sales data by order retrieved",
        data: result,
      });
    },
    {
      query: "salesByOrderQuery",
    }
  );
