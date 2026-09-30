import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600 // Automatically delete OTP after 10 minutes (600 seconds)
    }
  }
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
