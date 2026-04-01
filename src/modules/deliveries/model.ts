import { t } from "elysia";

export const deliveriesModel = {
  deliveriesQuery: t.Object({
    search: t.Optional(t.String()),
    page: t.Optional(t.Number()),
    status: t.Optional(
      t.Union([
        t.Literal("requested"),
        t.Literal("assigned"),
        t.Literal("in_progress"),
        t.Literal("completed"),
        t.Literal("cancelled"),
      ])
    ),
  }),
};
