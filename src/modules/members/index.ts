import { endOfDay, format, startOfMonth } from "date-fns";
import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
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
  })
  .get(
    "/search-by-phone",
    async ({ query, status }) => {
      try {
        const result = await Members.getMemberByPhone(query.phone);

        if (!result) {
          return status(404, {
            status: "error",
            message: "Member not found",
            messageKey: "member.notFound",
            messageParams: { phone: query.phone },
            data: null,
          });
        }

        return status(200, {
          status: "success",
          message: "Member retrieved successfully",
          messageKey: "member.retrieved",
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
      query: "searchByPhoneQuery",
    }
  )
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const result = await Members.getMembers(query);

        return status(200, {
          status: "success",
          message: "Members Retrieved",
          messageKey: "member.retrieved",
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
      query: "searchQuery",
    }
  )
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const newMemberId = await Members.addMember(body);

        return status(201, {
          status: "success",
          message: "New Member Added",
          messageKey: "member.created",
          messageParams: { name: body.name },
          data: {
            id: newMemberId,
          },
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "member.phoneTaken",
            messageParams: { phone: body.phone },
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
      isAdmin: true,
      body: "addMember",
      parse: "application/json",
    }
  )
  .get(
    "/reports/total-customers",
    async ({ status }) => {
      try {
        const totalCustomers = await Members.getTotalCustomers();
        return status(200, {
          status: "success",
          message: "Total customers retrieved successfully",
          messageKey: "member.report.totalCustomers",
          data: {
            totalCustomers,
          },
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
      detail: {
        description: "Get total count of all customers",
      },
      isSuperAdmin: true,
    }
  )
  .get(
    "/reports/average-order-value",
    async ({ query, status }) => {
      try {
        let { from, to } = query;

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
          messageKey: "member.report.averageOrderValue",
          data: {
            averageOrderValue,
          },
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
      try {
        let { from, to } = query;

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
          messageKey: "member.report.activeMembers",
          data: {
            activeMembers,
          },
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
      try {
        let { from, to } = query;

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
          messageKey: "member.report.totalMemberOrders",
          data: {
            totalMemberOrders,
          },
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
      try {
        const membersWithSpending = await Members.getMembersWithSpending(query);

        return status(200, {
          status: "success",
          message: "Members spending data retrieved successfully",
          messageKey: "member.report.membersSpending",
          data: membersWithSpending,
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
      detail: {
        description:
          "Get members with spending statistics (total spending, order count, average spending)",
      },
      isAdmin: true,
      query: "getMembersWithSpendingQuery",
    }
  )
  .get(
    "/points",
    async ({ status, user }) => {
      try {
        const userId = user.id;

        const points = await Members.getMemberPoints(userId);
        return status(200, {
          status: "success",
          message: "Member points retrieved successfully",
          messageKey: "member.points.retrieved",
          data: {
            points,
          },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "member.notFound",
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
      auth: true,
    }
  );
