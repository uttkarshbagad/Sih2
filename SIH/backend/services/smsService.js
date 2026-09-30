/**
 * @module services/smsService
 * @description Twilio / Fast2SMS gateway SMS broadcast service.
 */
/**
 * SMS Gateway Service: Fast2SMS / Twilio Integration for Real Mobile SMS Dispatch
 * Supports production SMS delivery with automatic prototype fallback logging.
 */

const getFast2SmsKey = () => process.env.FAST2SMS_API_KEY ? process.env.FAST2SMS_API_KEY.trim() : null;

const getTwilioConfig = () => ({
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhone: process.env.TWILIO_PHONE_NUMBER
});

/**
 * Generic multi-provider SMS dispatch (used for OTP, weather alerts, broadcasts).
 * Tries Fast2SMS -> Twilio -> simulated console logging (hackathon fallback).
 */
export const dispatchSms = async (phoneNumber, message, context = "WEATHER-ALERT") => {
  const fast2smsApiKey = getFast2SmsKey();
  const { twilioSid, twilioToken, twilioPhone } = getTwilioConfig();

  // Option 1: Fast2SMS (Indian SMS Provider) — "q" route for arbitrary messages
  if (fast2smsApiKey) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": fast2smsApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message,
          language: "english",
          flash: 0,
          numbers: phoneNumber
        })
      });
      const data = await response.json();
      console.log(`📲 Fast2SMS [${context}] Result:`, data);
      if (data && data.return) {
        return { success: true, provider: "Fast2SMS", details: data };
      }
    } catch (err) {
      console.error(`Fast2SMS [${context}] Dispatch Error:`, err.message);
    }
  }

  // Option 2: Twilio SMS Provider
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", `+91${phoneNumber}`);
      params.append("From", twilioPhone);
      params.append("Body", message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      const data = await response.json();
      console.log(`📲 Twilio [${context}] SMS Dispatch Result:`, data);
      return { success: true, provider: "Twilio", details: data };
    } catch (err) {
      console.error(`Twilio [${context}] Dispatch Error:`, err.message);
    }
  }

  // Fallback: Console & Response logging for Hackathon Demonstration
  console.log(`=======================================================`);
  console.log(`📱 SIMULATED SMS [${context}] TO +91 ${phoneNumber}`);
  console.log(`💬 ${message}`);
  console.log(`=======================================================`);

  return { success: true, provider: "Simulated-SMS" };
};

/**
 * Send a weather alert / broadcast SMS to a farmer's mobile number.
 */
export const sendWeatherAlertSms = async (phoneNumber, message) =>
  dispatchSms(phoneNumber, message, "WEATHER-ALERT");

export const sendSmsOtp = async (phoneNumber, otp) => {
  const fast2smsApiKey = getFast2SmsKey();
  const { twilioSid, twilioToken, twilioPhone } = getTwilioConfig();

  // Option 1: Fast2SMS (Indian SMS Provider)
  if (fast2smsApiKey) {
    try {
      // Primary Attempt: Fast2SMS OTP Route (POST)
      let response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": fast2smsApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: phoneNumber
        })
      });

      let data = await response.json();
      console.log("📲 Fast2SMS OTP POST Result:", data);

      // Attempt 2: Fast2SMS Quick Route (POST)
      if (!data.return) {
        response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": fast2smsApiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            route: "q",
            message: `Your MoES Monsoon Intel verification OTP is ${otp}. Valid for 10 minutes.`,
            language: "english",
            flash: 0,
            numbers: phoneNumber
          })
        });
        data = await response.json();
        console.log("📲 Fast2SMS Quick Route Result:", data);
      }

      // Attempt 3: Fast2SMS GET Request URL Method (Exact dashboard format)
      if (!data.return) {
        const getUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsApiKey)}&route=otp&variables_values=${encodeURIComponent(otp)}&numbers=${encodeURIComponent(phoneNumber)}`;
        response = await fetch(getUrl);
        data = await response.json();
        console.log("📲 Fast2SMS GET Route Result:", data);
      }

      return { success: true, provider: "Fast2SMS", details: data };
    } catch (err) {
      console.error("Fast2SMS Dispatch Error:", err.message);
    }
  }

  // Option 2: Twilio SMS Provider
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", `+91${phoneNumber}`);
      params.append("From", twilioPhone);
      params.append("Body", `Your MoES Monsoon Intel verification OTP is ${otp}. Valid for 10 minutes.`);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      const data = await response.json();
      console.log("📲 Twilio SMS Dispatch Result:", data);
      return { success: true, provider: "Twilio", details: data };
    } catch (err) {
      console.error("Twilio Dispatch Error:", err.message);
    }
  }

  // Fallback: Console & Response logging for Hackathon Demonstration
  console.log(`=======================================================`);
  console.log(`📱 SIMULATED SMS DISPATCH TO +91 ${phoneNumber}`);
  console.log(`🔑 Verification OTP: ${otp}`);
  console.log(`=======================================================`);

  return { success: true, provider: "Simulated-SMS", otp };
};
