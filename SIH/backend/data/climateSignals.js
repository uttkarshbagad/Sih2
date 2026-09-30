/**
 * Climate Signals Dataset: Large-scale atmospheric and oceanic drivers
 * ENSO (Nino 3.4), IOD (Dipole Mode Index), MJO (Madden-Julian Oscillation), Equatorial Waves
 */

const climateSignals = {
  timestamp: new Date().toISOString(),
  enso: {
    index_name: "Niño 3.4 SST Anomaly",
    value: 0.8,
    unit: "°C departure",
    status: "Warm Anomaly (El Niño Watch)",
    strength: "Weak-to-Moderate",
    historical_baseline: "1991-2020 OISST.v2 Climatology",
    description: "Positive Sea Surface Temperature anomalies persist across the central-eastern equatorial Pacific. This Walker circulation shift suppresses convection over peninsular and eastern India.",
    regional_impact: "Tends to elevate break/dry-spell probabilities by 18-24% and delay organized onset progression."
  },
  iod: {
    index_name: "Indian Ocean Dipole (DMI)",
    value: -0.4,
    unit: "°C Dipole Index",
    status: "Negative IOD",
    strength: "Moderate",
    description: "Cooler sea-surface temperatures in the western tropical Indian Ocean relative to eastern Indonesian waters suppress cross-equatorial southwesterly moisture surges into the Bay of Bengal.",
    regional_impact: "Reduces atmospheric moisture transport to Odisha coastal blocks, increasing mid-monsoon dry intervals."
  },
  mjo: {
    index_name: "Madden-Julian Oscillation (RMM Index)",
    phase: 4,
    amplitude: 1.48,
    status: "Active (Phase 4 - Maritime Continent / Bay of Bengal)",
    propagation_speed: "3.8 m/s Eastward",
    description: "The convective envelope is currently centered over the eastern Indian Ocean and Maritime Continent. Favorable for localized low-pressure formations and short convective showers.",
    regional_impact: "Provides temporary windows of light-to-moderate rain (3-5 days) buffering against macro El Niño subsidence."
  },
  equatorial_waves: {
    kelvin_wave: {
      status: "Active Eastward Phase",
      impact: "Enhances localized upper-level divergence"
    },
    rossby_wave: {
      status: "Weak Western Pacific Signature",
      impact: "Slow low-level vortex formation"
    }
  },
  pipeline_flow: [
    {
      step: 1,
      title: "Global Ocean-Atmospheric Drivers",
      description: "ENSO (+0.8°C), IOD (-0.4°C), MJO (Phase 4, Amp 1.48) observed via satellite altimetry & buoy arrays."
    },
    {
      step: 2,
      title: "Synoptic Moisture Flux Simulation",
      description: "Regional weather gridded numerical models (IMD GFS / NCMRWF NCUM 12km) compute wind sheer & precipitable water."
    },
    {
      step: 3,
      title: "AI / ML Probabilistic Downscaling",
      description: "Calibrated ensemble model maps teleconnections + local soil moisture & topography to village/block coordinates."
    },
    {
      step: 4,
      title: "Hyperlocal Risk Assessment",
      description: "Probabilistic classification of Onset (76%), Dry Break Spell (68%), and Heavy Rain (29%) for Rajkanika block."
    },
    {
      step: 5,
      title: "Crop Advisory & Farmer Broadcast",
      description: "Rules engine generates localized agro-advisories (Odia, Hindi, English) dispatched via SMS and WhatsApp."
    }
  ]
};

export default climateSignals;


/** Teleconnections: ENSO, IOD, MJO & Equatorial Waves Schema */
