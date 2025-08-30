import { Elysia, t } from "elysia";

export const defaultResponse = t.Object({
  status: t.Union([t.Literal("success"), t.Literal("failed")]),
  message: t.String(),
});

const validationErrors = t.Object({
  errors: t.Array(
    t.Object({
      property: t.String(),
      message: t.String(),
    }),
  ),
});

export const validationErrorResponse = t.Composite([defaultResponse, validationErrors]);

export const defaultResponseModel = new Elysia({
  name: "default/response",
})
  .model({
    defaultResponse,
  })
  .as("global");
