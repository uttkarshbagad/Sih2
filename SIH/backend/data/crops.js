/**
 * Crop Database and Advisory Logic Rules
 * Supports 6 major crops with multi-lingual (EN, HI, OR) templates
 */

const crops = [
  {
    id: "rice",
    name: "Rice (Paddy / ଧାନ)",
    name_en: "Rice (Paddy)",
    name_hi: "धान (चावल)",
    name_or: "ଧାନ (Paddy)",
    category: "Cereal / Staple",
    optimal_rainfall_mm: 1100,
    critical_stages: ["Nursery Sowing", "Transplanting", "Tillering", "Panicle Initiation", "Grain Filling"],
    drought_sensitivity: "High",
    heavy_rain_sensitivity: "Moderate",
    soil_preference: "Clay loam with good water retention",
    sowing_window: "June 15 - July 15"
  },
  {
    id: "maize",
    name: "Maize (Corn / ମକା)",
    name_en: "Maize (Corn)",
    name_hi: "मक्का",
    name_or: "ମକା (Maize)",
    category: "Coarse Cereal",
    optimal_rainfall_mm: 600,
    critical_stages: ["Germination", "Knee-high", "Tasseling", "Silking", "Maturity"],
    drought_sensitivity: "Moderate",
    heavy_rain_sensitivity: "High (Waterlogging vulnerable)",
    soil_preference: "Well-drained sandy loam",
    sowing_window: "June 10 - July 05"
  },
  {
    id: "groundnut",
    name: "Groundnut (Peanut / ଚିନାବାଦାମ)",
    name_en: "Groundnut (Peanut)",
    name_hi: "मूंगफली",
    name_or: "ଚିନାବାଦାମ (Groundnut)",
    category: "Oilseed",
    optimal_rainfall_mm: 500,
    critical_stages: ["Flowering", "Pegging", "Pod Development"],
    drought_sensitivity: "Moderate",
    heavy_rain_sensitivity: "High",
    soil_preference: "Light sandy loam / Red soil",
    sowing_window: "June 20 - July 15"
  },
  {
    id: "pulses",
    name: "Pulses (Arhar / Moong / ହରଡ଼ / ମୁଗ)",
    name_en: "Pulses (Pigeon Pea / Green Gram)",
    name_hi: "दालें (अरहर / मूंग / उड़द)",
    name_or: "ଡାଲି ଜାତୀୟ (ହରଡ଼ / ମୁଗ / ବିରି)",
    category: "Legume",
    optimal_rainfall_mm: 450,
    critical_stages: ["Branching", "Flowering", "Pod Formation"],
    drought_sensitivity: "Low-to-Moderate",
    heavy_rain_sensitivity: "High",
    soil_preference: "Medium to deep well-drained loam",
    sowing_window: "June 15 - July 20"
  },
  {
    id: "vegetables",
    name: "Vegetables (Brinjal / Chilli / ପରିବା)",
    name_en: "Vegetables (Brinjal / Okra / Chilli)",
    name_hi: "सब्जियां (बैंगन / भिंडी / मिर्च)",
    name_or: "ପରିବା ଚାଷ (ବାଇଗଣ / ଭେଣ୍ଡି / ଲଙ୍କା)",
    category: "Horticulture",
    optimal_rainfall_mm: 650,
    critical_stages: ["Seedling Nursery", "Vegetative Growth", "Fruit Setting"],
    drought_sensitivity: "High",
    heavy_rain_sensitivity: "High",
    soil_preference: "Fertile loamy garden soil with drainage",
    sowing_window: "Year-round / Kharif Nursery June"
  },
  {
    id: "cotton",
    name: "Cotton (କପା)",
    name_en: "Cotton",
    name_hi: "कपास",
    name_or: "କପା (Cotton)",
    category: "Commercial Fiber",
    optimal_rainfall_mm: 700,
    critical_stages: ["Squaring", "Boll Formation", "Boll Bursting"],
    drought_sensitivity: "Low",
    heavy_rain_sensitivity: "High",
    soil_preference: "Deep black soil or fertile red loam",
    sowing_window: "June 10 - July 10"
  }
];

/**
 * Agro-meteorological Advisory Rules Generator
 * Evaluates onset, break risk, heavy rain risk, soil moisture, and rainfall anomaly
 */
const generateCropAdvisory = (cropId, metrics, locationName = "Rajkanika") => {
  const crop = crops.find(c => c.id === cropId) || crops[0];
  const {
    onset_probability = 0.76,
    break_probability = 0.68,
    heavy_rain_probability = 0.29,
    soil_moisture_level = "Low",
    rainfall_anomaly_percent = -24.0,
    expected_rainfall_14d = 112.0,
    confidence = 0.81
  } = metrics;

  let advisoryType = "Proceed with Sowing";
  let urgency = "INFO";
  let titleEn = "";
  let titleHi = "";
  let titleOr = "";
  let actionsEn = [];
  let actionsHi = [];
  let actionsOr = [];
  let triggerReasons = [];

  // Rule 1: High Break / Dry Spell Risk with Low Soil Moisture (Default Scenario for Rice in Rajkanika)
  if (break_probability >= 0.60 && soil_moisture_level === "Low") {
    advisoryType = "Delay Sowing";
    urgency = "WARNING";
    titleEn = `Sowing Caution: Delay ${crop.name_en} Sowing by 5–7 Days`;
    titleHi = `बुवाई सावधानी: ${crop.name_hi} की बुवाई 5-7 दिन टालें`;
    titleOr = `ବୁଣା ସତର୍କତା: ${crop.name_or} ବୁଣା ୫-୭ ଦିନ ବିଳମ୍ବ କରନ୍ତୁ`;

    actionsEn = [
      "Delay direct seeding or transplanting by 5–7 days until stable rainfall resumes.",
      "Maintain nursery beds with light, localized watering rather than field flood irrigation.",
      "Keep supplemental irrigation (diesel/solar pump or farm pond) ready on standby.",
      "Avoid broadcasting fertilizer right now to prevent volatilization losses under dry soil.",
      "Monitor the next 48-hour block forecast update before field preparation."
    ];

    actionsHi = [
      "स्थिर वर्षा शुरू होने तक 5-7 दिनों के लिए सीधी बुवाई या रोपाई स्थगित करें।",
      "पूरे खेत में पानी भरने के बजाय नर्सरी में हल्का पानी देकर नमी बनाए रखें।",
      "आपातकालीन सिंचाई (पंप सेट या खेत का तालाब) तैयार रखें।",
      "सूखी मिट्टी में उर्वरक (खाद) न डालें जिससे पोषक तत्वों की बर्बादी न हो।",
      "खेत तैयार करने से पहले अगले 48 घंटे के मौसम अपडेट पर नजर रखें।"
    ];

    actionsOr = [
      "ସ୍ଥିର ବର୍ଷା ଆରମ୍ଭ ହେବା ପର୍ଯ୍ୟନ୍ତ ୫-୭ ଦିନ ପାଇଁ ଧାନ ବୁଣା କିମ୍ବା ରୁଆ କାର୍ଯ୍ୟ ସ୍ଥଗିତ ରଖନ୍ତୁ।",
      "ପୂରା ଜମି ପରିବର୍ତ୍ତେ ତଳି ଘରେ ହାଲୁକା ପାଣି ଦେଇ ଆର୍ଦ୍ରତା ବଜାୟ ରଖନ୍ତୁ।",
      "ଜରୁରୀକାଳୀନ ଜଳସେଚନ (ପମ୍ପ ସେଟ୍ କିମ୍ବା ପୋଖରୀ ପାଣି) ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।",
      "ଶୁଖିଲା ମାଟିରେ ରାସାୟନିକ ସାର ପ୍ରୟୋଗ କରନ୍ତୁ ନାହିଁ।",
      "ଜମି କାମ ଆରମ୍ଭ କରିବା ପୂର୍ବରୁ ଆଗାମୀ ୪୮ ଘଣ୍ଟାର ବ୍ଲକ ପୂର୍ବାନୁମାନ ଦେଖନ୍ତୁ।"
    ];

    triggerReasons = [
      `Elevated Break / Dry Spell probability of ${Math.round(break_probability * 100)}% over the next 10–14 days.`,
      `Topsoil moisture level is currently '${soil_moisture_level}', insufficient for resilient seedling germination.`,
      `Cumulative rainfall deficit of ${rainfall_anomaly_percent}% indicates weak early-monsoon moisture recharge.`,
      `ENSO warm anomaly (+0.8) and negative IOD (-0.4) induce localized subsidence over coastal belts.`
    ];
  }
  // Rule 2: Heavy Rainfall & Waterlogging Risk
  else if (heavy_rain_probability >= 0.60) {
    advisoryType = "Prepare Drainage";
    urgency = "CRITICAL";
    titleEn = `Heavy Rainfall Alert: Clear Field Drainage & Secure Seedlings`;
    titleHi = `भारी बारिश चेतावनी: खेत में जल निकासी की व्यवस्था करें`;
    titleOr = `ପ୍ରବଳ ବର୍ଷା ସତର୍କତା: ଜମିରେ ଜଳ ନିଷ୍କାସନ ବ୍ୟବସ୍ଥା କରନ୍ତୁ`;

    actionsEn = [
      "Open drainage channels and clear field bunds to prevent submergence of young shoots.",
      "Postpone application of pesticides, foliar sprays, and top-dressed urea.",
      "Elevate nursery beds and protect sensitive vegetable seedbeds with polythene mesh.",
      "Store harvested produce and seed bags in elevated, dry godowns."
    ];

    actionsHi = [
      "खेत की मेड़ों को काटकर जल निकासी नालियां तुरंत साफ करें ताकि फसल न डूबे।",
      "कीटनाशक छिड़काव और यूरिया खाद का छिड़काव तुरंत रोक दें।",
      "सब्जी नर्सरी की क्यारियों को ऊंचा करें और प्लास्टिक जाली से ढकें।",
      "कटे हुए उत्पाद और बीज के बोरों को ऊंचे, सूखे स्थानों पर सुरक्षित रखें।"
    ];

    actionsOr = [
      "ଜମିର ହିଡ଼ କାଟି ଜଳ ନିଷ୍କାସନ ନାଳି ସଫା କରନ୍ତୁ ଯାହାଦ୍ୱାରା ତଳି ବୁଡ଼ି ନଯାଏ।",
      "କୀଟନାଶକ ଏବଂ ୟୁରିଆ ସାର ପ୍ରୟୋଗ ସାମୟିକ ଭାବେ ବନ୍ଦ ରଖନ୍ତୁ।",
      "ପରିବା ତଳି କିଆରିକୁ ଉଚ୍ଚା କରନ୍ତୁ ଏବଂ ଜରି ପାଲ ଘୋଡ଼ାଇ ସୁରକ୍ଷିତ ରଖନ୍ତୁ।",
      "ବିହନ ଏବଂ ଅମଳ ଫସଲକୁ ଉଚ୍ଚା ଶୁଖିଲା ସ୍ଥାନରେ ସୁରକ୍ଷିତ ରଖନ୍ତୁ।"
    ];

    triggerReasons = [
      `Heavy rainfall probability elevated at ${Math.round(heavy_rain_probability * 100)}% (potential convective downpours >65mm).`,
      `Soil is saturated (${soil_moisture_level}), posing high surface runoff and waterlogging risks.`
    ];
  }
  // Rule 3: Low Expected Rainfall - Consider Alternative Short Duration Crop
  else if (expected_rainfall_14d < 50 && cropId === "rice") {
    advisoryType = "Consider Alternative Crop";
    urgency = "WARNING";
    titleEn = `Low Rainfall Outlook: Consider Less Water-Intensive Alternative Crops`;
    titleHi = `कम वर्षा अनुमान: कम पानी वाली वैकल्पिक फसलों पर विचार करें`;
    titleOr = `କମ ବର୍ଷା ସୂଚନା: କମ ପାଣି ଆବଶ୍ୟକ କରୁଥିବା ବିକଳ୍ପ ଫସଲ ଚାଷ କରନ୍ତୁ`;

    actionsEn = [
      "In non-irrigated uplands, consider switching from long-duration paddy to Pulses (Moong/Arhar) or Maize.",
      "Adopt direct-seeded rice (DSR) or short-duration varieties (e.g., Sahbhagi Dhan, Vandana).",
      "Practice broad-bed furrowing to conserve in-situ soil moisture."
    ];

    actionsHi = [
      "असिंचित ऊंची जमीन पर लंबी अवधि के धान के बजाय दाल (मूंग/अरहर) या मक्का लगाएं।",
      "सीधी बुवाई (डीएसआर) या कम अवधि वाली धान की किस्मों का चयन करें।",
      "खेत में नमी संचयन के लिए चौड़ी क्यारी विधि का उपयोग करें।"
    ];

    actionsOr = [
      "ଜଳସେଚନ ସୁବିଧା ନଥିବା ଉଚ୍ଚ ଜମିରେ ଲମ୍ବା ସମୟ ଧାନ ବଦଳରେ ମୁଗ, ହରଡ଼ କିମ୍ବା ମକା ଚାଷ କରନ୍ତୁ।",
      "ସ୍ୱଳ୍ପ ମିଆଦି ବିହନ କିମ୍ବା ଡିଏସ୍‌ଆର୍ ପଦ୍ଧତିରେ ବୁଣନ୍ତୁ।",
      "ମାଟିରେ ଆର୍ଦ୍ରତା ଧରି ରଖିବା ପାଇଁ ଜଳ ସଂରକ୍ଷଣ ପଦ୍ଧତି ଆପଣାନ୍ତୁ।"
    ];

    triggerReasons = [
      `14-day expected rainfall of only ${expected_rainfall_14d}mm is substantially below traditional paddy requirement.`,
      `Prolonged moisture stress anticipated throughout vegetative growth.`
    ];
  }
  // Rule 4: High Onset Probability & Low Break Probability -> Optimal Sowing Conditions
  else if (onset_probability >= 0.70 && break_probability < 0.35) {
    advisoryType = "Proceed with Sowing";
    urgency = "INFO";
    titleEn = `Favorable Window: Proceed with ${crop.name_en} Sowing & Field Preparation`;
    titleHi = `अनुकूल मौसम: ${crop.name_hi} की बुवाई और खेत की तैयारी शुरू करें`;
    titleOr = `ଅନୁକୂଳ ପାଗ: ${crop.name_or} ବୁଣା ଏବଂ ଜମି ପ୍ରସ୍ତୁତି ଆଗେଇ ନିଅନ୍ତୁ`;

    actionsEn = [
      "Soil moisture and rainfall continuity are optimal for timely sowing and nursery raising.",
      "Apply basal dose of recommended fertilizers along with organic manure during final plowing.",
      "Treat certified seeds with bio-fungicides (Trichoderma) before sowing."
    ];

    actionsHi = [
      "बुवाई और नर्सरी लगाने के लिए मिट्टी की नमी और वर्षा की निरंतरता अनुकूल है।",
      "अंतिम जुताई के समय संतुलित खाद और गोबर की खाद का प्रयोग करें।",
      "बुवाई से पहले बीजों का ट्राइकोडर्मा या फफूंदनाशक से उपचार अवश्य करें।"
    ];

    actionsOr = [
      "ବୁଣା ଏବଂ ତଳି ପକାଇବା ପାଇଁ ମାଟିରେ ଉପଯୁକ୍ତ ଆର୍ଦ୍ରତା ଏବଂ ନିରନ୍ତର ବର୍ଷାର ସମ୍ଭାବନା ଅଛି।",
      "ଶେଷ ହଳ ସମୟରେ ଅନୁମୋଦିତ ସାର ଏବଂ ଖତ ପ୍ରୟୋଗ କରନ୍ତୁ।",
      "ବୁଣିବା ପୂର୍ବରୁ ପ୍ରମାଣିତ ବିହନକୁ ବିଶୋଧନ କରନ୍ତୁ।"
    ];

    triggerReasons = [
      `High onset probability (${Math.round(onset_probability * 100)}%) with continuous rain progression.`,
      `Low break probability (${Math.round(break_probability * 100)}%) ensures steady soil hydration.`
    ];
  }
  // Rule 5: Low Confidence / Mixed Signals -> Monitor Closely
  else {
    advisoryType = "Monitor Closely";
    urgency = "WATCH";
    titleEn = `Variable Monsoon Transition: Monitor Weather Advisory for 48 Hours`;
    titleHi = `अनिश्चित मौसम: अगले 48 घंटे कृषि मौसम सलाह पर नजर रखें`;
    titleOr = `ଅସ୍ଥିର ପାଗ: ଆଗାମୀ ୪୮ ଘଣ୍ଟା କୃଷି ପାଣିପାଗ ସୂଚନା ଉପରେ ନଜର ରଖନ୍ତୁ`;

    actionsEn = [
      "Proceed with preliminary tillage but defer large-scale sowing until rainfall stabilizes.",
      "Ensure irrigation infrastructure and drainage bunds are in good order.",
      "Subscribe to block-level SMS / WhatsApp alerts for daily updates."
    ];

    actionsHi = [
      "खेत की जुताई जारी रखें लेकिन वर्षा स्थिर होने तक बड़े पैमाने पर बुवाई रोकें।",
      "सिंचाई और जल निकासी की व्यवस्था चुस्त-दुरुस्त रखें।",
      "दैनिक अपडेट के लिए ब्लॉक स्तरीय व्हाट्सएप / एसएमएस अलर्ट से जुड़े रहें।"
    ];

    actionsOr = [
      "ଜମି ହଳ କାମ ଜାରି ରଖନ୍ତୁ କିନ୍ତୁ ବର୍ଷା ସ୍ଥିର ନହେବା ପର୍ଯ୍ୟନ୍ତ ବ୍ୟାପକ ବୁଣା କାର୍ଯ୍ୟରୁ ନିବୃତ୍ତ ରୁହନ୍ତୁ।",
      "ଜଳସେଚନ ଓ ନିଷ୍କାସନ ନାଳି ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।",
      "ଦୈନିକ ସୂଚନା ପାଇଁ ବ୍ଲକ ସ୍ତରୀୟ ଏସଏମଏସ/ହ୍ୱାଟସଆପ ଆଲର୍ଟ ନିୟମିତ ଦେଖନ୍ତୁ।"
    ];

    triggerReasons = [
      `Moderate forecast confidence (${Math.round(confidence * 100)}%) due to transitional atmospheric patterns.`,
      `Intermittent showers expected without distinct onset or break dominance.`
    ];
  }

  return {
    cropId: crop.id,
    cropName: crop.name,
    cropCategory: crop.category,
    location: locationName,
    advisoryType,
    urgency,
    title: {
      en: titleEn,
      hi: titleHi,
      or: titleOr
    },
    actionPoints: {
      en: actionsEn,
      hi: actionsHi,
      or: actionsOr
    },
    triggerReasons,
    metricsEvaluated: {
      onset_probability,
      break_probability,
      heavy_rain_probability,
      soil_moisture_level,
      rainfall_anomaly_percent,
      expected_rainfall_14d,
      confidence
    },
    generatedAt: new Date().toISOString(),
    isPrototype: true
  };
};

export {
  crops,
  generateCropAdvisory
};


/** Agro-Advisory Rules Engine for Odisha Paddy & Kharif Crops */
