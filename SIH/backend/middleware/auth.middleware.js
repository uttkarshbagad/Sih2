/**
 * @module middleware/auth.middleware
 * @description JWT token validation and session authentication middleware.
 */
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } 
    // Check HTTP-Only Cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. Authentication token missing."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_moes_monsoon_key_2026");

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token. User does not exist."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Authentication failed. Token is invalid or expired."
    });
  }
};
