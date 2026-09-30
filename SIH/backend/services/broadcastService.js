/**
 * @module services/broadcastService
 * @description Server-Sent Events (SSE) live alert broadcast client registry.
 */
/**
 * AI Auto-Broadcast Service
 * -------------------------
 * Fully automatic multilingual broadcast pipeline — the AI composes the
 * advisory itself (from real-time ML nowcast + crop advisory engine) and sends
 * real SMS to every REGISTERED farmer in the target district/block. No human
 * writes the message; no human dispatches it.
 *
 * Fixes: the old "Send Broadcast" button only created a simulated log entry.
 * Now it queries the real User DB (role FARMER → district/block → phoneNumber),
 * auto-writes EN/HI/OR text, pushes real SMS via Fast2SMS/Twilio, records a real
 * audit log, and emits the live SSE broadcast.
 */

import User from "../models/user.model.js";
import { getLocationById, findLocation } from "../data/locations.js";
import { fetchNowcast } from "./mlService.js";
import { generateCropAdvisory } from "../data/crops.js";
import { dispatchSms } from "./smsService.js";
import { notificationLogs } from "../data/notifications.js";
import { alertEventBus, WEATHER_BROADCAST_EVENT } from "./eventBus.js";

/**
 * Fetch registered farm user records (with real phone numbers) for a location.
 * Matches on role=FARMER against district/block (case-insensitive).
 */
export const getRegisteredFarmersForLocation = async (district, block) => {
  try {
    // Match on role=FARMER. District spelling in DB can differ from the
    // canonical location name ("Khorda" vs "Khordha"), so fall back to a
    // block-only match (and then a contains match) to still reach farmers.
    let farmers = await User.find({
      role: "FARMER",
      $or: [
        { district: new RegExp(`^${district}$`, "i"), block: new RegExp(`^${block}$`, "i") },
        { block: new RegExp(`^${block}$`, "i") }
      ]
    }).lean();

    if (!farmers || farmers.length === 0) {
      // Last-resort: fuzzy contains match on both names
      farmers = await User.find({
        role: "FARMER",
        $or: [
          { district: new RegExp(district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("h", "h?"), "i") },
          { block: new RegExp(block, "i") }
        ]
      }).lean();
    }

    return (farmers || []).map(f => ({
      id: String(f._id || f.id),
      name: f.name || "Farmer",
      phoneNumber: f.phoneNumber,
      language: f.language || "en",
      panchayat: f.panchayat || ""
    }));
  } catch (err) {
    console.error("Farmer lookup failed (DB down?):", err.message);
    return [];
  }
};

/**
 * AI auto-compose the multilingual broadcast content for a location.
 * Uses the real-time ML nowcast (severity + ongoing advisory) and the crop
 * advisory engine to write the message — no human text required.
 */
export const composeAIBroadcast = async ({ district, block, locationId, crop = "rice" } = {}) => {
  const loc = locationId ? getLocationById(locationId) : findLocation(district, block);
  const d = loc.district;
  const b = loc.block;

  // 1) Real-time ML nowcast (live Open-Meteo + ML model severity)
  let nowcast = null;
  let severity = "NONE";
  try {
    nowcast = await fetchNowcast({
      district_name: d,
      block_name: b,
      latitude: loc.coordinates.lat,
      longitude: loc.coordinates.lon
    });
    severity = nowcast?.nowcast?.alert_severity ||
      (nowcast?.nowcast?.heavy_rain_in_12h ? "HEAVY_RAIN" : nowcast?.nowcast?.rain_within_12h ? "RAIN" : "NONE");
  } catch (err) {
    console.warn("Nowcast failed for AI compose, using static forecast:", err.message);
  }

  // 2) Crop advisory engine → expert action points (AI-written)
  let advisory = null;
  try {
    advisory = generateCropAdvisory(crop, loc.metrics, `${b} (${d})`);
  } catch (err) {
    // carry on — next layer adds the fallback text
  }

  const rainMm = nowcast?.nowcast?.expected_rainfall_12h_mm ?? loc.metrics.rainfall_24h_mm ?? 2.4;
  const heavyProb = Math.round(((nowcast?.nowcast?.heavy_rain_probability ?? loc.metrics.heavy_rain_probability) || 0) * 100);
  const breakProb = Math.round(((nowcast?.nowcast?.alert_severity !== "NONE" ? loc.metrics.break_probability : loc.metrics.break_probability) || 0) * 100);

  const area = `${b} (${d})`;
  const adviceTitleEn = advisory?.title?.en || `Advisory for ${b} Block`;
  const actionEn = advisory?.actionPoints?.en || [];

  const isHeavy = severity === "HEAVY_RAIN";
  const isRain = severity === "RAIN";
  const isDry = advisory?.advisoryType === "Delay Sowing" || loc.metrics.break_probability >= 0.6;

  // --- AI can join the advisory action points into a compact SMS body ---
  const keyAction = actionEn.slice(0, 2).join(" ");
  const baseEn = isHeavy
    ? `⚠️ HEAVY RAIN WARNING ${area}: ${rainMm}mm rain likely in next 12 hours (prob ${heavyProb}%). ${keyAction || "Clear drainage, delay transplanting, protect harvested grain."} - MoES/NCMRWF`
    : isRain
      ? `🌧️ RAIN ALERT ${area}: ${rainMm}mm rain expected within 12 hours. ${keyAction || "Protect seedlings and plan field work."} - MoES/NCMRWF`
      : isDry
        ? `🔴 DRY SPELL WARNING ${area}: rainfall may stay low for 10-14 days. ${keyAction || "Delay new paddy sowing by 5-7 days and arrange irrigation."} - MoES/NCMRWF`
        : `🟢 AGRO ADVISORY ${area}: ${keyAction || "Weather remains favourable — proceed with planned field operations."} - MoES/NCMRWF`;

  const hiAction = advisory?.actionPoints?.hi || [];
  const orAction = advisory?.actionPoints?.or || [];
  const keyActionHi = hiAction.slice(0, 2).join(" ");
  const keyActionOr = orAction.slice(0, 2).join(" ");

  const baseHi = isHeavy
    ? `⚠️ भारी वर्षा चेतावनी ${d} ${b}: अगले 12 घंटों में लगभग ${rainMm} मिमी वर्षा, संभावना ${heavyProb}%। ${keyActionHi || "जल निकासी साफ रखें, रोपाई में विलंब करें।"} - MoES/NCMRWF`
    : isRain
      ? `🌧️ वर्षा अलर्ट ${d} ${b}: अगले 12 घंटों में ${rainMm} मिमी वर्षा की संभावना। ${keyActionHi || "पौध सुरक्षा करें।"} - MoES/NCMRWF`
      : isDry
        ? `🔴 शुष्क दौर चेतावनी ${d} ${b}: अगले 10-14 दिन वर्षा कम रह सकती है। ${keyActionHi || "धान की बुवाई 5-7 दिन टालें।"} - MoES/NCMRWF`
        : `🟢 कृषि सलाह ${d} ${b}: ${keyActionHi || "मौसम अनुकूल है।"} - MoES/NCMRWF`;

  const baseOr = isHeavy
    ? `⚠️ ପ୍ରବଳ ବର୍ଷା ସତର୍କତା ${d} ${b}: ପରବର୍ତ୍ତୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ ପ୍ରାୟ ${rainMm} ମି.ମି. ବର୍ଷା, ସମ୍ଭାବନା ${heavyProb}%। ${keyActionOr || "ଜଳ ନିଷ୍କାସନ ସଫା ରଖନ୍ତୁ।"} - MoES/NCMRWF`
    : isRain
      ? `🌧️ ବର୍ଷା ସତର୍କତା ${d} ${b}: ପରବର୍ତ୍ତୀ ୧୨ ଘଣ୍ଟାରେ ${rainMm} ମି.ମି. ବର୍ଷା ସମ୍ଭାବନା। ${keyActionOr || "ଚାରା ସୁରକ୍ଷା କରନ୍ତୁ।"} - MoES/NCMRWF`
      : isDry
        ? `🔴 ଶୁଷ୍କ ପାଗ ସତର୍କତା ${d} ${b}: ଆଗାମୀ ୧୦-୧୪ ଦିନ ବର୍ଷା କମ ରହିବ। ${keyActionOr || "ଧାନ ବୁଣା ୫-୭ ଦିନ ବିଳମ୍ବ କରନ୍ତୁ।"} - MoES/NCMRWF`
        : `🟢 କୃଷି ସଲାହ ${d} ${b}: ${keyActionOr || "ପାଗ ଅନୁକୂଳ ଅଛି।"} - MoES/NCMRWF`;

  return {
    district: d,
    block: b,
    locationId: loc.id,
    severity,
    rain_mm_12h: rainMm,
    heavy_rain_probability: heavyProb / 100,
    break_probability: loc.metrics.break_probability,
    startup: {
      advisoryType: advisory?.advisoryType || "Monitor Closely",
      urgency: advisory?.urgency || "INFO",
      title_en: adviceTitleEn
    },
    message_en: baseEn,
    message_hi: baseHi,
    message_or: baseOr,
    composed_by: "AI-Broadcast-Engine (ML nowcast + crop advisory)",
    composed_at: new Date().toISOString()
  };
};

/**
 * Dispatch an AI broadcast: find registered farmers, send REAL SMS (per-farmer
 * language), record the audit log, and emit the live SSE broadcast.
 * If message_* are not supplied, they are auto-composed above.
 */
export const dispatchAIBroadcast = async ({
  district,
  block,
  locationId,
  crop = "rice",
  urgency = "HIGH",
  channel = "SMS",
  phone_number = null,
  message_en = null,
  message_hi = null,
  message_or = null,
  auto_compose = true,
  force = false
}) => {
  const loc = locationId ? getLocationById(locationId) : findLocation(district, block);
  const d = loc.district;
  const b = loc.block;

  // Compose AI content (unless caller explicitly supplied full trilingual text)
  let content = null;
  if (auto_compose || !(message_en && message_hi && message_or)) {
    content = await composeAIBroadcast({ district: d, block: b, locationId: loc.id, crop });
  }
  const finalEn = message_en || content?.message_en;
  const finalHi = message_hi || content?.message_hi;
  const finalOr = message_or || content?.message_or;

  // Real registered farmers (phone numbers from DB)
  const farmers = await getRegisteredFarmersForLocation(d, b);

  // Optional direct target (used by the farmer-mode "Check & SMS" flow)
  if (phone_number && /^[6-9]\d{9}$/.test(phone_number)) {
    const already = farmers.some(f => f.phoneNumber === phone_number);
    if (!already) farmers.unshift({ name: "Farmer", phoneNumber: phone_number, language: "en" });
  }

  const targets = farmers.map(f => ({
    phoneNumber: f.phoneNumber,
    name: f.name,
    language: f.language
  }));

  // Dispatch real SMS per farmer (in their language) + collect live results
  const delivery = [];
  let delivered = 0;
  let failed = 0;
  for (const t of targets) {
    const message = t.language === "or" ? finalOr : t.language === "hi" ? finalHi : finalEn;
    const result = await dispatchSms(t.phoneNumber, message, "WEATHER-BROADCAST");
    const ok = !!result?.success;
    ok ? delivered++ : failed++;
    delivery.push({
      name: t.name,
      phone: `+91******${t.phoneNumber.slice(-2)}`,
      language: t.language,
      provider: result?.provider || "none",
      success: ok
    });
  }

  // Real audit log (visible in the Notification Center + SSE)
  const logRecord = {
    id: `notif-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
    locationId: loc.id,
    district: d,
    block: b,
    urgency,
    channel,
    recipients_count: targets.length,
    status: delivered > 0 ? "Delivered" : failed > 0 ? "Partially Delivered" : "No Recipients",
    delivered_count: delivered,
    failed_count: failed,
    pending_count: 0,
    timestamp: new Date().toISOString(),
    message_en: finalEn,
    message_hi: finalHi,
    message_or: finalOr,
    ai_composed: !!(message_en && message_hi && message_or) === false || auto_compose,
    recipients: delivery
  };
  notificationLogs.unshift(logRecord);

  // Live SSE broadcast across the whole app
  alertEventBus.emit(WEATHER_BROADCAST_EVENT, {
    type: content?.severity === "HEAVY_RAIN" ? "HEAVY_RAIN" : "BROADCAST",
    severity: logRecord.status,
    district: d,
    block: b,
    locationId: loc.id,
    generated_at: logRecord.timestamp,
    source: "AI-Broadcast-Engine",
    message_en: finalEn,
    message_hi: finalHi,
    message_or: finalOr,
    recipients: { total: targets.length, delivered, failed },
    sms_delivery: delivery[0] || null
  });

  return {
    status: "success",
    dispatched: true,
    record: logRecord,
    ai_content: content,
    summary: {
      district: d,
      block: b,
      farmers_registered: farmers.length,
      sms_sent: targets.length,
      delivered,
      failed,
      delivery_rate_percent: targets.length ? Math.round((delivered / targets.length) * 100) : 0,
      channel
    }
  };
};

export default {
  composeAIBroadcast,
  dispatchAIBroadcast,
  getRegisteredFarmersForLocation
};