/**
 * Weather Alert Scheduler: periodically runs the ML nowcast sweep across all
 * Odisha blocks so rain-within-12h and heavy-rain events reach farmers via SMS
 * and get pushed live to dashboards over SSE.
 */

import { runWeatherAlertSweep } from "../services/weatherAlertService.js";
import { dispatchAIBroadcast } from "../services/broadcastService.js";
import { locations } from "../data/locations.js";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes
const INITIAL_DELAY_MS = 20 * 1000; // wait for DB + ML service to be ready

let timer = null;
let running = false;

const runSweepSafe = async () => {
  if (running) return; // avoid overlapping sweeps when a sweep is slow
  running = true;
  try {
    await runWeatherAlertSweep();
  } catch (err) {
    console.error("Scheduler sweep crashed:", err.message);
  } finally {
    running = false;
  }
};

// Fully-automatic AI broadcast sweep: the AI composes EN/HI/OR content and
// dispatches real SMS to registered farmers of every Odisha block. No human
// involvement — runs alongside the nowcast sweep on the 15-minute cycle.
let aiTimer = null;
const AI_INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes

const runAIBroadcastSweep = async () => {
  console.log("🤖 AI Auto-Broadcast sweep started (no human dispatch)...");
  let totalSent = 0;
  for (const loc of locations.slice(0, 3)) { // keep prototype light; expand as needed
    try {
      const result = await dispatchAIBroadcast({
        district: loc.district,
        block: loc.block,
        locationId: loc.id,
        channel: "SMS",
        auto_compose: true
      });
      totalSent += result?.summary?.sms_sent || 0;
    } catch (err) {
      console.error(`AI broadcast failed for ${loc.block}:`, err.message);
    }
  }
  console.log(`🤖 AI Auto-Broadcast sweep complete: ~${totalSent} SMS dispatched.`);
};

const startWeatherAlertScheduler = () => {
  console.log(`⏰ Weather alert scheduler armed — sweeping every ${SWEEP_INTERVAL_MS / 60000} minutes.`);

  setTimeout(async () => {
    await runSweepSafe();
    timer = setInterval(runSweepSafe, SWEEP_INTERVAL_MS);

    // AI auto-broadcast (delayed so DB + ML service are ready first)
    setTimeout(runAIBroadcastSweep, 45 * 1000);
    aiTimer = setInterval(runAIBroadcastSweep, AI_INTERVAL_MS);
  }, INITIAL_DELAY_MS);
};

const stopWeatherAlertScheduler = () => {
  if (timer) clearInterval(timer);
  if (aiTimer) clearInterval(aiTimer);
  timer = null;
  aiTimer = null;
};

export {
  startWeatherAlertScheduler,
  stopWeatherAlertScheduler
};