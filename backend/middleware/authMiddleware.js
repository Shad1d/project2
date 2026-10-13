import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect middleware
 * Verifies Bearer JWT token from Authorization header.
 * Attaches user document to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication required. Please sign in." },
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Your session has expired. Please sign in again."
          : "Invalid token. Please sign in again.";
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message },
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "User account no longer exists." },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Authentication server error." },
    });
  }
};

/**
 * Optional Auth middleware
 * If token is present and valid, attaches req.user.
 * If token is missing, does NOT block the request (used for public pages with match scores).
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignored: visitor remains an unauthenticated guest
    }

    next();
  } catch {
    next();
  }
};

/**
 * Role-Based Access Control (RBAC)
 * Restricts access to users with specified roles (e.g. "ADMIN", "MODERATOR").
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." },
      });
    }
    next();
  };
};
