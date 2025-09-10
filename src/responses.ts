import { Elysia, t } from "elysia";

const successStatus = t.Literal("success");
const failedStatus = t.Literal("failed");

export const succesResponse = t.Object({
  status: successStatus,
  message: t.String(),
});

export const failedResponse = t.Object({
  status: failedStatus,
  message: t.String(),
});

// const validationErrors = t.Object({
//   errors: t.Array(
//     t.Object({
//       property: t.String(),
//       message: t.String(),
//     }),
//   ),
// });

// export const validationErrorResponse = t.Composite([failedResponse, validationErrors]);

export const responseHandler = new Elysia({
  name: "default/response",
})
  .model({
    succesResponse,
    failedResponse,
  })
  .as("global");
