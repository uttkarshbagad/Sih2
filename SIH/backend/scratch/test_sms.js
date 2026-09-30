import 'dotenv/config';

const fast2smsApiKey = process.env.FAST2SMS_API_KEY ? process.env.FAST2SMS_API_KEY.trim() : null;
const phoneNumber = "8093164058";
const otp = "540208";

console.log("Testing Fast2SMS Key:", fast2smsApiKey ? fast2smsApiKey.substring(0, 10) + "..." : "NULL");

if (!fast2smsApiKey) {
  console.log("No FAST2SMS_API_KEY found in .env!");
  process.exit(1);
}

async function testFast2SMS() {
  try {
    console.log("--- Attempting Fast2SMS POST route=otp ---");
    const res1 = await fetch("https://www.fast2sms.com/dev/bulkV2", {
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
    const data1 = await res1.json();
    console.log("Fast2SMS POST OTP Response:", JSON.stringify(data1, null, 2));

    console.log("--- Attempting Fast2SMS POST route=q (Quick) ---");
    const res2 = await fetch("https://www.fast2sms.com/dev/bulkV2", {
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
    const data2 = await res2.json();
    console.log("Fast2SMS POST Quick Response:", JSON.stringify(data2, null, 2));

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testFast2SMS();
