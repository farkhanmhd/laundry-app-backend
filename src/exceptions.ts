import { Elysia } from "elysia";

export class InternalError extends Error {
  constructor(message = "Internal Server Error") {
    super(message);
  }
}

export class ConflictError extends Error {
  constructor(message = "Resource already exists") {
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
    CONFLICT: ConflictError,
    NOT_FOUND_RESOURCE: NotFoundError,
    UNAUTHORIZED: AuthorizationError,
  })
  .onError(({ code, status, error }) => {
    const errorCodeMap = {
      // Custom Errors
      INTERNAL_ERROR: 500,
      CONFLICT: 409,
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

    const messageKeyMap: Record<string, string> = {
      INTERNAL_ERROR: "common.unexpectedError",
      CONFLICT: "validation.alreadyExists",
      NOT_FOUND_RESOURCE: "common.notFound",
      UNAUTHORIZED: "auth.unauthorized",
      VALIDATION: "validation.required",
      UNKNOWN: "common.unexpectedError",
      NOT_FOUND: "common.notFound",
      PARSE: "validation.required",
      INTERNAL_SERVER_ERROR: "common.unexpectedError",
      INVALID_COOKIE_SIGNATURE: "auth.sessionExpired",
      INVALID_FILE_TYPE: "validation.required",
    };

    if (code === "VALIDATION") {
      const details = error.all.map((e) => {
        if (e.summary) {
          return {
            message: e.summary,
          };
        }

        return null;
      });

      return status(422, {
        status: "failed",
        message: "Validation failed",
        messageKey: "validation.required",
        errors: details,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    const key = messageKeyMap[code as keyof typeof messageKeyMap] || "common.unexpectedError";

    const defaultErrorResponse = {
      status: "failed",
      message,
      messageKey: key,
    };

    return status(
      errorCodeMap[code as keyof typeof errorCodeMap],
      defaultErrorResponse
    );
  })
  .as("global");
