/**
 * Historical Monsoon Performance Dataset (2021 - 2026 Prototype Analysis)
 * Climatological baseline and retrospective validation for Odisha coastal blocks
 */

const historicalData = {
  baseline: {
    normal_seasonal_rainfall_mm: 1150.0,
    normal_onset_date: "June 10",
    normal_longest_dry_spell_days: 6,
    climatology_period: "1991-2020 IMD Normals"
  },
  yearly_records: [
    {
      year: 2021,
      seasonal_rainfall_mm: 1069.5,
      rainfall_anomaly_percent: -7.0,
      onset_date: "June 12",
      onset_delay_days: 2,
      longest_dry_spell_days: 8,
      heavy_rain_days_count: 5,
      monsoon_type: "Near Normal with Late Mid-July Break",
      crop_impact: "Mild nursery delay, compensated by late August low-pressure rains."
    },
    {
      year: 2022,
      seasonal_rainfall_mm: 1196.0,
      rainfall_anomaly_percent: 4.0,
      onset_date: "June 08",
      onset_delay_days: -2,
      longest_dry_spell_days: 5,
      heavy_rain_days_count: 8,
      monsoon_type: "Timely & Favorable Distribution",
      crop_impact: "Bumper paddy transplanting across coastal districts."
    },
    {
      year: 2023,
      seasonal_rainfall_mm: 1012.0,
      rainfall_anomaly_percent: -12.0,
      onset_date: "June 18",
      onset_delay_days: 8,
      longest_dry_spell_days: 14,
      heavy_rain_days_count: 3,
      monsoon_type: "El Niño Influenced Deficit & Prolonged August Break",
      crop_impact: "Significant moisture stress in upland non-irrigated paddy belts."
    },
    {
      year: 2024,
      seasonal_rainfall_mm: 1242.0,
      rainfall_anomaly_percent: 8.0,
      onset_date: "June 09",
      onset_delay_days: -1,
      longest_dry_spell_days: 6,
      heavy_rain_days_count: 9,
      monsoon_type: "La Niña Modulated Surplus",
      crop_impact: "Localized waterlogging in deltaic lowlands (Kendrapara/Puri)."
    },
    {
      year: 2025,
      seasonal_rainfall_mm: 1092.5,
      rainfall_anomaly_percent: -5.0,
      onset_date: "June 14",
      onset_delay_days: 4,
      longest_dry_spell_days: 9,
      heavy_rain_days_count: 6,
      monsoon_type: "Neutral ENSO with Sub-regional Variations",
      crop_impact: "Normal yields with localized supplementary irrigation in uplands."
    },
    {
      year: 2026,
      seasonal_rainfall_mm: 943.0,
      rainfall_anomaly_percent: -18.0,
      onset_date: "June 19",
      onset_delay_days: 9,
      longest_dry_spell_days: 16,
      heavy_rain_days_count: 4,
      monsoon_type: "Active Dry Spell (Prototype Scenario)",
      crop_impact: "Extended break conditions requiring proactive delayed sowing advisories."
    }
  ],
  block_comparisons: [
    { block: "Rajkanika", avg_rainfall_mm: 1210, vulnerability_index: "High (Coastal Dry Breaks)", flood_risk: "Moderate" },
    { block: "Mahakalapada", avg_rainfall_mm: 1340, vulnerability_index: "Moderate", flood_risk: "Very High" },
    { block: "Aul", avg_rainfall_mm: 1180, vulnerability_index: "High", flood_risk: "Moderate" },
    { block: "Cuttack Sadar", avg_rainfall_mm: 1120, vulnerability_index: "Very High (Upland Stress)", flood_risk: "Low" },
    { block: "Bhubaneswar", avg_rainfall_mm: 1150, vulnerability_index: "High", flood_risk: "Low" },
    { block: "Paradip", avg_rainfall_mm: 1420, vulnerability_index: "Low", flood_risk: "High" }
  ]
};

export default historicalData;

