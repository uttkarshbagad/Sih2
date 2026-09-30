/**
 * @module routes/weatherAlerts
 * @description Severe weather alert SSE broadcast route handlers.
 */
import express from "express";
import {
  streamWeatherAlerts,
  postCheckWeatherAlert,
  postTriggerBroadcast,
  postRunSweep,
  postBroadcastToAllUsers
} from "../controllers/weatherAlertController.js";

const router = express.Router();

// Live real-time broadcast stream (SSE)
router.get("/stream", streamWeatherAlerts);

// On-demand nowcast check (optionally SMS a farmer mobile number)
router.post("/check", postCheckWeatherAlert);

// Manual/forced broadcast for a block (bypasses dedup with force:true)
router.post("/trigger", postTriggerBroadcast);

// Broadcast SMS to all registered phone numbers saved in database
router.post("/broadcast-users", postBroadcastToAllUsers);

// Full ML sweep across all Odisha blocks
router.post("/sweep", postRunSweep);

export default router;
/** Express SSE Router - Real-Time Heavy Rain Weather Broadcast Stream */
