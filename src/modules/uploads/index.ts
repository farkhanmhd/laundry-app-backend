import { Elysia, file } from "elysia";

export const fileUploadController = new Elysia({ prefix: "/uploads" }).get("/:name", ({ params: { name } }) => file(`public/uploads/${name}`));
