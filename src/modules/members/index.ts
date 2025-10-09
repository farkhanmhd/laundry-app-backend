import { Elysia } from "elysia";
import { betterAuth } from "@/auth-instance";
import { searchQueryModel } from "@/search-query";
import { membersModel } from "./model";
import { Members } from "./service";

export const membersController = new Elysia({ prefix: "/members" })
  .use(betterAuth)
  .use(membersModel)
  .use(searchQueryModel)
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
      auth: true,
      query: "searchQuery",
    },
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
      auth: true,
      body: "addMember",
      parse: "application/json",
    },
  );
