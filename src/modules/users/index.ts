import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { UserService } from "./service";

export const usersController = new Elysia({ prefix: "/users" })
  .use(betterAuth)
  .use(searchQueryModel)
  .guard({
    detail: {
      tags: ["Users"],
    },
    isSuperAdmin: true,
  })
  .get("/", async ({ status, query }) => {
    const result = await UserService.getUser(query);

    return status(200, {
      status: "success",
      message: "Users retrieved",
      data: result,
    });
  });
