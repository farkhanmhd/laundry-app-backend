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

export const exceptionHandler = new Elysia({ name: "custom-error" })
  .error({
    INTERNAL_ERROR: InternalError,
    NOT_FOUND_RESOURCE: NotFoundError,
    UNAUTHORIZED: AuthorizationError,
  })
  .onError(({ code, status, error }) => {
    const errorCodeMap = {
      // Custom Errors
      INTERNAL_ERROR: 500,
      NOT_FOUND_RESOURCE: 404,
      UNAUTHORIZED: 401,

      // Elysia Built-in Errors
      UNKNOWN: 500,
      VALIDATION: 422,
      NOT_FOUND: 404,
      PARSE: 400,
      INTERNAL_SERVER_ERROR: 500,
      INVALID_COOKIE_SIGNATURE: 401,
      INVALID_FILE_TYPE: 422,
    };

    console.log("Error code: ", code);

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

    const message = error instanceof Error ? error.message : String(error);

    const defaultErrorResponse = {
      status: "failed",
      message,
    };

    return status(errorCodeMap[code as keyof typeof errorCodeMap], defaultErrorResponse);
  })
  .as("global");
