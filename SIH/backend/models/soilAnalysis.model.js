/**
 * @module models/soilAnalysis.model
 * @description Soil analysis report JSON storage and retrieval persistence model.
 */
import mongoose from "mongoose";

const soilAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "anonymous_farmer" },
    location: {
      state: { type: String, default: "Odisha" },
      district: { type: String, required: true },
      block: { type: String, required: true },
      panchayat: { type: String, default: "" },
      locationId: { type: String, default: "" }
    },
    imageUrls: [{ type: String }],
    farmerInputs: {
      currentCrop: { type: String, default: "Not specified" },
      previousCrop: { type: String, default: "Not specified" },
      irrigation: { type: String, default: "Rain-fed" },
      goal: { type: String, default: "Choose next crop" }
    },
    visualAnalysis: {
      soilColor: { value: String, confidence: Number },
      apparentMoisture: { value: String, score: Number, confidence: Number },
      texture: { classification: String, confidence: Number },
      surfaceCondition: {
        compaction: String,
        crusting: String,
        cracks: String
      },
      organicMatterAppearance: { value: String, confidence: Number },
      stones: { level: String },
      erosion: { risk: String },
      waterlogging: { risk: String },
      overallVisualCondition: { score: Number, label: String }
    },
    cropRecommendations: [
      {
        crop: String,
        score: Number,
        reasons: [String],
        careGuidance: mongoose.Schema.Types.Mixed
      }
    ],
    weatherContext: {
      rainfall: String,
      temperature: String,
      drySpellRisk: String,
      insight: String
    },
    soilCareAdvice: [String],
    confidence: {
      imageQuality: String,
      textureConfidence: String,
      moistureConfidence: String
    },
    limitations: [String]
  },
  { timestamps: true }
);

export const SoilAnalysis =
  mongoose.models.SoilAnalysis ||
  mongoose.model("SoilAnalysis", soilAnalysisSchema);

// In-memory / local fallback store for local development without active MongoDB connection
const localReportsStore = [];

export const saveSoilReportToStore = async (reportData) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = new SoilAnalysis(reportData);
      return await doc.save();
    }
  } catch (err) {
    console.warn("MongoDB save failed, using local store:", err.message);
  }
  const fallbackDoc = {
    _id: "soil_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    ...reportData,
    createdAt: new Date().toISOString()
  };
  localReportsStore.unshift(fallbackDoc);
  return fallbackDoc;
};

export const getSoilReportsFromStore = async (district, limit = 20) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const query = district ? { "location.district": district } : {};
      return await SoilAnalysis.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    }
  } catch (err) {
    console.warn("MongoDB find failed, using local store:", err.message);
  }
  if (district) {
    return localReportsStore.filter((r) => r.location?.district?.toLowerCase() === district.toLowerCase()).slice(0, limit);
  }
  return localReportsStore.slice(0, limit);
};
