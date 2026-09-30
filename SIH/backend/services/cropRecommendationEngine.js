/**
 * @module services/cropRecommendationEngine
 * @description Soil texture, moisture, rainfall anomaly, and location-aware crop recommendation engine.
 */
/**
 * Location, Season, Weather and Visual Soil Aware Crop Recommendation Engine
 */
export const calculateCropSuitability = ({
  visualAnalysis,
  location,
  weather,
  farmerInputs
}) => {
  const district = location.district || "Khordha";
  const texture = (visualAnalysis?.texture?.classification || "Likely Loam").toLowerCase();
  const moistureScore = visualAnalysis?.apparentMoisture?.score || 60;
  const irrigation = farmerInputs?.irrigation || "Rain-fed";
  const rainNext7Days = parseFloat(weather?.rainfallSum || weather?.rain7DayTotal || "35.5");
  const temp = parseFloat(weather?.currentTemp || weather?.temperature || "29");

  // Determine Current Season in Odisha (Kharif: June-Oct, Rabi: Nov-Feb, Zaid/Summer: Mar-May)
  const month = new Date().getMonth() + 1; // 1-12
  const season = month >= 6 && month <= 10 ? "Kharif" : month >= 11 || month <= 2 ? "Rabi" : "Zaid (Summer)";

  const recommendations = [];

  // Crop 1: Paddy / Rice (Ideal for Odisha Kharif, Clay/Loam soil, Rain-fed or Canal)
  let riceScore = 75;
  const riceReasons = [];

  if (season === "Kharif") {
    riceScore += 10;
    riceReasons.push("Optimal seasonal alignment (Kharif monsoon season)");
  }
  if (texture.includes("loam") || texture.includes("clay")) {
    riceScore += 8;
    riceReasons.push("Soil visual texture indicates good moisture retention for paddy");
  }
  if (rainNext7Days > 25 || irrigation === "Canal" || irrigation === "Borewell") {
    riceScore += 7;
    riceReasons.push(`Sufficient water access (${irrigation} irrigation / expected rainfall: ${rainNext7Days.toFixed(0)}mm)`);
  } else {
    riceScore -= 12;
    riceReasons.push("High water requirement; monitor dry spells closely under rain-fed conditions");
  }

  recommendations.push({
    crop: "Rice (Paddy)",
    score: Math.min(Math.max(riceScore, 50), 95),
    icon: "🌾",
    category: "Cereal Grain",
    seasonCompatibility: season,
    reasons: riceReasons,
    careGuidance: {
      water: "Maintain 2–5 cm water depth during tillering stage. Drain field 10 days before harvest.",
      sowing: "Transplant 21–25 day old seedlings with 20x15 cm spacing.",
      fertilization: "Apply nitrogen in 3 split doses (basal, tillering, panicle initiation). Use lab test for exact kg/ha.",
      weedManagement: "Perform mechanical weeding or apply recommended pre-emergence herbicide within 3 days of transplanting.",
      pestMonitoring: "Inspect weekly for Stem Borer and Brown Planthopper (BPH).",
      diseaseMonitoring: "Watch for Blast and Bacterial Leaf Blight symptoms following heavy rainfall.",
      weatherPrecautions: "Ensure field drainage outlets are clear when heavy rainfall alerts (>50mm) are active.",
      harvestGuidance: "Harvest when 80-85% of grains in panicles turn golden yellow."
    }
  });

  // Crop 2: Maize (Corn)
  let maizeScore = 70;
  const maizeReasons = [];

  if (texture.includes("loam") || texture.includes("sandy")) {
    maizeScore += 10;
    maizeReasons.push("Friable loam texture promotes healthy root penetration");
  }
  if (moistureScore >= 50 && moistureScore <= 85) {
    maizeScore += 8;
    maizeReasons.push("Balanced moisture appearance avoids root waterlogging");
  }
  if (temp >= 22 && temp <= 35) {
    maizeScore += 5;
    maizeReasons.push(`Ideal climate temperature (${temp}°C) in ${district}`);
  }

  recommendations.push({
    crop: "Maize (Corn)",
    score: Math.min(Math.max(maizeScore, 45), 90),
    icon: "🌽",
    category: "Coarse Cereal",
    seasonCompatibility: "Kharif / Rabi",
    reasons: maizeReasons,
    careGuidance: {
      water: "Sensitive to waterlogging. Ensure ridging to drain excess rain.",
      sowing: "Sow seeds at 5 cm depth with 60x20 cm row spacing.",
      fertilization: "Apply balanced basal organic manure along with lab-guided NPK schedule.",
      weedManagement: "Keep field weed-free during first 30–45 days after emergence.",
      pestMonitoring: "Scout leaves for Fall Armyworm (FAW) egg masses or whorl damage.",
      diseaseMonitoring: "Check for Turcicum Leaf Blight in cool humid weather.",
      weatherPrecautions: "Avoid water accumulation near root zones during heavy downpours.",
      harvestGuidance: "Harvest when cob husk turns dry brown and silk is fully dried."
    }
  });

  // Crop 3: Pulses (Green Gram / Black Gram)
  let pulseScore = 68;
  const pulseReasons = [];

  if (moistureScore < 60 || irrigation === "Rain-fed") {
    pulseScore += 12;
    pulseReasons.push("Highly drought-tolerant crop suitable for moderate dryness");
  }
  if (farmerInputs?.previousCrop === "Rice") {
    pulseScore += 10;
    pulseReasons.push("Excellent rice-fallow rotation crop; enriches soil nitrogen naturally");
  }
  pulseReasons.push("Improves soil fertility via root nodule nitrogen fixation");

  recommendations.push({
    crop: "Green Gram (Moong)",
    score: Math.min(Math.max(pulseScore, 50), 92),
    icon: "🫘",
    category: "Pulse / Legume",
    seasonCompatibility: "Rabi / Zaid",
    reasons: pulseReasons,
    careGuidance: {
      water: "Requires minimal irrigation; 1–2 light irrigations at flowering & pod filling.",
      sowing: "Line sowing at 30x10 cm spacing. Treat seeds with Rhizobium culture.",
      fertilization: "Basal application of organic compost & single super phosphate (SSP) based on lab test.",
      weedManagement: "One hand weeding at 20–25 days after sowing.",
      pestMonitoring: "Inspect for Aphids and Pod Borer during flowering stage.",
      diseaseMonitoring: "Watch for Yellow Mosaic Virus (YMV) transmitted by whiteflies.",
      weatherPrecautions: "Protect mature pods from unexpected wet weather to avoid seed sprouting.",
      harvestGuidance: "Pick pods in 2–3 flushes when 80% turn dark brown/black."
    }
  });

  // Crop 4: Vegetables (Tomato / Brinjal / Chilli)
  let vegScore = 65;
  const vegReasons = [];

  if (irrigation === "Borewell" || irrigation === "Drip" || irrigation === "Pond") {
    vegScore += 15;
    vegReasons.push(`Controlled ${irrigation} irrigation supports high-yield vegetable crops`);
  }
  if (visualAnalysis?.organicMatterAppearance?.value?.includes("High") || visualAnalysis?.organicMatterAppearance?.value?.includes("Moderate")) {
    vegScore += 8;
    vegReasons.push("Visible organic residue benefits vegetable crop root development");
  } else {
    vegScore -= 5;
  }

  recommendations.push({
    crop: "Vegetables (Tomato / Chilli)",
    score: Math.min(Math.max(vegScore, 40), 88),
    icon: "🍅",
    category: "Horticulture",
    seasonCompatibility: "All Seasons",
    reasons: vegReasons,
    careGuidance: {
      water: "Adopt drip irrigation or raised bed furrow irrigation to maintain steady soil moisture.",
      sowing: "Raise healthy nursery transplants; transplant in raised beds with mulch.",
      fertilization: "Apply well-decomposed FYM (Farm Yard Manure) + vermicompost. Follow soil lab testing.",
      weedManagement: "Use plastic mulching or manual hoeing between raised rows.",
      pestMonitoring: "Monitor for Whiteflies, Fruit Borer, and Thrips regularly.",
      diseaseMonitoring: "Prevent Damping-off and Early Blight by using raised nursery beds.",
      weatherPrecautions: "Provide support staking for tomato plants against strong winds.",
      harvestGuidance: "Harvest fruits at breaker to light red stage for longer shelf life."
    }
  });

  // Sort recommendations by score descending
  recommendations.sort((a, b) => b.score - a.score);

  // Generate Tailored Soil Care Advice based on visual findings
  const soilCareAdvice = [];

  if (visualAnalysis?.apparentMoisture?.value?.toLowerCase().includes("dry")) {
    soilCareAdvice.push("Moisture Management: Apply crop straw mulch (5–7 cm thickness) to conserve surface soil moisture and lower canopy temperature.");
  }
  if (visualAnalysis?.surfaceCondition?.compaction?.toLowerCase().includes("possible") || visualAnalysis?.surfaceCondition?.compaction?.toLowerCase().includes("high")) {
    soilCareAdvice.push("Compaction Relief: Consider shallow subsoiling or chisel plowing between crop cycles to break hardpan layer and improve root aeration.");
  }
  if (visualAnalysis?.organicMatterAppearance?.value?.toLowerCase().includes("low")) {
    soilCareAdvice.push("Organic Enhancement: Incorporate green manure crops (e.g. Dhaincha/Sunn hemp) or apply 5–8 tonnes/ha of well-decomposed FYM/vermicompost.");
  }
  soilCareAdvice.push("Crop Rotation: Alternate cereal crops (paddy/maize) with leguminous pulses (moong/biri) to restore natural soil biology.");
  soilCareAdvice.push("Laboratory Soil Test: Take a 15-cm composite soil core sample from 5 spots across your field and submit to nearest Odisha Govt Soil Lab for exact pH & NPK testing.");

  return {
    cropRecommendations: recommendations,
    soilCareAdvice,
    weatherContext: {
      rainfall: `${rainNext7Days.toFixed(1)} mm (7-Day Forecast)`,
      temperature: `${temp}°C`,
      drySpellRisk: rainNext7Days < 10 ? "Elevated Dry Spell Risk" : "Low Dry Spell Risk",
      insight: generateWeatherSoilInsight(moistureScore, rainNext7Days, irrigation)
    }
  };
};

function generateWeatherSoilInsight(moistureScore, rain7Days, irrigation) {
  if (moistureScore < 50 && rain7Days < 15) {
    return `Your soil visually appears dry, and rainfall over the next 7 days is limited (${rain7Days.toFixed(0)}mm). Prioritize supplementary ${irrigation} irrigation or moisture-conserving straw mulch.`;
  }
  if (rain7Days >= 40) {
    return `Substantial rainfall (${rain7Days.toFixed(0)}mm) is expected over the coming days in your block. Hold off on heavy irrigation and clean field drainage channels to prevent root waterlogging.`;
  }
  return `Moderate moisture levels aligned with local weather patterns. Soil condition is favorable for land preparation and sowing.`;
}
