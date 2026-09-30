import fs from 'fs';

const locations = [
  // Kendrapara District
  {
    id: 'od-kendrapara-rajkanika', state: 'Odisha', district: 'Kendrapara', block: 'Rajkanika',
    panchayats: ['Dangarpatna', 'Katana', 'Barunadiha', 'Meghapur', 'Baghabuda', 'Tarasahi', 'Jaynagar', 'Nanpur', 'Jagulaipada'],
    coordinates: { lat: 20.712, lon: 86.784 }, elevation_m: 12, agro_zone: 'East Coastal Plain', soil_type: 'Coastal Alluvial',
    metrics: { temperature_c: 34.2, humidity_percent: 65, rainfall_24h_mm: 2.4, rainfall_15d_cumulative_mm: 32, rainfall_anomaly_percent: -24, soil_moisture_level: 'Low', soil_moisture_fraction: 0.22, expected_rainfall_7d: 54, expected_rainfall_14d: 112, expected_rainfall_21d: 141, expected_rainfall_30d: 163, onset_probability: 0.76, break_probability: 0.68, heavy_rain_probability: 0.29, confidence: 0.81, dominant_risk: 'HIGH', risk_factor: 'Extended Dry Spell' }
  },
  {
    id: 'od-kendrapara-aul', state: 'Odisha', district: 'Kendrapara', block: 'Aul',
    panchayats: ['Demal', 'Govindpur', 'Batipada', 'Keredagarh', 'Sanmangala', 'Sansar'],
    coordinates: { lat: 20.674, lon: 86.643 }, elevation_m: 15, agro_zone: 'Coastal Plain', soil_type: 'Deltaic Alluvial',
    metrics: { temperature_c: 33.8, humidity_percent: 68, rainfall_24h_mm: 5.1, rainfall_15d_cumulative_mm: 41, rainfall_anomaly_percent: -16, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.31, expected_rainfall_7d: 48, expected_rainfall_14d: 98, expected_rainfall_21d: 135, expected_rainfall_30d: 172, onset_probability: 0.72, break_probability: 0.54, heavy_rain_probability: 0.33, confidence: 0.74, dominant_risk: 'MODERATE', risk_factor: 'Intermittent Showers' }
  },
  {
    id: 'od-kendrapara-mahakalapada', state: 'Odisha', district: 'Kendrapara', block: 'Mahakalapada',
    panchayats: ['Ramnagar', 'Jambu', 'Batighar', 'Kharinasi', 'Barada'],
    coordinates: { lat: 20.428, lon: 86.685 }, elevation_m: 8, agro_zone: 'Coastal Mangrove', soil_type: 'Coastal Saline Clay',
    metrics: { temperature_c: 32.5, humidity_percent: 82, rainfall_24h_mm: 22, rainfall_15d_cumulative_mm: 78, rainfall_anomaly_percent: 18, soil_moisture_level: 'High', soil_moisture_fraction: 0.44, expected_rainfall_7d: 88, expected_rainfall_14d: 165, expected_rainfall_21d: 215, expected_rainfall_30d: 280, onset_probability: 0.88, break_probability: 0.22, heavy_rain_probability: 0.68, confidence: 0.84, dominant_risk: 'HIGH', risk_factor: 'Heavy Inundation & Coastal Drainage Congestion' }
  },
  {
    id: 'od-kendrapara-pattamundai', state: 'Odisha', district: 'Kendrapara', block: 'Pattamundai',
    panchayats: ['Andhara', 'Bachharai', 'Alapua', 'Dosia', 'Srirampur', 'Damarpur'],
    coordinates: { lat: 20.573, lon: 86.568 }, elevation_m: 14, agro_zone: 'Coastal Plain', soil_type: 'Alluvial Clay Loam',
    metrics: { temperature_c: 33.5, humidity_percent: 71, rainfall_24h_mm: 4.8, rainfall_15d_cumulative_mm: 46, rainfall_anomaly_percent: -10, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.33, expected_rainfall_7d: 58, expected_rainfall_14d: 118, expected_rainfall_21d: 160, expected_rainfall_30d: 205, onset_probability: 0.79, break_probability: 0.41, heavy_rain_probability: 0.38, confidence: 0.79, dominant_risk: 'MODERATE', risk_factor: 'Normal Onset' }
  },
  {
    id: 'od-kendrapara-marshaghai', state: 'Odisha', district: 'Kendrapara', block: 'Marshaghai',
    panchayats: ['Berhampur', 'Karatutha', 'Dumuka', 'Manikunda', 'Angulai'],
    coordinates: { lat: 20.463, lon: 86.512 }, elevation_m: 11, agro_zone: 'Coastal Plain', soil_type: 'Fine Alluvial',
    metrics: { temperature_c: 33.0, humidity_percent: 74, rainfall_24h_mm: 12, rainfall_15d_cumulative_mm: 62, rainfall_anomaly_percent: 4, soil_moisture_level: 'High', soil_moisture_fraction: 0.39, expected_rainfall_7d: 64, expected_rainfall_14d: 132, expected_rainfall_21d: 180, expected_rainfall_30d: 230, onset_probability: 0.84, break_probability: 0.28, heavy_rain_probability: 0.45, confidence: 0.82, dominant_risk: 'LOW', risk_factor: 'Stable Moisture' }
  },
  {
    id: 'od-kendrapara-sadar', state: 'Odisha', district: 'Kendrapara', block: 'Kendrapara Sadar',
    panchayats: ['Kendrapara Town', 'Derabish', 'Garadpur', 'Kagaznagar', 'Chagala', 'Nial'],
    coordinates: { lat: 20.501, lon: 86.422 }, elevation_m: 13, agro_zone: 'Coastal Plain', soil_type: 'Alluvial Loam',
    metrics: { temperature_c: 33.6, humidity_percent: 70, rainfall_24h_mm: 6.0, rainfall_15d_cumulative_mm: 50, rainfall_anomaly_percent: -5, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.32, expected_rainfall_7d: 55, expected_rainfall_14d: 115, expected_rainfall_21d: 158, expected_rainfall_30d: 200, onset_probability: 0.80, break_probability: 0.35, heavy_rain_probability: 0.36, confidence: 0.80, dominant_risk: 'LOW', risk_factor: 'Favorable Conditions' }
  },

  // Khordha District
  {
    id: 'od-khordha-bhubaneswar', state: 'Odisha', district: 'Khordha', block: 'Bhubaneswar',
    panchayats: ['Patia', 'Mancheswar', 'Baramunda', 'Tamando', 'Dhauli', 'Chandaka', 'Khandagiri', 'Sundarpada', 'Pahala', 'Raghunathpur', 'Bhuasuni', 'Kalinga Nagar', 'Infocity'],
    coordinates: { lat: 20.296, lon: 85.824 }, elevation_m: 45, agro_zone: 'East Coast Uplands', soil_type: 'Lateritic Loamy Sand',
    metrics: { temperature_c: 34.6, humidity_percent: 64, rainfall_24h_mm: 1.5, rainfall_15d_cumulative_mm: 31, rainfall_anomaly_percent: -26, soil_moisture_level: 'Low', soil_moisture_fraction: 0.21, expected_rainfall_7d: 42, expected_rainfall_14d: 88, expected_rainfall_21d: 126, expected_rainfall_30d: 158, onset_probability: 0.71, break_probability: 0.65, heavy_rain_probability: 0.24, confidence: 0.79, dominant_risk: 'HIGH', risk_factor: 'Rapid Soil Moisture Depletion' }
  },
  {
    id: 'od-khordha-jatani', state: 'Odisha', district: 'Khordha', block: 'Jatani',
    panchayats: ['Kantabad', 'Khurdha Road', 'Kudiary', 'Padanpur', 'Jatani Town', 'Bachharat', 'Harirajpur', 'Retang'],
    coordinates: { lat: 20.165, lon: 85.704 }, elevation_m: 52, agro_zone: 'Laterite Belt', soil_type: 'Red Laterite',
    metrics: { temperature_c: 34.9, humidity_percent: 61, rainfall_24h_mm: 0, rainfall_15d_cumulative_mm: 26, rainfall_anomaly_percent: -34, soil_moisture_level: 'Low', soil_moisture_fraction: 0.19, expected_rainfall_7d: 36, expected_rainfall_14d: 78, expected_rainfall_21d: 114, expected_rainfall_30d: 144, onset_probability: 0.67, break_probability: 0.71, heavy_rain_probability: 0.20, confidence: 0.77, dominant_risk: 'HIGH', risk_factor: 'Prolonged Dry Period' }
  },
  {
    id: 'od-khordha-sadar', state: 'Odisha', district: 'Khordha', block: 'Khordha Sadar',
    panchayats: ['Gurujanga', 'Kaipadar', 'Orkal', 'Tangiapada', 'Malipada', 'Bajpur', 'Jankia', 'Nirakarpur', 'Khordha Town'],
    coordinates: { lat: 20.181, lon: 85.621 }, elevation_m: 58, agro_zone: 'Mid Central Uplands', soil_type: 'Red Gravelly Clay',
    metrics: { temperature_c: 35.1, humidity_percent: 60, rainfall_24h_mm: 0.5, rainfall_15d_cumulative_mm: 28, rainfall_anomaly_percent: -30, soil_moisture_level: 'Low', soil_moisture_fraction: 0.20, expected_rainfall_7d: 38, expected_rainfall_14d: 82, expected_rainfall_21d: 120, expected_rainfall_30d: 150, onset_probability: 0.68, break_probability: 0.70, heavy_rain_probability: 0.21, confidence: 0.78, dominant_risk: 'HIGH', risk_factor: 'High Dry Spell Risk' }
  },
  {
    id: 'od-khordha-balianta', state: 'Odisha', district: 'Khordha', block: 'Balianta',
    panchayats: ['Baluakati', 'Benupur', 'Jayadev', 'Banamalipur', 'Satyabhamapur', 'Purushottampur', 'Prataprudrapur'],
    coordinates: { lat: 20.245, lon: 85.912 }, elevation_m: 28, agro_zone: 'Riverine Floodplain', soil_type: 'Alluvial Loam',
    metrics: { temperature_c: 34.0, humidity_percent: 67, rainfall_24h_mm: 3.5, rainfall_15d_cumulative_mm: 40, rainfall_anomaly_percent: -12, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.30, expected_rainfall_7d: 50, expected_rainfall_14d: 102, expected_rainfall_21d: 144, expected_rainfall_30d: 184, onset_probability: 0.76, break_probability: 0.52, heavy_rain_probability: 0.30, confidence: 0.79, dominant_risk: 'MODERATE', risk_factor: 'Moderate Moisture Availability' }
  },
  {
    id: 'od-khordha-balipatna', state: 'Odisha', district: 'Khordha', block: 'Balipatna',
    panchayats: ['Balipatna', 'Bhapur', 'Rajas', 'Turintira', 'Majhihara', 'Pamana', 'Bamanala'],
    coordinates: { lat: 20.178, lon: 85.954 }, elevation_m: 24, agro_zone: 'Kushabhadra River Basin', soil_type: 'Fine Alluvial',
    metrics: { temperature_c: 33.8, humidity_percent: 69, rainfall_24h_mm: 4.2, rainfall_15d_cumulative_mm: 44, rainfall_anomaly_percent: -8, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.32, expected_rainfall_7d: 54, expected_rainfall_14d: 110, expected_rainfall_21d: 152, expected_rainfall_30d: 195, onset_probability: 0.78, break_probability: 0.46, heavy_rain_probability: 0.34, confidence: 0.80, dominant_risk: 'LOW', risk_factor: 'Balanced Rainfall' }
  },
  {
    id: 'od-khordha-tangi', state: 'Odisha', district: 'Khordha', block: 'Tangi',
    panchayats: ['Tangi', 'Kuhudi', 'Olasingha', 'Bhushandpur', 'Chandeswar', 'Saranakul', 'Kapasagaria'],
    coordinates: { lat: 19.988, lon: 85.412 }, elevation_m: 35, agro_zone: 'Chilika Coastal Belt', soil_type: 'Coastal Alluvial Loam',
    metrics: { temperature_c: 33.5, humidity_percent: 74, rainfall_24h_mm: 9.0, rainfall_15d_cumulative_mm: 58, rainfall_anomaly_percent: 4, soil_moisture_level: 'High', soil_moisture_fraction: 0.37, expected_rainfall_7d: 62, expected_rainfall_14d: 125, expected_rainfall_21d: 172, expected_rainfall_30d: 218, onset_probability: 0.82, break_probability: 0.34, heavy_rain_probability: 0.44, confidence: 0.82, dominant_risk: 'LOW', risk_factor: 'Chilika Lake Moisture Influx' }
  },
  {
    id: 'od-khordha-banpur', state: 'Odisha', district: 'Khordha', block: 'Banpur',
    panchayats: ['Banpur', 'Nachuni', 'Gambharimunda', 'Balugaon', 'Niladriprasad', 'Bishnupur', 'Bhetanati'],
    coordinates: { lat: 19.782, lon: 85.184 }, elevation_m: 42, agro_zone: 'South Coastal Foothills', soil_type: 'Lateritic Alluvium',
    metrics: { temperature_c: 33.2, humidity_percent: 76, rainfall_24h_mm: 11.5, rainfall_15d_cumulative_mm: 64, rainfall_anomaly_percent: 8, soil_moisture_level: 'High', soil_moisture_fraction: 0.39, expected_rainfall_7d: 68, expected_rainfall_14d: 135, expected_rainfall_21d: 185, expected_rainfall_30d: 235, onset_probability: 0.84, break_probability: 0.28, heavy_rain_probability: 0.48, confidence: 0.83, dominant_risk: 'LOW', risk_factor: 'Good Soil Moisture Retention' }
  },
  {
    id: 'od-khordha-begunia', state: 'Odisha', district: 'Khordha', block: 'Begunia',
    panchayats: ['Begunia', 'Bolagarh', 'Pichukuli', 'Durgapur', 'Kantabada', 'Sagarguan', 'Deuli'],
    coordinates: { lat: 20.214, lon: 85.478 }, elevation_m: 62, agro_zone: 'Mid Tableland', soil_type: 'Red Clay Loam',
    metrics: { temperature_c: 35.0, humidity_percent: 59, rainfall_24h_mm: 0.8, rainfall_15d_cumulative_mm: 25, rainfall_anomaly_percent: -32, soil_moisture_level: 'Low', soil_moisture_fraction: 0.18, expected_rainfall_7d: 34, expected_rainfall_14d: 74, expected_rainfall_21d: 108, expected_rainfall_30d: 138, onset_probability: 0.65, break_probability: 0.74, heavy_rain_probability: 0.18, confidence: 0.76, dominant_risk: 'HIGH', risk_factor: 'Critical Topsoil Desiccation' }
  },
  {
    id: 'od-khordha-bolagarh', state: 'Odisha', district: 'Khordha', block: 'Bolagarh',
    panchayats: ['Bolagarh', 'Manikagoda', 'Sanapadar', 'Gopalpur', 'Dhabaleswar', 'Khadapada'],
    coordinates: { lat: 20.185, lon: 85.342 }, elevation_m: 68, agro_zone: 'Western Hilly Border', soil_type: 'Red Laterite & Gravel',
    metrics: { temperature_c: 35.3, humidity_percent: 58, rainfall_24h_mm: 0.0, rainfall_15d_cumulative_mm: 22, rainfall_anomaly_percent: -36, soil_moisture_level: 'Low', soil_moisture_fraction: 0.17, expected_rainfall_7d: 32, expected_rainfall_14d: 70, expected_rainfall_21d: 102, expected_rainfall_30d: 132, onset_probability: 0.63, break_probability: 0.76, heavy_rain_probability: 0.16, confidence: 0.75, dominant_risk: 'VERY HIGH', risk_factor: 'Severe Upland Water Stress' }
  },

  // Cuttack District
  {
    id: 'od-cuttack-sadar', state: 'Odisha', district: 'Cuttack', block: 'Cuttack Sadar',
    panchayats: ['Telengapentha', 'Kalyani Nagar', 'Bandalo', 'Bidyadharpur', 'Chauliaganj', 'Jobra', 'Madhupatna', 'Gopalpur'],
    coordinates: { lat: 20.462, lon: 85.883 }, elevation_m: 36, agro_zone: 'Central Alluvial Plain', soil_type: 'Riverine Alluvial',
    metrics: { temperature_c: 34.8, humidity_percent: 63, rainfall_24h_mm: 0, rainfall_15d_cumulative_mm: 28, rainfall_anomaly_percent: -32, soil_moisture_level: 'Low', soil_moisture_fraction: 0.20, expected_rainfall_7d: 38, expected_rainfall_14d: 82, expected_rainfall_21d: 118, expected_rainfall_30d: 148, onset_probability: 0.69, break_probability: 0.72, heavy_rain_probability: 0.21, confidence: 0.78, dominant_risk: 'HIGH', risk_factor: 'Severe Dry Spell Risk' }
  },
  {
    id: 'od-cuttack-athagarh', state: 'Odisha', district: 'Cuttack', block: 'Athagarh',
    panchayats: ['Radhakishorepur', 'Khuntuni', 'Dorada', 'Kandarapur', 'Bentakar', 'Gurudijhatia', 'Athagarh Town'],
    coordinates: { lat: 20.531, lon: 85.625 }, elevation_m: 55, agro_zone: 'Mid Central Table Land', soil_type: 'Red & Laterite Loam',
    metrics: { temperature_c: 35.4, humidity_percent: 59, rainfall_24h_mm: 0, rainfall_15d_cumulative_mm: 22, rainfall_anomaly_percent: -38, soil_moisture_level: 'Low', soil_moisture_fraction: 0.18, expected_rainfall_7d: 32, expected_rainfall_14d: 74, expected_rainfall_21d: 106, expected_rainfall_30d: 136, onset_probability: 0.64, break_probability: 0.75, heavy_rain_probability: 0.18, confidence: 0.76, dominant_risk: 'VERY HIGH', risk_factor: 'Moisture Stress' }
  },
  {
    id: 'od-cuttack-salipur', state: 'Odisha', district: 'Cuttack', block: 'Salipur',
    panchayats: ['Bhatapada', 'Choudwar', 'Kishorenagar', 'Sisua', 'Salipur Town', 'Tangi-Choudwar', 'Bahugram'],
    coordinates: { lat: 20.485, lon: 86.012 }, elevation_m: 30, agro_zone: 'Central Plain', soil_type: 'Alluvial Loam',
    metrics: { temperature_c: 34.0, humidity_percent: 67, rainfall_24h_mm: 3.2, rainfall_15d_cumulative_mm: 38, rainfall_anomaly_percent: -18, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.28, expected_rainfall_7d: 46, expected_rainfall_14d: 96, expected_rainfall_21d: 138, expected_rainfall_30d: 180, onset_probability: 0.74, break_probability: 0.58, heavy_rain_probability: 0.28, confidence: 0.77, dominant_risk: 'MODERATE', risk_factor: 'Mild Dry Spell' }
  },
  {
    id: 'od-cuttack-banki', state: 'Odisha', district: 'Cuttack', block: 'Banki',
    panchayats: ['Banki', 'Charchika', 'Kalapathar', 'Subarnapur', 'Pathapur', 'Nuagan', 'Rathipur'],
    coordinates: { lat: 20.354, lon: 85.532 }, elevation_m: 48, agro_zone: 'Mahanadi Floodplain', soil_type: 'Alluvial Sand Clay',
    metrics: { temperature_c: 34.5, humidity_percent: 65, rainfall_24h_mm: 2.0, rainfall_15d_cumulative_mm: 32, rainfall_anomaly_percent: -22, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.25, expected_rainfall_7d: 42, expected_rainfall_14d: 90, expected_rainfall_21d: 130, expected_rainfall_30d: 168, onset_probability: 0.72, break_probability: 0.60, heavy_rain_probability: 0.25, confidence: 0.78, dominant_risk: 'MODERATE', risk_factor: 'Germination Water Watch' }
  },
  {
    id: 'od-cuttack-badamba', state: 'Odisha', district: 'Cuttack', block: 'Badamba',
    panchayats: ['Badamba', 'Maniabandha', 'Bhattarika', 'Sankhameri', 'Gopinathpur', 'Khandapada Road'],
    coordinates: { lat: 20.418, lon: 85.385 }, elevation_m: 56, agro_zone: 'Western Tableland', soil_type: 'Red Clay',
    metrics: { temperature_c: 35.2, humidity_percent: 58, rainfall_24h_mm: 0.5, rainfall_15d_cumulative_mm: 24, rainfall_anomaly_percent: -35, soil_moisture_level: 'Low', soil_moisture_fraction: 0.18, expected_rainfall_7d: 35, expected_rainfall_14d: 75, expected_rainfall_21d: 110, expected_rainfall_30d: 140, onset_probability: 0.66, break_probability: 0.72, heavy_rain_probability: 0.19, confidence: 0.76, dominant_risk: 'HIGH', risk_factor: 'Soil Moisture Stress' }
  },
  {
    id: 'od-cuttack-niali', state: 'Odisha', district: 'Cuttack', block: 'Niali',
    panchayats: ['Niali', 'Kasarda', 'Jhabata', 'Nuagaon', 'Bilasuni', 'Eranch'],
    coordinates: { lat: 20.142, lon: 86.058 }, elevation_m: 22, agro_zone: 'Prachi River Delta', soil_type: 'Rich Deltaic Alluvium',
    metrics: { temperature_c: 33.6, humidity_percent: 71, rainfall_24h_mm: 6.0, rainfall_15d_cumulative_mm: 52, rainfall_anomaly_percent: -2, soil_moisture_level: 'High', soil_moisture_fraction: 0.35, expected_rainfall_7d: 58, expected_rainfall_14d: 118, expected_rainfall_21d: 162, expected_rainfall_30d: 208, onset_probability: 0.81, break_probability: 0.38, heavy_rain_probability: 0.38, confidence: 0.81, dominant_risk: 'LOW', risk_factor: 'Good Moisture' }
  },

  // Puri District
  {
    id: 'od-puri-sadar', state: 'Odisha', district: 'Puri', block: 'Puri Sadar',
    panchayats: ['Baliguali', 'Chhaitana', 'Gopinathpur', 'Samanga', 'Chandanpur', 'Biraharekrushnapur', 'Malatipatpur', 'Satasankha'],
    coordinates: { lat: 19.813, lon: 85.831 }, elevation_m: 6, agro_zone: 'Coastal Sand Dune', soil_type: 'Coastal Sandy Alluvial',
    metrics: { temperature_c: 32.8, humidity_percent: 79, rainfall_24h_mm: 14.5, rainfall_15d_cumulative_mm: 68, rainfall_anomaly_percent: 6, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.34, expected_rainfall_7d: 68, expected_rainfall_14d: 142, expected_rainfall_21d: 196, expected_rainfall_30d: 252, onset_probability: 0.86, break_probability: 0.26, heavy_rain_probability: 0.52, confidence: 0.83, dominant_risk: 'LOW', risk_factor: 'Favorable Onset' }
  },
  {
    id: 'od-puri-nimapada', state: 'Odisha', district: 'Puri', block: 'Nimapada',
    panchayats: ['Alipingal', 'Denuan', 'Gopabandhu', 'Terundia', 'Nimapada Town', 'Antuar', 'Nagar', 'Bhagabanpur'],
    coordinates: { lat: 20.061, lon: 86.015 }, elevation_m: 14, agro_zone: 'Coastal Deltaic', soil_type: 'Alluvial Clay Loam',
    metrics: { temperature_c: 33.2, humidity_percent: 72, rainfall_24h_mm: 8.0, rainfall_15d_cumulative_mm: 52, rainfall_anomaly_percent: -4, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.32, expected_rainfall_7d: 56, expected_rainfall_14d: 116, expected_rainfall_21d: 162, expected_rainfall_30d: 210, onset_probability: 0.81, break_probability: 0.38, heavy_rain_probability: 0.36, confidence: 0.80, dominant_risk: 'MODERATE', risk_factor: 'Mid-Season Dry Interval' }
  },
  {
    id: 'od-puri-pipili', state: 'Odisha', district: 'Puri', block: 'Pipili',
    panchayats: ['Pipili Town', 'Teisipur', 'Dhauli-Pipili', 'Danamukundapur', 'Govindpur', 'Kausalaganga'],
    coordinates: { lat: 20.118, lon: 85.832 }, elevation_m: 18, agro_zone: 'Deltaic Alluvial Belt', soil_type: 'Fine Loam',
    metrics: { temperature_c: 33.7, humidity_percent: 70, rainfall_24h_mm: 6.5, rainfall_15d_cumulative_mm: 48, rainfall_anomaly_percent: -6, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.31, expected_rainfall_7d: 52, expected_rainfall_14d: 110, expected_rainfall_21d: 154, expected_rainfall_30d: 198, onset_probability: 0.79, break_probability: 0.42, heavy_rain_probability: 0.32, confidence: 0.80, dominant_risk: 'LOW', risk_factor: 'Stable Progression' }
  },
  {
    id: 'od-puri-gop', state: 'Odisha', district: 'Puri', block: 'Gop',
    panchayats: ['Gop', 'Konark', 'Ramachandi', 'Nagaspur', 'Sutamukhi', 'Liakhia'],
    coordinates: { lat: 19.998, lon: 86.008 }, elevation_m: 10, agro_zone: 'Coastal Bay Belt', soil_type: 'Sandy Coastal Clay',
    metrics: { temperature_c: 32.6, humidity_percent: 81, rainfall_24h_mm: 16.0, rainfall_15d_cumulative_mm: 75, rainfall_anomaly_percent: 15, soil_moisture_level: 'High', soil_moisture_fraction: 0.42, expected_rainfall_7d: 75, expected_rainfall_14d: 150, expected_rainfall_21d: 205, expected_rainfall_30d: 265, onset_probability: 0.88, break_probability: 0.20, heavy_rain_probability: 0.58, confidence: 0.84, dominant_risk: 'MODERATE', risk_factor: 'Coastal Inundation Watch' }
  },
  {
    id: 'od-puri-brahmagiri', state: 'Odisha', district: 'Puri', block: 'Brahmagiri',
    panchayats: ['Brahmagiri', 'Satapada', 'Mirzapur', 'Rebana Nuagaon', 'Panasapada', 'Alarnath'],
    coordinates: { lat: 19.802, lon: 85.648 }, elevation_m: 8, agro_zone: 'Chilika Estuarine', soil_type: 'Saline Sand',
    metrics: { temperature_c: 32.9, humidity_percent: 80, rainfall_24h_mm: 12.0, rainfall_15d_cumulative_mm: 65, rainfall_anomaly_percent: 5, soil_moisture_level: 'High', soil_moisture_fraction: 0.38, expected_rainfall_7d: 66, expected_rainfall_14d: 135, expected_rainfall_21d: 185, expected_rainfall_30d: 240, onset_probability: 0.85, break_probability: 0.25, heavy_rain_probability: 0.48, confidence: 0.82, dominant_risk: 'LOW', risk_factor: 'Chilika Breeze Influence' }
  },

  // Balasore District
  {
    id: 'od-balasore-sadar', state: 'Odisha', district: 'Balasore', block: 'Balasore Sadar',
    panchayats: ['Kuruda', 'Haladipada', 'Chhanpur', 'Srikona', 'Phulwar', 'Rundia', 'Remuna Ghati', 'Kasipada'],
    coordinates: { lat: 21.493, lon: 86.932 }, elevation_m: 18, agro_zone: 'North Eastern Coastal Plain', soil_type: 'Coastal Sandy Alluvium',
    metrics: { temperature_c: 33.6, humidity_percent: 70, rainfall_24h_mm: 6.2, rainfall_15d_cumulative_mm: 48, rainfall_anomaly_percent: -8, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.30, expected_rainfall_7d: 52, expected_rainfall_14d: 110, expected_rainfall_21d: 155, expected_rainfall_30d: 198, onset_probability: 0.78, break_probability: 0.45, heavy_rain_probability: 0.35, confidence: 0.80, dominant_risk: 'MODERATE', risk_factor: 'Moderate Dry Spell Risk' }
  },
  {
    id: 'od-balasore-jaleswar', state: 'Odisha', district: 'Balasore', block: 'Jaleswar',
    panchayats: ['Sugo', 'Kotasahi', 'Rayaramchandrapur', 'Paschimbad', 'Arakhpur', 'Netua', 'Paikasa', 'Champavar', 'Khalina', 'Olada', 'Laxmannath', 'Jaleswar Town'],
    coordinates: { lat: 21.802, lon: 87.214 }, elevation_m: 22, agro_zone: 'Subarnarekha Deltaic Basin', soil_type: 'River Alluvium',
    metrics: { temperature_c: 33.1, humidity_percent: 75, rainfall_24h_mm: 11, rainfall_15d_cumulative_mm: 64, rainfall_anomaly_percent: 8, soil_moisture_level: 'High', soil_moisture_fraction: 0.38, expected_rainfall_7d: 70, expected_rainfall_14d: 145, expected_rainfall_21d: 195, expected_rainfall_30d: 245, onset_probability: 0.85, break_probability: 0.25, heavy_rain_probability: 0.55, confidence: 0.82, dominant_risk: 'LOW', risk_factor: 'Favorable Onset' }
  },
  {
    id: 'od-balasore-baliapal', state: 'Odisha', district: 'Balasore', block: 'Baliapal',
    panchayats: ['Baliapal', 'Asti', 'Badasimulia', 'Badhapal', 'Bishnupur', 'Dalua', 'Ghantiary', 'Jamkunda', 'Jharapimpal', 'Panchurukhi', 'Paschima Bad', 'Rella'],
    coordinates: { lat: 21.661, lon: 87.288 }, elevation_m: 12, agro_zone: 'Subarnarekha Estuarine Coastal', soil_type: 'Coastal Alluvial & Saline',
    metrics: { temperature_c: 32.8, humidity_percent: 78, rainfall_24h_mm: 14.2, rainfall_15d_cumulative_mm: 72, rainfall_anomaly_percent: 12, soil_moisture_level: 'High', soil_moisture_fraction: 0.42, expected_rainfall_7d: 76, expected_rainfall_14d: 152, expected_rainfall_21d: 204, expected_rainfall_30d: 260, onset_probability: 0.87, break_probability: 0.22, heavy_rain_probability: 0.60, confidence: 0.84, dominant_risk: 'MODERATE', risk_factor: 'Estuarine Drainage Congestion' }
  },
  {
    id: 'od-balasore-basta', state: 'Odisha', district: 'Balasore', block: 'Basta',
    panchayats: ['Basta', 'Darda', 'Mukulisi', 'Sadanandapur', 'Mathani', 'Baharda', 'Nagra', 'Brahmanagao'],
    coordinates: { lat: 21.698, lon: 87.054 }, elevation_m: 16, agro_zone: 'North Eastern Coastal Plain', soil_type: 'Alluvial Clay Loam',
    metrics: { temperature_c: 33.3, humidity_percent: 72, rainfall_24h_mm: 8.5, rainfall_15d_cumulative_mm: 58, rainfall_anomaly_percent: 2, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.34, expected_rainfall_7d: 62, expected_rainfall_14d: 128, expected_rainfall_21d: 174, expected_rainfall_30d: 222, onset_probability: 0.81, break_probability: 0.32, heavy_rain_probability: 0.44, confidence: 0.81, dominant_risk: 'LOW', risk_factor: 'Normal Monsoon' }
  },
  {
    id: 'od-balasore-bhograi', state: 'Odisha', district: 'Balasore', block: 'Bhograi',
    panchayats: ['Bhograi', 'Chandanpur', 'Kusha', 'Talsari', 'Batagram', 'Dehurda', 'Kamarda', 'Sarasatia'],
    coordinates: { lat: 21.654, lon: 87.382 }, elevation_m: 8, agro_zone: 'Coastal Bay Belt', soil_type: 'Coastal Sand & Saline Clay',
    metrics: { temperature_c: 32.4, humidity_percent: 81, rainfall_24h_mm: 18, rainfall_15d_cumulative_mm: 84, rainfall_anomaly_percent: 20, soil_moisture_level: 'High', soil_moisture_fraction: 0.45, expected_rainfall_7d: 88, expected_rainfall_14d: 168, expected_rainfall_21d: 220, expected_rainfall_30d: 285, onset_probability: 0.89, break_probability: 0.18, heavy_rain_probability: 0.68, confidence: 0.85, dominant_risk: 'HIGH', risk_factor: 'Heavy Coastal Precipitation' }
  },
  {
    id: 'od-balasore-remuna', state: 'Odisha', district: 'Balasore', block: 'Remuna',
    panchayats: ['Remuna', 'Gopalpur', 'Kalyani', 'Patripada', 'Nisamani', 'Mandarpur', 'Sujanpur', 'Padmapur'],
    coordinates: { lat: 21.528, lon: 86.874 }, elevation_m: 20, agro_zone: 'Foothill Coastal Zone', soil_type: 'Alluvial Sandy Clay',
    metrics: { temperature_c: 33.5, humidity_percent: 69, rainfall_24h_mm: 5.4, rainfall_15d_cumulative_mm: 45, rainfall_anomaly_percent: -12, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.28, expected_rainfall_7d: 50, expected_rainfall_14d: 106, expected_rainfall_21d: 148, expected_rainfall_30d: 190, onset_probability: 0.77, break_probability: 0.48, heavy_rain_probability: 0.32, confidence: 0.79, dominant_risk: 'MODERATE', risk_factor: 'Mid-Season Dry Spells' }
  },
  {
    id: 'od-balasore-soro', state: 'Odisha', district: 'Balasore', block: 'Soro',
    panchayats: ['Soro Town', 'Anantapur', 'Manjuri Road', 'Mangalpur', 'Sabira', 'Oupada'],
    coordinates: { lat: 21.284, lon: 86.688 }, elevation_m: 24, agro_zone: 'South Balasore Coastal', soil_type: 'Clay Loam',
    metrics: { temperature_c: 33.8, humidity_percent: 68, rainfall_24h_mm: 4.5, rainfall_15d_cumulative_mm: 42, rainfall_anomaly_percent: -15, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.27, expected_rainfall_7d: 48, expected_rainfall_14d: 100, expected_rainfall_21d: 142, expected_rainfall_30d: 182, onset_probability: 0.76, break_probability: 0.50, heavy_rain_probability: 0.30, confidence: 0.78, dominant_risk: 'MODERATE', risk_factor: 'Intermittent Rain' }
  },

  // Bhadrak District
  {
    id: 'od-bhadrak-sadar', state: 'Odisha', district: 'Bhadrak', block: 'Bhadrak Sadar',
    panchayats: ['Arnapal', 'Kharida', 'Randia', 'Banta', 'Gelpur', 'Baudpur', 'Asura', 'Nalanga'],
    coordinates: { lat: 21.058, lon: 86.512 }, elevation_m: 23, agro_zone: 'North Eastern Coastal Plain', soil_type: 'Alluvial Clay Loam',
    metrics: { temperature_c: 33.9, humidity_percent: 68, rainfall_24h_mm: 3.8, rainfall_15d_cumulative_mm: 39, rainfall_anomaly_percent: -19, soil_moisture_level: 'Low', soil_moisture_fraction: 0.24, expected_rainfall_7d: 47, expected_rainfall_14d: 99, expected_rainfall_21d: 140, expected_rainfall_30d: 178, onset_probability: 0.74, break_probability: 0.62, heavy_rain_probability: 0.27, confidence: 0.78, dominant_risk: 'HIGH', risk_factor: 'Low Germination Moisture' }
  },
  {
    id: 'od-bhadrak-chandbali', state: 'Odisha', district: 'Bhadrak', block: 'Chandbali',
    panchayats: ['Motto', 'Kandagaradi', 'Aradi', 'Bansada', 'Dhamra', 'Panchapada', 'Karanjamal', 'Orasahi'],
    coordinates: { lat: 20.784, lon: 86.745 }, elevation_m: 9, agro_zone: 'Baitarani Estuarine Delta', soil_type: 'Saline Alluvial',
    metrics: { temperature_c: 33.0, humidity_percent: 78, rainfall_24h_mm: 15, rainfall_15d_cumulative_mm: 72, rainfall_anomaly_percent: 12, soil_moisture_level: 'High', soil_moisture_fraction: 0.41, expected_rainfall_7d: 78, expected_rainfall_14d: 155, expected_rainfall_21d: 208, expected_rainfall_30d: 265, onset_probability: 0.86, break_probability: 0.24, heavy_rain_probability: 0.61, confidence: 0.83, dominant_risk: 'HIGH', risk_factor: 'Heavy Rainfall & Waterlogging' }
  },
  {
    id: 'od-bhadrak-dhamnagar', state: 'Odisha', district: 'Bhadrak', block: 'Dhamnagar',
    panchayats: ['Dhamnagar', 'Dobal', 'Jahangir', 'Asurali', 'Kothar', 'Khaparapada', 'Chudamani'],
    coordinates: { lat: 20.912, lon: 86.442 }, elevation_m: 18, agro_zone: 'Central Coastal Basin', soil_type: 'Clay Alluvium',
    metrics: { temperature_c: 33.7, humidity_percent: 71, rainfall_24h_mm: 6.8, rainfall_15d_cumulative_mm: 48, rainfall_anomaly_percent: -6, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.31, expected_rainfall_7d: 55, expected_rainfall_14d: 114, expected_rainfall_21d: 158, expected_rainfall_30d: 202, onset_probability: 0.79, break_probability: 0.39, heavy_rain_probability: 0.38, confidence: 0.80, dominant_risk: 'MODERATE', risk_factor: 'Normal Onset' }
  },
  {
    id: 'od-bhadrak-basudevpur', state: 'Odisha', district: 'Bhadrak', block: 'Basudevpur',
    panchayats: ['Basudevpur', 'Eram', 'Bideipur', 'Chudamani', 'Lunga', 'Kumarpur'],
    coordinates: { lat: 21.141, lon: 86.742 }, elevation_m: 11, agro_zone: 'Coastal Bay Sector', soil_type: 'Saline Clay Alluvium',
    metrics: { temperature_c: 33.1, humidity_percent: 76, rainfall_24h_mm: 12.8, rainfall_15d_cumulative_mm: 65, rainfall_anomaly_percent: 8, soil_moisture_level: 'High', soil_moisture_fraction: 0.38, expected_rainfall_7d: 70, expected_rainfall_14d: 140, expected_rainfall_21d: 190, expected_rainfall_30d: 245, onset_probability: 0.84, break_probability: 0.28, heavy_rain_probability: 0.52, confidence: 0.82, dominant_risk: 'LOW', risk_factor: 'Good Coastal Moisture' }
  },

  // Jagatsinghpur District
  {
    id: 'od-jagatsinghpur-sadar', state: 'Odisha', district: 'Jagatsinghpur', block: 'Jagatsinghpur Sadar',
    panchayats: ['Kaduapada', 'Chatra', 'Puran', 'Alipingal', 'Gorakhnath', 'Punanga'],
    coordinates: { lat: 20.258, lon: 86.171 }, elevation_m: 16, agro_zone: 'Coastal Plain', soil_type: 'Deltaic Clay Loam',
    metrics: { temperature_c: 33.4, humidity_percent: 73, rainfall_24h_mm: 7.4, rainfall_15d_cumulative_mm: 54, rainfall_anomaly_percent: -2, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.35, expected_rainfall_7d: 59, expected_rainfall_14d: 124, expected_rainfall_21d: 172, expected_rainfall_30d: 220, onset_probability: 0.83, break_probability: 0.35, heavy_rain_probability: 0.42, confidence: 0.81, dominant_risk: 'LOW', risk_factor: 'Balanced Moisture' }
  },
  {
    id: 'od-jagatsinghpur-paradip', state: 'Odisha', district: 'Jagatsinghpur', block: 'Paradip (Kujang)',
    panchayats: ['Bhutamundai', 'Nuagarh', 'Sandhakuda', 'Bijaychandrapur', 'Paradip Port', 'Kujang Town'],
    coordinates: { lat: 20.298, lon: 86.666 }, elevation_m: 4, agro_zone: 'Coastal Littoral', soil_type: 'Saline Sandy Marshy',
    metrics: { temperature_c: 32.1, humidity_percent: 84, rainfall_24h_mm: 19.8, rainfall_15d_cumulative_mm: 82, rainfall_anomaly_percent: 22, soil_moisture_level: 'High', soil_moisture_fraction: 0.46, expected_rainfall_7d: 92, expected_rainfall_14d: 178, expected_rainfall_21d: 234, expected_rainfall_30d: 295, onset_probability: 0.89, break_probability: 0.19, heavy_rain_probability: 0.72, confidence: 0.85, dominant_risk: 'VERY HIGH', risk_factor: 'Heavy Inundation & Waterlogging' }
  },
  {
    id: 'od-jagatsinghpur-tirtol', state: 'Odisha', district: 'Jagatsinghpur', block: 'Tirtol',
    panchayats: ['Tirtol', 'Tarapur', 'Manijanga', 'Sankheswar', 'Sanara', 'Kanakpur'],
    coordinates: { lat: 20.321, lon: 86.342 }, elevation_m: 14, agro_zone: 'Mahanadi Deltaic Zone', soil_type: 'Alluvial Loam',
    metrics: { temperature_c: 33.6, humidity_percent: 71, rainfall_24h_mm: 6.8, rainfall_15d_cumulative_mm: 50, rainfall_anomaly_percent: -4, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.33, expected_rainfall_7d: 56, expected_rainfall_14d: 118, expected_rainfall_21d: 165, expected_rainfall_30d: 212, onset_probability: 0.80, break_probability: 0.38, heavy_rain_probability: 0.36, confidence: 0.80, dominant_risk: 'LOW', risk_factor: 'Stable Conditions' }
  },

  // Ganjam District
  {
    id: 'od-ganjam-berhampur', state: 'Odisha', district: 'Ganjam', block: 'Berhampur',
    panchayats: ['Ankushpur', 'Lathi', 'Nimakhandi', 'Golanthara', 'Haladiapadar', 'Kukudakhandi', 'Brahmapur Town', 'Bhakuri'],
    coordinates: { lat: 19.315, lon: 84.794 }, elevation_m: 27, agro_zone: 'East Coast Southern Plain', soil_type: 'Red Sandy Loam',
    metrics: { temperature_c: 34.4, humidity_percent: 66, rainfall_24h_mm: 1.0, rainfall_15d_cumulative_mm: 34, rainfall_anomaly_percent: -22, soil_moisture_level: 'Low', soil_moisture_fraction: 0.23, expected_rainfall_7d: 44, expected_rainfall_14d: 92, expected_rainfall_21d: 130, expected_rainfall_30d: 165, onset_probability: 0.73, break_probability: 0.64, heavy_rain_probability: 0.26, confidence: 0.79, dominant_risk: 'HIGH', risk_factor: 'Rainfall Deficit in Seedling Stage' }
  },
  {
    id: 'od-ganjam-chatrapur', state: 'Odisha', district: 'Ganjam', block: 'Chatrapur',
    panchayats: ['Chatrapur', 'Agastinuagaon', 'Aryapalli', 'Bipulingi', 'Ganjam Town', 'Kanamana', 'Chamaakhandi'],
    coordinates: { lat: 19.354, lon: 84.988 }, elevation_m: 14, agro_zone: 'East Coast Littoral', soil_type: 'Coastal Sand & Sandy Loam',
    metrics: { temperature_c: 33.6, humidity_percent: 74, rainfall_24h_mm: 5.2, rainfall_15d_cumulative_mm: 42, rainfall_anomaly_percent: -10, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.29, expected_rainfall_7d: 52, expected_rainfall_14d: 108, expected_rainfall_21d: 148, expected_rainfall_30d: 188, onset_probability: 0.78, break_probability: 0.44, heavy_rain_probability: 0.36, confidence: 0.81, dominant_risk: 'MODERATE', risk_factor: 'Sea Breeze Moisture Influx' }
  },
  {
    id: 'od-ganjam-hinjilicut', state: 'Odisha', district: 'Ganjam', block: 'Hinjilicut',
    panchayats: ['Hinjilicut Town', 'Pochilima', 'Durbandha', 'Sasan', 'Ralaba', 'Sikiri'],
    coordinates: { lat: 19.481, lon: 84.742 }, elevation_m: 32, agro_zone: 'Rushikulya Plain', soil_type: 'Alluvial Red Loam',
    metrics: { temperature_c: 34.2, humidity_percent: 65, rainfall_24h_mm: 2.2, rainfall_15d_cumulative_mm: 36, rainfall_anomaly_percent: -18, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.26, expected_rainfall_7d: 46, expected_rainfall_14d: 96, expected_rainfall_21d: 135, expected_rainfall_30d: 172, onset_probability: 0.75, break_probability: 0.58, heavy_rain_probability: 0.28, confidence: 0.79, dominant_risk: 'MODERATE', risk_factor: 'Sub-normal Rain' }
  },
  {
    id: 'od-ganjam-bhanjanagar', state: 'Odisha', district: 'Ganjam', block: 'Bhanjanagar',
    panchayats: ['Bhanjanagar', 'Belaguntha', 'Mujagada', 'Kullada', 'Gallery', 'Inamalu'],
    coordinates: { lat: 19.932, lon: 84.582 }, elevation_m: 85, agro_zone: 'North Ganjam Tableland', soil_type: 'Red Gravelly Loam',
    metrics: { temperature_c: 35.0, humidity_percent: 61, rainfall_24h_mm: 0.8, rainfall_15d_cumulative_mm: 28, rainfall_anomaly_percent: -28, soil_moisture_level: 'Low', soil_moisture_fraction: 0.20, expected_rainfall_7d: 38, expected_rainfall_14d: 80, expected_rainfall_21d: 115, expected_rainfall_30d: 148, onset_probability: 0.69, break_probability: 0.68, heavy_rain_probability: 0.22, confidence: 0.77, dominant_risk: 'HIGH', risk_factor: 'Topsoil Moisture Stress' }
  },

  // Mayurbhanj District
  {
    id: 'od-mayurbhanj-baripada', state: 'Odisha', district: 'Mayurbhanj', block: 'Baripada',
    panchayats: ['Pundal', 'Sankhabhanga', 'Manitri', 'Badasahi', 'Lalazar', 'Deuli', 'Bhaunri', 'Takatpur'],
    coordinates: { lat: 21.933, lon: 86.737 }, elevation_m: 88, agro_zone: 'North Central Plateau', soil_type: 'Red Laterite & Gravelly Loam',
    metrics: { temperature_c: 35.1, humidity_percent: 60, rainfall_24h_mm: 0.0, rainfall_15d_cumulative_mm: 25, rainfall_anomaly_percent: -36, soil_moisture_level: 'Low', soil_moisture_fraction: 0.17, expected_rainfall_7d: 34, expected_rainfall_14d: 76, expected_rainfall_21d: 110, expected_rainfall_30d: 140, onset_probability: 0.66, break_probability: 0.74, heavy_rain_probability: 0.19, confidence: 0.77, dominant_risk: 'VERY HIGH', risk_factor: 'Severe Upland Soil Deficit' }
  },
  {
    id: 'od-mayurbhanj-rairangpur', state: 'Odisha', district: 'Mayurbhanj', block: 'Rairangpur',
    panchayats: ['Rairangpur Town', 'Bahalda', 'Badampahar', 'Gorumahisani', 'Gidhighaty', 'Tiring'],
    coordinates: { lat: 22.268, lon: 86.174 }, elevation_m: 245, agro_zone: 'Northern Hill Sector', soil_type: 'Red Hill Soil',
    metrics: { temperature_c: 34.5, humidity_percent: 62, rainfall_24h_mm: 1.2, rainfall_15d_cumulative_mm: 30, rainfall_anomaly_percent: -30, soil_moisture_level: 'Low', soil_moisture_fraction: 0.20, expected_rainfall_7d: 38, expected_rainfall_14d: 82, expected_rainfall_21d: 118, expected_rainfall_30d: 152, onset_probability: 0.70, break_probability: 0.66, heavy_rain_probability: 0.24, confidence: 0.78, dominant_risk: 'HIGH', risk_factor: 'Hilly Dry Spell' }
  },

  // Jajpur District
  {
    id: 'od-jajpur-sadar', state: 'Odisha', district: 'Jajpur', block: 'Jajpur Sadar',
    panchayats: ['Bari', 'Binjharpur', 'Dharmasala', 'Sukinda', 'Kalinganagar', 'Vyasanagar', 'Korei', 'Rasulpur'],
    coordinates: { lat: 20.852, lon: 86.334 }, elevation_m: 35, agro_zone: 'Mid Central Plain', soil_type: 'Alluvial Clay Loam',
    metrics: { temperature_c: 34.1, humidity_percent: 66, rainfall_24h_mm: 4.0, rainfall_15d_cumulative_mm: 36, rainfall_anomaly_percent: -20, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.26, expected_rainfall_7d: 49, expected_rainfall_14d: 104, expected_rainfall_21d: 146, expected_rainfall_30d: 185, onset_probability: 0.75, break_probability: 0.59, heavy_rain_probability: 0.30, confidence: 0.78, dominant_risk: 'MODERATE', risk_factor: 'Intermittent Dry Spells' }
  },
  {
    id: 'od-jajpur-road', state: 'Odisha', district: 'Jajpur', block: 'Vyasanagar (Jajpur Road)',
    panchayats: ['Jajpur Road Town', 'Dhabalgiri', 'Chorda', 'Santhapur', 'Kalinganagar Industrial Zone'],
    coordinates: { lat: 20.952, lon: 86.134 }, elevation_m: 48, agro_zone: 'North Industrial Belt', soil_type: 'Lateritic Loam',
    metrics: { temperature_c: 34.7, humidity_percent: 63, rainfall_24h_mm: 2.8, rainfall_15d_cumulative_mm: 32, rainfall_anomaly_percent: -24, soil_moisture_level: 'Moderate', soil_moisture_fraction: 0.24, expected_rainfall_7d: 44, expected_rainfall_14d: 94, expected_rainfall_21d: 135, expected_rainfall_30d: 172, onset_probability: 0.73, break_probability: 0.62, heavy_rain_probability: 0.26, confidence: 0.78, dominant_risk: 'MODERATE', risk_factor: 'Dry Spell Watch' }
  }
];

const code = `/**
 * Location and Agro-Meteorological Database for Odisha Districts & Blocks
 * Prototype Mock Layer with realistic meteorological values
 */

const locations = ` + JSON.stringify(locations, null, 2) + `;

// Helper functions for locations — case-insensitive, trimmed, always return full lists
const normalize = (s) => (s || "").toString().trim().toLowerCase();

const getDistricts = () => {
  const uniqueDistricts = [...new Set(locations.map(l => l.district))];
  return uniqueDistricts.sort();
};

const getBlocksByDistrict = (districtName) => {
  const key = normalize(districtName);
  if (!key) return [];
  return locations.filter(l => normalize(l.district) === key);
};

const getPanchayatsByBlock = (blockName, districtName) => {
  const bKey = normalize(blockName);
  let loc = null;
  if (districtName) {
    loc = locations.find(l => normalize(l.block) === bKey && normalize(l.district) === normalize(districtName));
  }
  if (!loc) {
    loc = locations.find(l => normalize(l.block) === bKey);
  }
  if (!loc) return [];
  return loc.panchayats || [];
};

const getLocationById = (id) => {
  if (!id) return locations[0];
  return locations.find(l => normalize(l.id) === normalize(id)) || locations[0];
};

const findLocation = (district, block, panchayat) => {
  const match = locations.find(
    l => normalize(l.district) === normalize(district) &&
         normalize(l.block) === normalize(block)
  );
  const base = match || locations[0];
  if (panchayat) {
    return { ...base, selectedPanchayat: panchayat };
  }
  return base;
};

const getAllPanchayatsByDistrict = (districtName) => {
  const blocks = getBlocksByDistrict(districtName);
  const all = [];
  blocks.forEach(b => (b.panchayats || []).forEach(p => all.push({ block: b.block, panchayat: p, locationId: b.id })));
  return all;
};

export {
  locations,
  getDistricts,
  getBlocksByDistrict,
  getPanchayatsByBlock,
  getAllPanchayatsByDistrict,
  getLocationById,
  findLocation
};
`;

fs.writeFileSync('SIH/backend/data/locations.js', code);
console.log('locations.js updated successfully!');
