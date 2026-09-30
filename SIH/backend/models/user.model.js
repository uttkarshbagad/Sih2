import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^\d{6}$/, "Please enter a valid 6-digit Pincode"]
    },
    district: {
      type: String,
      default: "Kendrapara"
    },
    block: {
      type: String,
      default: "Rajkanika"
    },
    panchayat: {
      type: String,
      default: "Dangarpatna"
    },
    role: {
      type: String,
      enum: ["FARMER", "OFFICER", "RESEARCHER", "ADMIN"],
      default: "FARMER"
    },
    language: {
      type: String,
      enum: ["en", "hi", "or"],
      default: "en"
    },
    primaryCrop: {
      type: String,
      default: "rice"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);
export default User;
