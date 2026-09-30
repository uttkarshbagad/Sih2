import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

async function checkUserLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Test 1: exact match
    let user1 = await User.findOne({
      $or: [
        { phoneNumber: "8093164058" },
        { name: "prakash" }
      ]
    });
    console.log("Exact search for 'prakash' or '8093164058':", user1 ? user1.name : "NOT FOUND");

    // Test 2: case-insensitive regex match
    let user2 = await User.findOne({
      $or: [
        { phoneNumber: "8093164058" },
        { name: new RegExp("^prakash", "i") }
      ]
    });
    console.log("Regex search for '^prakash':", user2 ? user2.name : "NOT FOUND");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkUserLogin();
