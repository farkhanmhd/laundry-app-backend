import { Elysia } from "elysia";

export class InternalError extends Error {
  constructor(message = "Internal Server Error") {
    super(message);
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("Unauthorized.");
  }
}

export const customError = new Elysia({ name: "custom-error" })
  .error({
    INTERNAL_ERROR: InternalError,
    NOT_FOUND_RESOURCE: NotFoundError,
    UNAUTHORIZED: AuthorizationError,
  })
  .onError(({ code, status, error }) => {
    if (code === "INTERNAL_ERROR") {
      return status(500, {
        status: "failed",
        message: error.message,
      });
    }
    if (code === "NOT_FOUND") {
      return status(404, {
        status: "failed",
        message: "The requested route does not exist.",
      });
    }

    if (code === "NOT_FOUND_RESOURCE") {
      return status(404, {
        status: "failed",
        message: error.message,
      });
    }

    if (code === "UNAUTHORIZED") {
      return status(401, {
        status: "failed",
        message: error.message,
      });
    }

    if (code === "VALIDATION") {
      const details = error.all.map((e) => {
        if (e.summary && e.path) {
          return {
            property: e.path.substring(1),
            message: e.schema.errors,
          };
        }

        return null;
      });

      return status(422, {
        status: "failed",
        message: "Validation failed",
        errors: details,
      });
    }
  })
  .as("global");
