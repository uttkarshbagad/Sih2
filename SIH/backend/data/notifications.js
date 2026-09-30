/**
 * Farmer Notification Logs & Simulation Dataset
 * Multi-channel (SMS, WhatsApp, Voice) delivery tracker
 */

let notificationLogs = [
  {
    id: "notif-101",
    locationId: "od-kendrapara-rajkanika",
    district: "Kendrapara",
    block: "Rajkanika",
    urgency: "HIGH",
    channel: "WhatsApp & SMS",
    recipients_count: 4820,
    status: "Delivered",
    delivered_count: 4540,
    failed_count: 98,
    pending_count: 182,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    message_en: "🔴 HIGH DRY SPELL RISK - Rajkanika: Rainfall may remain below normal for next 10-14 days. Farmers advised to delay new paddy sowing by 5-7 days and prepare supplemental irrigation. - MoES / NCMRWF",
    message_hi: "🔴 उच्च शुष्क दौर चेतावनी - राजकनिका: अगले 10-14 दिनों में वर्षा सामान्य से कम रहने की संभावना है। किसान धान की नई बुवाई 5-7 दिन टालें और सिंचाई तैयार रखें। - MoES / NCMRWF",
    message_or: "🔴 ପ୍ରବଳ ଶୁଷ୍କ ପାଗ ସତର୍କତା - ରାଜକନିକା: ଆଗାମୀ ୧୦-୧୪ ଦିନ ବର୍ଷା କମ ରହିବା ସମ୍ଭାବନା। ଚାଷୀ ଭାଇମାନେ ଧାନ ବୁଣା ୫-୭ ଦିନ ବିଳମ୍ବ କରନ୍ତୁ ଏବଂ ଜଳସେଚନ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ। - MoES / NCMRWF"
  },
  {
    id: "notif-102",
    locationId: "od-kendrapara-mahakalapada",
    district: "Kendrapara",
    block: "Mahakalapada",
    urgency: "CRITICAL",
    channel: "WhatsApp & SMS",
    recipients_count: 3950,
    status: "Delivered",
    delivered_count: 3810,
    failed_count: 42,
    pending_count: 98,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    message_en: "🔵 HEAVY RAINFALL & WATERLOGGING ALERT - Mahakalapada: Intense showers expected. Clear field drainage channels and postpone chemical fertilizer spraying. - MoES / NCMRWF",
    message_hi: "🔵 भारी वर्षा चेतावनी - महाकालपाड़ा: तेज बारिश का अनुमान। खेत में जल निकासी नालियां साफ करें और खाद का छिड़काव रोकें। - MoES / NCMRWF",
    message_or: "🔵 ପ୍ରବଳ ବର୍ଷା ଓ ଜଳବନ୍ଦୀ ସତର୍କତା - ମହାକାଳପଡ଼ା: ପ୍ରବଳ ବର୍ଷା ସମ୍ଭାବନା ଥିବାରୁ ଜମିର ଜଳ ନିଷ୍କାସନ ନାଳି ସଫା ରଖନ୍ତୁ ଏବଂ ରାସାୟନିକ ସାର ପ୍ରୟୋଗ ସ୍ଥଗିତ ରଖନ୍ତୁ। - MoES / NCMRWF"
  },
  {
    id: "notif-103",
    locationId: "od-puri-sadar",
    district: "Puri",
    block: "Puri Sadar",
    urgency: "INFO",
    channel: "SMS",
    recipients_count: 5120,
    status: "Delivered",
    delivered_count: 4980,
    failed_count: 60,
    pending_count: 80,
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    message_en: "🟢 FAVORABLE SOWING WINDOW - Puri Sadar: Consistent monsoon showers forecasted. Proceed with paddy nursery sowing with certified seed treatment. - MoES / NCMRWF",
    message_hi: "🟢 अनुकूल बुवाई मौसम - पुरी सदर: नियमित मानसूनी बारिश की संभावना। धान नर्सरी की बुवाई बीज शोधन के साथ शुरू करें। - MoES / NCMRWF",
    message_or: "🟢 ଅନୁକୂଳ ବୁଣା ସମୟ - ପୁରୀ ସଦର: ନିୟମିତ ମୌସୁମୀ ବର୍ଷାର ଅନୁକୂଳ ପରିବେଶ। ବିହନ ବିଶୋଧନ କରି ଧାନ ତଳି ପକାଇବା କାର୍ଯ୍ୟ ଆଗେଇ ନିଅନ୍ତୁ। - MoES / NCMRWF"
  }
];

const getNotificationStats = () => {
  const totalSent = notificationLogs.reduce((acc, n) => acc + n.recipients_count, 0);
  const totalDelivered = notificationLogs.reduce((acc, n) => acc + (n.delivered_count || 0), 0);
  const totalFailed = notificationLogs.reduce((acc, n) => acc + (n.failed_count || 0), 0);
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 96.5;

  return {
    total_broadcasts: notificationLogs.length,
    total_recipients: totalSent,
    total_delivered: totalDelivered,
    total_failed: totalFailed,
    delivery_rate_percent: parseFloat(deliveryRate),
    active_subscribers_odisha: 48520,
    languages_breakdown: {
      odia: 68,
      hindi: 18,
      english: 14
    }
  };
};

const sendSimulatedNotification = (payload) => {
  const newId = `notif-${Date.now().toString().slice(-4)}`;
  const recipients = payload.recipients_count || Math.floor(Math.random() * 2000) + 3000;
  const delivered = Math.floor(recipients * 0.96);
  const failed = Math.floor(recipients * 0.02);
  const pending = recipients - delivered - failed;

  const newRecord = {
    id: newId,
    locationId: payload.locationId || "od-kendrapara-rajkanika",
    district: payload.district || "Kendrapara",
    block: payload.block || "Rajkanika",
    urgency: payload.urgency || "HIGH",
    channel: payload.channel || "WhatsApp & SMS",
    recipients_count: recipients,
    status: "Delivered",
    delivered_count: delivered,
    failed_count: failed,
    pending_count: pending,
    timestamp: new Date().toISOString(),
    message_en: payload.message_en || "Rainfall advisory issued by MoES / NCMRWF.",
    message_hi: payload.message_hi || payload.message_en,
    message_or: payload.message_or || payload.message_en
  };

  notificationLogs.unshift(newRecord);
  return newRecord;
};

export {
  notificationLogs,
  getNotificationStats,
  sendSimulatedNotification
};


/** SMS Broadcast Log Repository & Metrics Tracker */
