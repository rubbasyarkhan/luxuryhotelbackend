import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Usermodle } from "../Models/User.model.js";
dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization header provided", status: "failed" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Invalid authorization header format", status: "failed" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied", status: "failed" });
    }

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET_KEY || "luxurystay-super-secret-jwt-key-2024";
    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded || !decoded.user || !decoded.user.id) {
      return res
        .status(401)
        .json({ message: "Invalid token payload", status: "failed" });
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid token format", 
        status: "failed",
        error: "JWT_MALFORMED"
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token has expired", 
        status: "failed",
        error: "JWT_EXPIRED"
      });
    } else {
      return res.status(401).json({ 
        message: "Token verification failed", 
        status: "failed",
        error: "JWT_VERIFICATION_FAILED"
      });
    }
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
