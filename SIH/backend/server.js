import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { startWeatherAlertScheduler } from "./services/alertScheduler.js";

let PORT = parseInt(process.env.PORT, 10) || 5005;

// Connect Database
connectDatabase();

// Start Weather Alert Scheduler (real-time rain-within-12h SMS + broadcast engine)
startWeatherAlertScheduler();

// Start listening with automatic port fallback if port is in use
const startServer = (portToUse) => {
  const server = app.listen(portToUse, () => {
    console.log(`=======================================================`);
    console.log(`🌧️  MoES / NCMRWF Monsoon Intel Backend API Running`);
    console.log(`📡  Listening on port http://localhost:${portToUse}`);
    console.log(`🌐  FastAPI ML Service URL: http://localhost:8000`);
    console.log(`=======================================================`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️  Port ${portToUse} is already in use by another process.`);
      console.warn(`🔄 Automatically switching backend server to port http://localhost:${portToUse + 1}...`);
      setTimeout(() => {
        startServer(portToUse + 1);
      }, 500);
    } else {
      console.error("Server Error:", err);
    }
  });
};

startServer(PORT);

/** Express Gateway - Hyperlocal Monsoon Intelligence API Server */
