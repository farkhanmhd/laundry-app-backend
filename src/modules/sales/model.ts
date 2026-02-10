import { Elysia, t } from "elysia";
import { succesResponse } from "@/responses";
import { searchQuery } from "@/search-query";

// 1. Date Range Query Schema (Updated keys)
const dateRangeQuery = t.Object({
  from: t.String({
    pattern: "^\\d{2}-\\d{2}-\\d{4}$", // Regex: only allows "20-01-2026" format
    error: "Date must be in dd-MM-yyyy format", // Custom error message
  }),
  to: t.String({
    pattern: "^\\d{2}-\\d{2}-\\d{4}$",
    error: "Date must be in dd-MM-yyyy format",
  }),
});

const bestSellersQuery = t.Composite([
  dateRangeQuery,
  searchQuery,
  t.Object({
    item_id: t.Optional(t.Union([t.String(), t.Array(t.String())])),
    item_type: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  }),
]);

const salesByOrderQuery = t.Composite([
  dateRangeQuery,
  searchQuery,
  t.Object({
    payment_type: t.Optional(
      t.Union([
        t.String({
          enum: ["cash", "qris"],
        }),
        t.Array(
          t.String({
            enum: ["cash", "qris"],
          })
        ),
        t.Null(),
      ])
    ),
  }),
]);

export type GetSalesByOrderParams = typeof salesByOrderQuery.static;
export type GetBestSellerParams = typeof bestSellersQuery.static;

// 2. Individual Response Schemas
const netRevenueResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      value: t.Number(),
      currency: t.String({ default: "IDR" }),
    }),
  }),
]);

const grossRevenueResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      value: t.Number(),
      currency: t.String({ default: "IDR" }),
    }),
  }),
]);

const transactionCountResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      count: t.Number(),
    }),
  }),
]);

const avgOrderValueResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      value: t.Number(),
      currency: t.String({ default: "IDR" }),
    }),
  }),
]);

// 3. Consolidated Response Schema
const scorecardDataResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      netRevenue: t.Number(),
      grossRevenue: t.Number(),
      transactionCount: t.Number(),
      avgOrderValue: t.Number(),
    }),
  }),
]);

const chartPoint = t.Object({
  date: t.String(), // "20-01-2026"
  net: t.Number(),
  discount: t.Number(),
  gross: t.Number(),
});

// 2. Define the response (Array of points)
const chartDataResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Array(chartPoint),
  }),
]);

const bestSellerItem = t.Object({
  id: t.String(),
  itemName: t.String(),
  itemType: t.String(),
  price: t.Number(),
  totalUnitsSold: t.Number(),
  transactionCount: t.Number(),
  totalRevenue: t.Number(),
});

// 4. Response Schema
const bestSellersResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      items: t.Array(bestSellerItem), // Renamed to 'items' for clarity inside data
      meta: t.Object({
        total: t.Number(),
        page: t.Number(),
        rows: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  }),
]);

export const salesModel = new Elysia({ name: "sales/model" }).model({
  dateRangeQuery,
  netRevenueResponse,
  grossRevenueResponse,
  transactionCountResponse,
  avgOrderValueResponse,
  scorecardDataResponse,
  chartDataResponse,
  bestSellersQuery,
  bestSellersResponse,
  salesByOrderQuery,
});

export type DateRangeQuery = typeof dateRangeQuery.static;
