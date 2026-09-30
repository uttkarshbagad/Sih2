const key = "5dbfef5a312527f414672c83eb88deb3";

async function testAPIs() {
  console.log("Testing API Key:", key);

  // 1. PositionStack
  try {
    const res1 = await fetch(`http://api.positionstack.com/v1/forward?access_key=${key}&query=20.2961,85.8245`);
    const data1 = await res1.json();
    console.log("\n--- PositionStack Response ---");
    console.log(JSON.stringify(data1, null, 2).substring(0, 300));
  } catch (err) {
    console.log("PositionStack Error:", err.message);
  }

  // 2. IPStack
  try {
    const res2 = await fetch(`http://api.ipstack.com/check?access_key=${key}`);
    const data2 = await res2.json();
    console.log("\n--- IPStack Response ---");
    console.log(JSON.stringify(data2, null, 2).substring(0, 300));
  } catch (err) {
    console.log("IPStack Error:", err.message);
  }

  // 3. OpenCage
  try {
    const res3 = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=20.2961,85.8245&key=${key}`);
    const data3 = await res3.json();
    console.log("\n--- OpenCage Response ---");
    console.log(JSON.stringify(data3, null, 2).substring(0, 300));
  } catch (err) {
    console.log("OpenCage Error:", err.message);
  }

  // 4. LocationIQ
  try {
    const res4 = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${key}&lat=20.2961&lon=85.8245&format=json`);
    const data4 = await res4.json();
    console.log("\n--- LocationIQ Response ---");
    console.log(JSON.stringify(data4, null, 2).substring(0, 300));
  } catch (err) {
    console.log("LocationIQ Error:", err.message);
  }

  // 5. IPAPI.com
  try {
    const res5 = await fetch(`http://api.ipapi.com/check?access_key=${key}`);
    const data5 = await res5.json();
    console.log("\n--- IPAPI.com Response ---");
    console.log(JSON.stringify(data5, null, 2).substring(0, 300));
  } catch (err) {
    console.log("IPAPI.com Error:", err.message);
  }

  // 6. BigDataCloud / Weather / Geoapify
  try {
    const res6 = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=20.2961&lon=85.8245&apiKey=${key}`);
    const data6 = await res6.json();
    console.log("\n--- Geoapify Response ---");
    console.log(JSON.stringify(data6, null, 2).substring(0, 300));
  } catch (err) {
    console.log("Geoapify Error:", err.message);
  }
}

testAPIs();
