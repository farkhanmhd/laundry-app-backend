import { endOfDay, format, startOfMonth } from "date-fns";
import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { membersModel } from "./model";
import { Members } from "./service";

export const membersController = new Elysia({ prefix: "/members" })
  .use(betterAuth)
  .use(membersModel)
  .use(searchQueryModel)
  .guard({
    detail: {
      tags: ["Member"],
    },
    isAdmin: true,
  })
  .get(
    "/",
    async ({ status, query }) => {
      const result = await Members.getMembers(query);

      return status(200, {
        status: "success",
        message: "Members Retrieved",
        data: result,
      });
    },
    {
      isAdmin: true,
      query: "searchQuery",
    }
  )
  .post(
    "/",
    async ({ body, status }) => {
      const newMemberId = await Members.addMember(body);

      return status(201, {
        status: "success",
        message: "New Member Added",
        data: {
          id: newMemberId,
        },
      });
    },
    {
      isAdmin: true,
      body: "addMember",
      parse: "application/json",
    }
  )
  .get(
    "/reports/total-customers",
    async ({ status }) => {
      const totalCustomers = await Members.getTotalCustomers();
      return status(200, {
        status: "success",
        message: "Total customers retrieved successfully",
        data: {
          totalCustomers,
        },
      });
    },
    {
      detail: {
        description: "Get total count of all customers",
      },
      isSuperAdmin: true,
    }
  )
  .get(
    "/reports/average-order-value",
    async ({ query, status }) => {
      let { from, to } = query;

      // Set default values if not provided
      if (!from) {
        from = format(startOfMonth(new Date()), "dd-MM-yyyy");
      }
      if (!to) {
        to = format(endOfDay(new Date()), "dd-MM-yyyy");
      }

      const averageOrderValue = await Members.getAverageOrderValue(from, to);
      return status(200, {
        status: "success",
        message: "Average customer order retrieved successfully",
        data: {
          averageOrderValue,
        },
      });
    },
    {
      detail: {
        description: "Get average amount spent per order",
      },
      isSuperAdmin: true,
      query: "dateRangeQuery",
    }
  )
  .get(
    "/reports/active-members",
    async ({ query, status }) => {
      let { from, to } = query;

      // Set default values if not provided
      if (!from) {
        from = format(startOfMonth(new Date()), "dd-MM-yyyy");
      }
      if (!to) {
        to = format(endOfDay(new Date()), "dd-MM-yyyy");
      }

      const activeMembers = await Members.getActiveMembers(from, to);
      return status(200, {
        status: "success",
        message: "Active members retrieved successfully",
        data: {
          activeMembers,
        },
      });
    },
    {
      detail: {
        description: "Get count of active members within date range",
      },
      isSuperAdmin: true,
      query: "dateRangeQuery",
    }
  )
  .get(
    "/reports/total-member-orders",
    async ({ query, status }) => {
      let { from, to } = query;

      // Set default values if not provided
      if (!from) {
        from = format(startOfMonth(new Date()), "dd-MM-yyyy");
      }
      if (!to) {
        to = format(endOfDay(new Date()), "dd-MM-yyyy");
      }

      const totalMemberOrders = await Members.getTotalMemberOrders(from, to);
      return status(200, {
        status: "success",
        message: "Total member orders retrieved successfully",
        data: {
          totalMemberOrders,
        },
      });
    },
    {
      detail: {
        description: "Get total number of member orders within date range",
      },
      isSuperAdmin: true,
      query: "dateRangeQuery",
    }
  )
  .get(
    "/reports/members-spending",
    async ({ query, status }) => {
      const membersWithSpending = await Members.getMembersWithSpending(query);

      return status(200, {
        status: "success",
        message: "Members spending data retrieved successfully",
        data: membersWithSpending,
      });
    },
    {
      detail: {
        description:
          "Get members with spending statistics (total spending, order count, average spending)",
      },
      isSuperAdmin: true,
      query: "searchQuery",
    }
  );
