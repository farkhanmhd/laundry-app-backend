import { Elysia, t } from "elysia";

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

const dateRangeQuery = t.Object({
  from: t.Optional(
    t.String({
      pattern: "^\\d{2}-\\d{2}-\\d{4}$", // Regex: only allows "20-01-2026" format
      error: "Date must be in dd-MM-yyyy format", // Custom error message
    })
  ),
  to: t.Optional(
    t.String({
      pattern: "^\\d{2}-\\d{2}-\\d{4}$",
      error: "Date must be in dd-MM-yyyy format",
    })
  ),
});

const searchByPhoneQuery = t.Object({
  phone: t.String({
    pattern: "^[0-9]+$",
    maxLength: 20,
    error: "Phone must be numbers only and max 20 characters",
  }),
});

export type AddMemberBody = typeof addMember.static;
export type DateRangeQuery = typeof dateRangeQuery.static;

export const membersModel = new Elysia({ name: "members/model" }).model({
  addMember,
  dateRangeQuery,
  searchByPhoneQuery,
});
