import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { usersModel } from "./model";
import { UserService } from "./service";

export const usersController = new Elysia({ prefix: "/users" })
  .use(betterAuth)
  .use(searchQueryModel)
  .use(usersModel)
  .guard({
    detail: {
      tags: ["Users"],
    },
  })
  .post(
    "/",
    async ({ status, body }) => {
      const result = await UserService.registerUser(body);

      return status(201, {
        status: "success",
        message: "User registered successfully",
        data: {
          newUserId: result,
        },
      });
    },
    {
      body: "registerUserSchema",
    }
  )
  .post(
    "/cashier",
    async ({ status, body }) => {
      const result = await UserService.createCashier(body);

      return status(201, {
        status: "success",
        message: "Cashier created successfully",
        data: {
          newUserId: result,
        },
      });
    },
    {
      body: "createCashierSchema",
      isSuperAdmin: true,
    }
  )
  .get(
    "/",
    async ({ status, query }) => {
      const result = await UserService.getUsers(query);

      return status(200, {
        status: "success",
        message: "Users retrieved",
        data: result,
      });
    },
    {
      query: "searchQuery",
      isSuperAdmin: true,
    }
  );
