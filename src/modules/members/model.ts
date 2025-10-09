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

export type AddMemberBody = typeof addMember.static;

export const membersModel = new Elysia({ name: "members/model" }).model({
  addMember,
});
