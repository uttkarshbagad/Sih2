/**
 * MongoDB-compatible Mongoose Data Model Schemas & In-Memory Interfaces
 * System: Hyperlocal Monsoon Onset & Break Prediction System
 * Organization: MoES / NCMRWF
 */

const Schemas = {
  Location: {
    id: { type: String, required: true, unique: true },
    state: { type: String, required: true, default: "Odisha" },
    district: { type: String, required: true },
    block: { type: String, required: true },
    panchayats: [{ type: String }],
    coordinates: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true }
    },
    elevation_m: { type: Number, default: 24 },
    agro_climatic_zone: { type: String, default: "East Coast Plains & Hills (Zone 11)" },
    soil_type: { type: String, default: "Alluvial / Coastal Sandy Loam" }
  },

  WeatherObservation: {
    locationId: { type: String, required: true, ref: "Location" },
    timestamp: { type: Date, default: Date.now },
    temperature_c: { type: Number, required: true },
    humidity_percent: { type: Number, required: true },
    rainfall_24h_mm: { type: Number, default: 0 },
    rainfall_15d_cumulative_mm: { type: Number, default: 0 },
    rainfall_anomaly_percent: { type: Number, default: 0 },
    soil_moisture_level: { type: String, enum: ["Low", "Moderate", "High"], default: "Moderate" },
    soil_moisture_fraction: { type: Number, default: 0.25 },
    wind_speed_kmh: { type: Number, default: 14 },
    wind_direction_deg: { type: Number, default: 210 }
  },

  ClimateSignal: {
    timestamp: { type: Date, default: Date.now },
    enso: {
      nino_34_anomaly: { type: Number, default: 0.8 },
      status: { type: String, default: "Warm Anomaly (El Niño Watch)" },
      strength: { type: String, default: "Weak-to-Moderate" }
    },
    iod: {
      dmi_value: { type: Number, default: -0.4 },
      status: { type: String, default: "Negative IOD" }
    },
    mjo: {
      phase: { type: Number, default: 4 },
      amplitude: { type: Number, default: 1.48 },
      convective_center: { type: String, default: "Maritime Continent / Bay of Bengal" }
    },
    eq_waves: {
      kelvin_wave: { type: String, default: "Active Eastward Phase" },
      rossby_wave: { type: String, default: "Weak Western Pacific" }
    }
  },

  Forecast: {
    locationId: { type: String, required: true, ref: "Location" },
    forecast_horizon_days: { type: Number, enum: [7, 14, 21, 30], default: 7 },
    generated_at: { type: Date, default: Date.now },
    onset_probability: { type: Number, required: true },
    break_probability: { type: Number, required: true },
    heavy_rain_probability: { type: Number, required: true },
    confidence: { type: Number, required: true },
    expected_rainfall_mm: { type: Number, required: true },
    risk_level: { type: String, enum: ["LOW", "MODERATE", "HIGH", "VERY HIGH"], required: true },
    primary_risk_factor: { type: String },
    timeline: [
      {
        day_range: { type: String },
        onset_prob: { type: Number },
        break_prob: { type: Number },
        heavy_rain_prob: { type: Number },
        expected_rain_mm: { type: Number },
        weather_condition: { type: String }
      }
    ]
  },

  Crop: {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    name_hi: { type: String },
    name_or: { type: String },
    water_requirement_mm: { type: Number },
    drought_sensitivity: { type: String, enum: ["Low", "Moderate", "High"] },
    heavy_rain_sensitivity: { type: String, enum: ["Low", "Moderate", "High"] },
    critical_stages: [{ type: String }]
  },

  Advisory: {
    id: { type: String, required: true },
    locationId: { type: String, required: true },
    cropId: { type: String, required: true },
    advisory_type: {
      type: String,
      enum: [
        "Delay Sowing",
        "Proceed with Sowing",
        "Arrange Irrigation",
        "Prepare Drainage",
        "Consider Alternative Crop",
        "Monitor Closely"
      ]
    },
    urgency: { type: String, enum: ["INFO", "WATCH", "WARNING", "CRITICAL"] },
    title: { type: String, required: true },
    title_hi: { type: String },
    title_or: { type: String },
    action_points: [{ type: String }],
    action_points_hi: [{ type: String }],
    action_points_or: [{ type: String }],
    trigger_reasons: [{ type: String }],
    generated_at: { type: Date, default: Date.now }
  },

  Notification: {
    id: { type: String, required: true },
    locationId: { type: String, required: true },
    block: { type: String, required: true },
    channel: { type: String, enum: ["SMS", "WhatsApp", "Voice", "Broadcast"] },
    recipients_count: { type: Number, default: 0 },
    status: { type: String, enum: ["queued", "sent", "delivered", "failed"], default: "sent" },
    sent_at: { type: Date, default: Date.now },
    message_en: { type: String },
    message_hi: { type: String },
    message_or: { type: String }
  },

  ModelPrediction: {
    model_version: { type: String, default: "v1.2-ensemble-prototype" },
    features_input: { type: Object },
    predictions_output: { type: Object },
    feature_importance: [{ type: Object }],
    is_prototype: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
  },

  User: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["OFFICER", "RESEARCHER", "FARMER", "ADMIN"], default: "OFFICER" },
    assigned_district: { type: String, default: "Kendrapara" },
    phone: { type: String },
    language: { type: String, enum: ["en", "hi", "or"], default: "en" }
  }
};

export { Schemas };
export default Schemas;

