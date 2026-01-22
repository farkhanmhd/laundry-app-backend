import { Elysia, t } from "elysia";

const updateUserRoleSchema = t.Object({
  userId: t.String(),
  role: t.Union([t.Literal("admin"), t.Literal("user")]),
});

export type UpdateUserRoleSchema = typeof updateUserRoleSchema.static;

export const usersModel = new Elysia({ name: "users/model" }).model({
  updateUserRoleSchema,
});
