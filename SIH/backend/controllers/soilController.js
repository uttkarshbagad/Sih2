/**
 * @fileoverview Soil Analysis Controller
 * @module controllers/soilController
 * @description Provides HTTP endpoint handlers for soil analysis, Vision AI processing, and crop recommendations.
 */

import { analyzeSoilImageVision } from "../services/soilVisionService.js";
import { calculateCropSuitability } from "../services/cropRecommendationEngine.js";
import { saveSoilReportToStore, getSoilReportsFromStore } from "../models/soilAnalysis.model.js";
import { findLocation } from "../data/locations.js";
import { predictWithML } from "../services/mlService.js";

/**
 * POST /api/soil/analyze
 * Analyzes soil photograph(s) using Vision AI, merges location & weather, calculates crop suitability.
 */
export const analyzeSoilHandler = async (req, res, next) => {
  try {
    const {
      images,
      image,
      location = {},
      currentCrop,
      previousCrop,
      irrigation,
      goal,
      farmerInputs: customInputs
    } = req.body;

    const rawImages = images || (image ? [image] : []);

    const farmerInputs = customInputs || {
      currentCrop: currentCrop || "Not specified",
      previousCrop: previousCrop || "Not specified",
      irrigation: irrigation || "Rain-fed",
      goal: goal || "Choose next crop"
    };

    const district = location.district || "Khordha";
    const block = location.block || "Bhubaneswar";
    const panchayat = location.panchayat || "Patia";
    const locationId = location.locationId || "od-khordha-bhubaneswar";

    // 1. Execute AI Vision Analysis & Quality Verification
    const visionResponse = await analyzeSoilImageVision(rawImages, farmerInputs, location);

    if (!visionResponse.success) {
      return res.status(400).json({
        status: "error",
        message: visionResponse.error || "Please take another photo.",
        reasons: visionResponse.details || [
          "Too dark",
          "Too blurry",
          "Not enough soil visible"
        ]
      });
    }

    const visualData = visionResponse.data;

    // 2. Fetch Live Weather Data for location
    let weatherInfo = {
      rainfallSum: "35.5",
      currentTemp: "29.2",
      drySpellRisk: "Low"
    };

    try {
      const locData = findLocation(district, block);
      if (locData && locData.metrics) {
        weatherInfo = {
          rainfallSum: String(locData.metrics.expected_rainfall_7d || "35.5"),
          currentTemp: String(locData.metrics.temperature_c || "29.2"),
          drySpellRisk: locData.metrics.dominant_risk || "Low"
        };
      }
    } catch (e) {
      console.warn("Forecast fetch warning for soil analysis:", e.message);
    }

    // 3. Run Location + Weather + Soil Aware Crop Recommendation Engine
    const suitabilityResults = calculateCropSuitability({
      visualAnalysis: visualData,
      location: { district, block, panchayat, locationId },
      weather: weatherInfo,
      farmerInputs
    });

    // 4. Assemble Final Structured Report
    const reportPayload = {
      userId: req.user?.id || "farmer_" + Math.random().toString(36).substring(2, 7),
      location: {
        state: "Odisha",
        district,
        block,
        panchayat,
        locationId
      },
      imageUrls: Array.isArray(rawImages) ? rawImages.slice(0, 3) : [rawImages],
      farmerInputs,
      visualAnalysis: visualData,
      cropRecommendations: suitabilityResults.cropRecommendations,
      weatherContext: suitabilityResults.weatherContext,
      soilCareAdvice: suitabilityResults.soilCareAdvice,
      confidence: {
        imageQuality: visualData.overallVisualCondition?.score >= 70 ? "High" : "Medium",
        textureConfidence: visualData.texture?.confidence >= 0.7 ? "High" : "Medium",
        moistureConfidence: visualData.apparentMoisture?.confidence >= 0.7 ? "High" : "Medium"
      },
      limitations: visualData.limitations || [
        "Image analysis cannot determine exact soil pH",
        "Image analysis cannot determine exact NPK",
        "Laboratory testing is recommended for chemical properties"
      ]
    };

    // 5. Store Report
    const savedDoc = await saveSoilReportToStore(reportPayload);

    return res.json({
      status: "success",
      reportId: savedDoc._id,
      data: reportPayload
    });

  } catch (err) {
    console.error("Error in analyzeSoilHandler:", err);
    return res.status(500).json({
      status: "error",
      message: "Soil visual analysis failed: " + err.message
    });
  }
};

/**
 * GET /api/soil/history
 * Fetches previous soil scan reports.
 */
export const getSoilHistoryHandler = async (req, res, next) => {
  try {
    const district = req.query.district || req.user?.district;
    const history = await getSoilReportsFromStore(district, 20);
    return res.json({
      status: "success",
      count: history.length,
      data: history
    });
  } catch (err) {
    console.error("Error in getSoilHistoryHandler:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch soil scan history"
    });
  }
};
