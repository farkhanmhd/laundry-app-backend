import { Elysia } from "elysia";
import { searchQuery } from "@/search-query";

export const driversModel = new Elysia({ name: "drivers/model" }).model({
  searchQuery,
});
