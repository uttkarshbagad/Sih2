/**
 * In-process Event Bus for Real-Time Weather Alert Broadcasts.
 * The alert dispatcher emits "weather-broadcast" events which are
 * streamed to the frontend over Server-Sent Events (SSE).
 */

import { EventEmitter } from "node:events";

class AlertEventBus extends EventEmitter {}

export const WEATHER_BROADCAST_EVENT = "weather-broadcast";

export const alertEventBus = new AlertEventBus();

export default alertEventBus;