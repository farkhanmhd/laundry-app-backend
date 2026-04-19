import { Elysia, t } from "elysia";
import { searchQuery } from "@/search-query";
import { dateRangeQuery } from "@/utils";

const addMember = t.Object({
  name: t.String({
    minLength: 1,
    error: "Member name cannot be empty",
  }),
  phone: t.String({
    minLength: 6,
    error: "Phone number should be at least 6 character",
  }),
});

const getMembersWithSpendingQuery = t.Composite([searchQuery, dateRangeQuery]);

const searchByPhoneQuery = t.Object({
  phone: t.String({
    pattern: "^[0-9]+$",
    maxLength: 20,
    error: "Phone must be numbers only and max 20 characters",
  }),
});

export type AddMemberBody = typeof addMember.static;
export type GetMembersWithSpendingQuery =
  typeof getMembersWithSpendingQuery.static;

export const membersModel = new Elysia({ name: "members/model" }).model({
  getMembersWithSpendingQuery,
  addMember,
  dateRangeQuery,
  searchByPhoneQuery,
});
