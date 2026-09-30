/**
 * Officer Alerts Feed Dataset
 * Tracks active meteorological triggers for officers across blocks
 */

let officerAlerts = [
  {
    id: "alert-001",
    severity: "HIGH",
    severity_color: "red",
    icon: "AlertTriangle",
    block: "Rajkanika",
    district: "Kendrapara",
    title: "High Dry-Spell Probability Detected",
    metric_label: "Break Probability",
    metric_value: "68%",
    message: "Rainfall deficit (-24%) combined with El Niño teleconnection elevates 10-14 day dry spell risk. Recommend issuing delayed sowing advisory for paddy.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: "ACTIVE", // ACTIVE or ACKNOWLEDGED
    action_suggested: "Send Delayed Sowing Advisory to Rajkanika Farmers"
  },
  {
    id: "alert-002",
    severity: "HIGH",
    severity_color: "cyan",
    icon: "CloudRain",
    block: "Mahakalapada",
    district: "Kendrapara",
    title: "Heavy Inundation & Coastal Congestion Risk",
    metric_label: "Heavy Rain Probability",
    metric_value: "68%",
    message: "High probability of convective squalls (>65mm) in low-lying delta tracts. Risk of nursery submergence and coastal runoff backflow.",
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    status: "ACTIVE",
    action_suggested: "Issue Drainage Clearing & Bund Reinforcement Advisory"
  },
  {
    id: "alert-003",
    severity: "MODERATE",
    severity_color: "amber",
    icon: "Compass",
    block: "Aul",
    district: "Kendrapara",
    title: "Monsoon Onset Confidence Declining",
    metric_label: "Confidence Score",
    metric_value: "54%",
    message: "Transitional wind shear over lower Mahanadi basin creating variability. Recommend close 48-hour radar tracking before seed distribution.",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: "ACKNOWLEDGED",
    action_suggested: "Monitor Radar Reflectivity and Next NCMRWF Model Run"
  },
  {
    id: "alert-004",
    severity: "VERY HIGH",
    severity_color: "red",
    icon: "Flame",
    block: "Athagarh",
    district: "Cuttack",
    title: "Critical Upland Soil Moisture Deficit",
    metric_label: "Soil Moisture",
    metric_value: "18% (Severe Stress)",
    message: "Topsoil desiccation risk high. Non-irrigated upland farmers should switch to short-duration pulses or drought-tolerant coarse cereals.",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: "ACTIVE",
    action_suggested: "Promote Alternative Crop Package (Moong/Arhar)"
  }
];

const getAlerts = () => officerAlerts;

const acknowledgeAlert = (alertId) => {
  const alert = officerAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = "ACKNOWLEDGED";
    return alert;
  }
  return null;
};

export {
  officerAlerts,
  getAlerts,
  acknowledgeAlert
};


/** Officer Command Center Alert Feed Data Model */
