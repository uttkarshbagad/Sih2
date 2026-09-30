import express from "express";
import { 
  sendOtp, 
  verifyOtp, 
  registerUser, 
  loginUser, 
  mobileLogin,
  logoutUser, 
  getMe, 
  updateProfile 
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Mobile Number OTP Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Quick Mobile Login (phone only)
router.post("/mobile-login", mobileLogin);

// Standard Password Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Protected Profile Routes
router.get("/me", verifyToken, getMe);
router.put("/profile", verifyToken, updateProfile);

export default router;
