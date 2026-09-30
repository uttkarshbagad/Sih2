const maptilerKey = "4ymFs6LvsUF6t0HAQ95O";

async function testMapTiler() {
  console.log("Testing MapTiler Key:", maptilerKey);
  try {
    const res = await fetch(`https://api.maptiler.com/maps/dataviz-dark/2/1/1.png?key=${maptilerKey}`);
    console.log("MapTiler Tile Response Status:", res.status, res.statusText);
    if (res.ok) {
      console.log("MapTiler Key is VALID and ACTIVE!");
    } else {
      console.log("MapTiler Key failed with status:", res.status);
    }
  } catch (err) {
    console.error("MapTiler Error:", err.message);
  }
}

testMapTiler();
