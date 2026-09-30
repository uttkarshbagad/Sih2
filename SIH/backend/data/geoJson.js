/**
 * GeoJSON Dataset for Odisha Districts & Key Blocks
 * Generates polygon boundaries centered around actual geographic bounding coordinates.
 * Structured so production shapefiles/GeoJSON can be directly swapped in.
 */

import { locations } from "./locations.js";

// Function to generate a realistic polygon around a centroid coordinate
function generatePolygon(lat, lon, size = 0.12, noise = 0.03) {
  // 6-8 vertex polygon representing block/district boundaries
  return [
    [lon - size * 0.8, lat - size * 0.5],
    [lon - size * 0.9, lat + size * 0.3],
    [lon - size * 0.2, lat + size * 0.85],
    [lon + size * 0.6, lat + size * 0.7],
    [lon + size * 0.95, lat + size * 0.1],
    [lon + size * 0.7, lat - size * 0.75],
    [lon - size * 0.1, lat - size * 0.9],
    [lon - size * 0.8, lat - size * 0.5] // Closed loop
  ];
}

const getOdishaGeoJSON = (activeLayer = "break_risk") => {
  const features = locations.map(loc => {
    const coords = generatePolygon(loc.coordinates.lat, loc.coordinates.lon);
    
    // Determine risk category and color code
    let riskLevel = "LOW";
    let riskColor = "#10b981"; // Green (Favorable)
    let metricValue = loc.metrics.break_probability;

    if (activeLayer === "onset_risk") {
      metricValue = loc.metrics.onset_probability;
      if (metricValue >= 0.75) {
        riskLevel = "FAVORABLE";
        riskColor = "#10b981"; // Green
      } else if (metricValue >= 0.60) {
        riskLevel = "MODERATE";
        riskColor = "#f59e0b"; // Yellow
      } else {
        riskLevel = "POOR";
        riskColor = "#ef4444"; // Red
      }
    } else if (activeLayer === "break_risk") {
      metricValue = loc.metrics.break_probability;
      if (metricValue >= 0.65) {
        riskLevel = "VERY HIGH";
        riskColor = "#ef4444"; // Red
      } else if (metricValue >= 0.50) {
        riskLevel = "HIGH";
        riskColor = "#f97316"; // Orange
      } else if (metricValue >= 0.30) {
        riskLevel = "MODERATE";
        riskColor = "#f59e0b"; // Yellow
      } else {
        riskLevel = "LOW";
        riskColor = "#10b981"; // Green
      }
    } else if (activeLayer === "heavy_rain") {
      metricValue = loc.metrics.heavy_rain_probability;
      if (metricValue >= 0.60) {
        riskLevel = "HIGH HEAVY RAIN";
        riskColor = "#06b6d4"; // Blue
      } else if (metricValue >= 0.40) {
        riskLevel = "MODERATE";
        riskColor = "#38bdf8"; // Light Blue
      } else {
        riskLevel = "LOW";
        riskColor = "#10b981"; // Green
      }
    } else if (activeLayer === "soil_moisture") {
      if (loc.metrics.soil_moisture_level === "Low") {
        riskLevel = "DEFICIT";
        riskColor = "#ef4444";
      } else if (loc.metrics.soil_moisture_level === "Moderate") {
        riskLevel = "ADEQUATE";
        riskColor = "#f59e0b";
      } else {
        riskLevel = "SURPLUS";
        riskColor = "#10b981";
      }
    } else if (activeLayer === "rainfall_anomaly") {
      if (loc.metrics.rainfall_anomaly_percent <= -25) {
        riskLevel = "LARGE DEFICIT";
        riskColor = "#ef4444";
      } else if (loc.metrics.rainfall_anomaly_percent < 0) {
        riskLevel = "DEFICIT";
        riskColor = "#f97316";
      } else {
        riskLevel = "NORMAL / EXCESS";
        riskColor = "#10b981";
      }
    }

    return {
      type: "Feature",
      id: loc.id,
      properties: {
        id: loc.id,
        district: loc.district,
        block: loc.block,
        panchayats_count: loc.panchayats.length,
        panchayats: loc.panchayats,
        lat: loc.coordinates.lat,
        lon: loc.coordinates.lon,
        elevation: loc.elevation_m,
        soil_type: loc.soil_type,
        activeLayer,
        metricValue,
        riskLevel,
        riskColor,
        onset_prob: Math.round(loc.metrics.onset_probability * 100),
        break_prob: Math.round(loc.metrics.break_probability * 100),
        heavy_rain_prob: Math.round(loc.metrics.heavy_rain_probability * 100),
        confidence: Math.round(loc.metrics.confidence * 100),
        expected_rainfall_14d: loc.metrics.expected_rainfall_14d,
        soil_moisture: loc.metrics.soil_moisture_level,
        rainfall_anomaly: loc.metrics.rainfall_anomaly_percent,
        risk_factor: loc.metrics.risk_factor
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords]
      }
    };
  });

  return {
    type: "FeatureCollection",
    features,
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
    }
  };
};

export {
  getOdishaGeoJSON
};

