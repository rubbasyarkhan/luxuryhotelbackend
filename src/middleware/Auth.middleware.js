import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Usermodle } from "../Models/User.model.js";
dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
        status: "failed"
      });
    }

    const token = authHeader.split(" ")[1];

    const jwtSecret =
      process.env.JWT_SECRET_KEY || "luxurystay-super-secret-jwt-key-2024";

    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded?.user?.id) {
      return res.status(401).json({
        message: "Invalid token payload",
        status: "failed"
      });
    }

    const user = await Usermodle.findById(decoded.user.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
        status: "failed"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated",
        status: "failed"
      });
    }

    req.user = user; // ✅ full user object
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }
};


export const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await Usermodle.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization error", status: "failed" });
    }
  };
};

export const requireAdmin = authorizeRoles('Admin');
export const requireManager = authorizeRoles('Admin', 'Manager');
export const requireReceptionist = authorizeRoles('Admin', 'Manager', 'Receptionist');
export const requireHousekeeping = authorizeRoles('Admin', 'Manager', 'Housekeeping');
export const requireGuest = authorizeRoles('Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest');

export default authMiddleware;
