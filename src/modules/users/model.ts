import { Elysia, t } from "elysia";

const updateUserRoleSchema = t.Object({
  userId: t.String(),
  role: t.Union([t.Literal("admin"), t.Literal("user")]),
});

const registerUserSchema = t.Object({
  phoneNumber: t.String({
    minLength: 7,
    maxLength: 20,
    pattern: "^\\+?[0-9\\s\\-()]+$",
    error: "Invalid phone number format",
  }),
  name: t.String({
    minLength: 2,
    error: "Name must be at least 2 characters",
  }),
  username: t.String({
    minLength: 3,
    maxLength: 32,
    pattern: "^[a-zA-Z0-9_]+$",
    error: "Only letters, numbers, and underscores",
  }),
  email: t.String({
    format: "email",
    error: "Invalid email address",
  }),
  password: t.String({
    minLength: 8,
    error: "Password must be at least 8 characters",
  }),
  memberId: t.Optional(t.Nullable(t.String())),
});

const createCashierSchema = t.Omit(registerUserSchema, [
  "password",
  "memberId",
]);

const connectMemberSchema = t.Object({
  memberId: t.String(),
  phoneNumber: t.String({
    minLength: 7,
    maxLength: 20,
    pattern: "^\\+?[0-9\\s\\-()]+$",
    error: "Invalid phone number format",
  }),
});

const createMemberSchema = t.Object({
  name: t.String({
    minLength: 2,
    error: "Name must be at least 2 characters",
  }),
  phoneNumber: t.String({
    minLength: 7,
    maxLength: 20,
    pattern: "^\\+?[0-9\\s\\-()]+$",
    error: "Invalid phone number format",
  }),
});

export type UpdateUserRoleSchema = typeof updateUserRoleSchema.static;
export type RegisterSchema = typeof registerUserSchema.static;
export type CreateCashierSchema = typeof createCashierSchema.static;
export type ConnectMemberSchema = typeof connectMemberSchema.static;
export type CreateMemberSchema = typeof createMemberSchema.static;

export const usersModel = new Elysia({ name: "users/model" }).model({
  updateUserRoleSchema,
  registerUserSchema,
  createCashierSchema,
  connectMemberSchema,
  createMemberSchema,
});
