import { Elysia, file } from "elysia";

export const fileUploadController = new Elysia({ prefix: "/uploads" })
  .guard({
    detail: {
      tags: ["Uploads"],
    },
  })
  .get("/:name", ({ params: { name } }) => file(`public/uploads/${name}`));
