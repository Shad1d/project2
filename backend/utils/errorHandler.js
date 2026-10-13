/**
 * Centralized error formatting helper
 * Converts Mongoose errors, CastErrors, Duplicate errors, and custom errors
 * into clear, actionable, and human-readable error responses.
 */
export function formatErrorResponse(error, fallbackMessage = "An unexpected error occurred.") {
  // 1. Mongoose Schema Validation Error (e.g. minlength, required, enum)
  if (error.name === "ValidationError") {
    const errorDetails = Object.values(error.errors || {}).map((err) => {
      // Customized messaging for common validator kinds
      if (err.kind === "minlength") {
        const fieldName = err.path ? err.path.charAt(0).toUpperCase() + err.path.slice(1) : "Field";
        const providedLen = typeof err.value === "string" ? err.value.length : 0;
        return `${fieldName} must be at least ${err.properties?.minlength} characters long (you provided ${providedLen} characters).`;
      }
      if (err.kind === "maxlength") {
        const fieldName = err.path ? err.path.charAt(0).toUpperCase() + err.path.slice(1) : "Field";
        return `${fieldName} cannot exceed ${err.properties?.maxlength} characters.`;
      }
      if (err.kind === "required") {
        const fieldName = err.path ? err.path.charAt(0).toUpperCase() + err.path.slice(1) : "Field";
        return `${fieldName} is required and cannot be empty.`;
      }
      if (err.kind === "enum") {
        const allowed = err.properties?.enumValues ? ` Allowed options: ${err.properties.enumValues.join(", ")}.` : "";
        return `"${err.value}" is not a valid value for ${err.path}.${allowed}`;
      }
      return err.message;
    });

    const combinedMessage = errorDetails.join(" ") || "Validation failed for one or more fields.";
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: combinedMessage,
          details: errorDetails,
        },
      },
    };
  }

  // 2. MongoDB Duplicate Key Error (E11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    const value = error.keyValue ? error.keyValue[field] : "";
    let friendlyField = field;
    if (field === "normalizedApplicationUrl") friendlyField = "application URL";
    if (field === "email") friendlyField = "email address";

    return {
      status: 409,
      body: {
        success: false,
        error: {
          code: "DUPLICATE_ERROR",
          message: `A record with this ${friendlyField} ("${value}") already exists.`,
        },
      },
    };
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId format)
  if (error.name === "CastError") {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: "INVALID_IDENTIFIER",
          message: `Invalid identifier format for ${error.path}: "${error.value}".`,
        },
      },
    };
  }

  // 4. JWT Authentication Errors
  if (error.name === "JsonWebTokenError") {
    return {
      status: 401,
      body: {
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Your session token is invalid. Please sign in again.",
        },
      },
    };
  }

  if (error.name === "TokenExpiredError") {
    return {
      status: 401,
      body: {
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Your session has expired. Please sign in again.",
        },
      },
    };
  }

  // 5. Custom error with specific status or message
  if (error.status && error.message) {
    return {
      status: error.status,
      body: {
        success: false,
        error: {
          code: error.code || "REQUEST_FAILED",
          message: error.message,
        },
      },
    };
  }

  // 6. Generic Error - provide error.message if available
  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || fallbackMessage,
      },
    },
  };
}
