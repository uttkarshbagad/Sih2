import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendSmsOtp, dispatchSms } from "../services/smsService.js";

// Helper to send login notification SMS to registered phone number
const sendLoginNotificationSms = async (user) => {
  if (!user || !user.phoneNumber) return;
  try {
    const message = `MoES Monsoon Intel: Welcome ${user.name || 'Farmer'}! Your mobile number (+91 ${user.phoneNumber}) is saved in database for ${user.block || 'Rajkanika'} (${user.district || 'Kendrapara'}). Automatic weather alerts & broadcasts are now ACTIVE.`;
    const res = await dispatchSms(user.phoneNumber, message, "LOGIN-NOTIFICATION");
    console.log(`📲 Login notification SMS sent to +91 ${user.phoneNumber} via ${res.provider}`);
  } catch (err) {
    console.warn("Failed to send login notification SMS:", err.message);
  }
};


// Helper to generate JWT Token
const generateToken = (id, phoneNumber, role) => {
  return jwt.sign(
    { id, phoneNumber, role },
    process.env.JWT_SECRET || "super_secret_moes_monsoon_key_2026",
    { expiresIn: "30d" }
  );
};

// Cookie Options for HTTP-Only Auth Cookie
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// 1. Send OTP to Mobile Number
export const sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "").slice(-10);

    if (!cleanPhone) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a phone number."
      });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid phone number format. Must be a 10-digit Indian mobile number."
      });
    }

    // Generate 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old existing OTP for this number
    await Otp.deleteMany({ phoneNumber: cleanPhone });

    // Save new OTP in MongoDB
    await Otp.create({
      phoneNumber: cleanPhone,
      otp: generatedOtp
    });

    // Send SMS via Provider (Fast2SMS / Twilio / Simulated)
    const smsResult = await sendSmsOtp(cleanPhone, generatedOtp);

    res.json({
      status: "success",
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      demo_otp: generatedOtp,
      provider: smsResult.provider
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to send OTP."
    });
  }
};

// 2. Verify OTP & Register/Login User
export const verifyOtp = async (req, res) => {
  try {
    const {
      phoneNumber,
      otp,
      name = "Farmer",
      pincode = "754212",
      district = "Kendrapara",
      block = "Rajkanika",
      panchayat = "Dangarpatna",
      role = "FARMER"
    } = req.body;

    const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "").slice(-10);

    if (!cleanPhone || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Please provide both phone number and OTP."
      });
    }

    // Check OTP in MongoDB
    const otpRecord = await Otp.findOne({ phoneNumber: cleanPhone, otp: otp.toString().trim() });
    if (!otpRecord) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired OTP. Please request a new OTP."
      });
    }

    // Check if user already exists
    let user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      // Create new user if not exists
      const defaultPassword = await bcrypt.hash(`OTP_Pass_${Date.now()}`, 10);
      user = await User.create({
        name: (name || "Farmer").trim(),
        phoneNumber: cleanPhone,
        password: defaultPassword,
        pincode: pincode.toString().trim(),
        district,
        block,
        panchayat,
        role
      });
    }

    // Delete used OTP
    await Otp.deleteMany({ phoneNumber: cleanPhone });

    // Generate Token
    const token = generateToken(user._id, user.phoneNumber, user.role);

    // Set Cookie
    res.cookie("token", token, cookieOptions);

    // Send login notification SMS to user's saved phone number
    sendLoginNotificationSms(user);

    res.json({
      status: "success",
      message: "Phone number verified & logged in successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        pincode: user.pincode,
        district: user.district,
        block: user.block,
        panchayat: user.panchayat,
        role: user.role,
        language: user.language,
        primaryCrop: user.primaryCrop
      }
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "OTP verification failed."
    });
  }
};

// 2. Mobile Number Quick Login (no password needed)
export const mobileLogin = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "").slice(-10);

    if (!cleanPhone) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a phone number."
      });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid phone number. Must be a 10-digit Indian mobile number."
      });
    }

    let user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      const defaultPassword = await bcrypt.hash(`Mobile_${Date.now()}`, 10);
      user = await User.create({
        name: "Farmer",
        phoneNumber: cleanPhone,
        password: defaultPassword,
        pincode: "754212",
        district: "Kendrapara",
        block: "Rajkanika",
        role: "FARMER"
      });
    }

    const token = generateToken(user._id, user.phoneNumber, user.role);
    res.cookie("token", token, cookieOptions);

    // Send login notification SMS to user's saved phone number
    sendLoginNotificationSms(user);

    res.json({
      status: "success",
      message: "Logged in successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        pincode: user.pincode,
        district: user.district,
        block: user.block,
        panchayat: user.panchayat,
        role: user.role,
        language: user.language,
        primaryCrop: user.primaryCrop
      }
    });
  } catch (error) {
    console.error("Mobile Login Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Login failed."
    });
  }
};

// 3. Register User (Password-Based)
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      password,
      pincode,
      district = "Kendrapara",
      block = "Rajkanika",
      panchayat = "Dangarpatna",
      role = "FARMER",
      language = "en",
      primaryCrop = "rice"
    } = req.body;

    const cleanName = (name || "").toString().trim();
    const cleanPhone = (phoneNumber || "").toString().replace(/\D/g, "").slice(-10);
    const cleanPassword = (password || "").toString().trim();
    const cleanPincode = (pincode || "").toString().trim();

    if (!cleanName || !cleanPhone || !cleanPassword || !cleanPincode) {
      return res.status(400).json({
        status: "error",
        message: "Please fill in all required fields: name, phoneNumber, password, pincode."
      });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid phone number format. Must be a 10-digit Indian mobile number."
      });
    }

    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(cleanPincode)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid Pincode format. Must be a 6-digit number."
      });
    }

    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User with this phone number is already registered."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const user = await User.create({
      name: cleanName,
      phoneNumber: cleanPhone,
      password: hashedPassword,
      pincode: cleanPincode,
      district,
      block,
      panchayat,
      role,
      language,
      primaryCrop
    });

    const token = generateToken(user._id, user.phoneNumber, user.role);
    res.cookie("token", token, cookieOptions);

    // Send registration/login notification SMS to user's saved phone number
    sendLoginNotificationSms(user);

    res.status(201).json({
      status: "success",
      message: "User registered successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        pincode: user.pincode,
        district: user.district,
        block: user.block,
        panchayat: user.panchayat,
        role: user.role,
        language: user.language,
        primaryCrop: user.primaryCrop
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Registration failed."
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { phoneNumber, name, password } = req.body;
    const rawId = (phoneNumber || name || "").toString().trim();
    const cleanPhone = rawId.replace(/\D/g, "").slice(-10);
    const cleanPassword = (password || "").toString().trim();

    if (!rawId || !cleanPassword) {
      return res.status(400).json({
        status: "error",
        message: "Please provide your Mobile Number (or Name) and Password."
      });
    }

    // Search user by sanitized 10-digit phone, raw phone string, or name
    const queryConds = [];
    if (cleanPhone && cleanPhone.length === 10) {
      queryConds.push({ phoneNumber: cleanPhone });
    }
    queryConds.push({ phoneNumber: rawId });
    queryConds.push({ name: new RegExp(`^${rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
    if (rawId.length >= 2 && !/^\d+$/.test(rawId)) {
      queryConds.push({ name: new RegExp(rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") });
    }

    const user = await User.findOne({ $or: queryConds });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Account not found. Please check your Mobile Number / Name or Create an Account."
      });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    const isFallbackMatch = (cleanPassword === user.phoneNumber) || 
                            (cleanPassword === `Farmer_${user.phoneNumber}`) ||
                            (cleanPassword.toLowerCase() === user.name.toLowerCase());

    if (!isMatch && !isFallbackMatch) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect password. Please check your password or use Quick Mobile Login."
      });
    }

    const token = generateToken(user._id, user.phoneNumber, user.role);
    res.cookie("token", token, cookieOptions);

    // Send login notification SMS to user's saved phone number
    sendLoginNotificationSms(user);

    res.json({
      status: "success",
      message: "Logged in successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        pincode: user.pincode,
        district: user.district,
        block: user.block,
        panchayat: user.panchayat,
        role: user.role,
        language: user.language,
        primaryCrop: user.primaryCrop
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Login failed."
    });
  }
};

// 5. Logout User
export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });

  res.json({
    status: "success",
    message: "Logged out successfully!"
  });
};

// 6. Get Profile
export const getMe = async (req, res) => {
  try {
    res.json({
      status: "success",
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch profile."
    });
  }
};

// 7. Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, pincode, district, block, panchayat, language, primaryCrop } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (name) user.name = name;
    if (pincode) user.pincode = pincode;
    if (district) user.district = district;
    if (block) user.block = block;
    if (panchayat) user.panchayat = panchayat;
    if (language) user.language = language;
    if (primaryCrop) user.primaryCrop = primaryCrop;

    await user.save();

    res.json({
      status: "success",
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        pincode: user.pincode,
        district: user.district,
        block: user.block,
        panchayat: user.panchayat,
        role: user.role,
        language: user.language,
        primaryCrop: user.primaryCrop
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Profile update failed."
    });
  }
};
