import { Elysia, t } from "elysia";

const searchQuery = t.Object({
  search: t.Optional(t.String()),
  rows: t.Optional(t.Integer()),
  page: t.Optional(t.Integer()),
});

export type SearchQuery = typeof searchQuery.static;

export const searchQueryModel = new Elysia({
  name: "search-query/model",
}).model({
  searchQuery,
});
