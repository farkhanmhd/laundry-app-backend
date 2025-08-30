import { Elysia, file } from "elysia";

export const fileUploadController = new Elysia({ prefix: "/uploads" }).get("/:name", ({ params: { name } }) => {
  return file(`public/uploads/${name}`);
});
