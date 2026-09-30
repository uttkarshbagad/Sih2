import express from "express";
import { analyzeSoilHandler, getSoilHistoryHandler } from "../controllers/soilController.js";

const router = express.Router();

// POST /api/soil/analyze - AI Soil Photo Vision Analysis
router.post("/analyze", analyzeSoilHandler);

// GET /api/soil/history - Farmer Past Soil Scan Reports
router.get("/history", getSoilHistoryHandler);

export default router;
