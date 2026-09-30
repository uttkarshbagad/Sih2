/**
 * @module components/common/WeatherBroadcastBanner
 * @description Real-time weather alert SSE banner component.
 */
import React, { useEffect, useState } from 'react';
import { subscribeWeatherAlertsSSE } from '../../services/api';
import { AlertTriangle, CloudRain, Radio, X } from 'lucide-react';

/**
 * Global Real-Time Weather Broadcast Banner.
 *
 * Listens to the backend SSE stream and instantly surfaces live heavy-rain /
 * rain-in-12h broadcasts (triggered by the ML nowcast engine) as a sticky banner
 * across the whole app — the "heavy rain → show broadcast about weather" flow.
 */

const AUTO_DISMISS_MS = 55000;

// Web Audio chime sound trigger for device notification pop-up
const triggerNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio chime warning:', e);
  }
};

// Native OS/Browser device push notification trigger
const triggerDevicePushNotification = (title, body) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          dir: 'auto'
        });
      } catch (e) {
        console.warn('Native notification error:', e);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
};

export const WeatherBroadcastBanner = () => {
  const [report, setReport] = useState(null);
  const [streamState, setStreamState] = useState('connecting'); // connecting | live | offline

  // Live SSE subscription — the scheduler pushes real broadcasts
  useEffect(() => {
    const unsub = subscribeWeatherAlertsSSE(
      (payload) => {
        setStreamState('live');
        setReport(payload);
        triggerNotificationSound();
        triggerDevicePushNotification(
          `🚨 Weather Alert: ${payload.district || 'MoES Odisha'}`,
          payload.message_en || payload.message_or || 'Moderate to heavy monsoon showers expected within 12h.'
        );
        const timer = setTimeout(() => setReport(null), AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
      },
      () => setStreamState('offline')
    );
    return unsub;
  }, []);

  const dismiss = () => setReport(null);

  if (!report) return null;

  const isHeavy = report.severity === 'HEAVY_RAIN' || report.type === 'HEAVY_RAIN';
  const message = report.message_en || '';
  const onClickClose = dismiss;

  return (
    <div
      className={`fixed top-14 right-4 z-[100] w-[340px] max-w-[90vw] rounded-2xl shadow-2xl border p-4 animate-in slide-in-from-top-2 duration-300 transition-all ${
        isHeavy
          ? 'bg-gradient-to-br from-rose-950 via-rose-900 to-rose-950 border-rose-500/60'
          : 'bg-gradient-to-br from-sky-950 via-sky-900 to-sky-950 border-sky-500/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2.5 w-2.5 ${isHeavy ? 'bg-rose-400' : 'bg-sky-400'}`}>
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isHeavy ? 'bg-rose-400' : 'bg-sky-400'}`} />
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isHeavy ? 'text-rose-300' : 'text-sky-300'}`}>
            Live Weather Broadcast
          </span>
        </div>
        <button
          onClick={onClickClose}
          className="rounded-full p-1 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
          aria-label="Dismiss broadcast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isHeavy ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'}`}>
          {isHeavy ? <AlertTriangle className="h-5 w-5" /> : <CloudRain className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-black ${isHeavy ? 'text-rose-200' : 'text-sky-200'}`}>
            {isHeavy ? 'Heavy Rain Warning' : 'Rain Expected'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {report.district} › {report.block} › within 12 hours
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-200 font-medium">
        {message}
      </p>

      <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
        <Radio className="h-3 w-3 text-emerald-400" />
        <span className="truncate">
          {report.source || 'Real-Time ML Nowcast'} · {report.alert_probability}% probability
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${streamState === 'live' ? 'bg-emerald-400' : streamState === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-500">{streamState}</span>
        </span>
      </div>

      {report.sms_delivery && (
        <div className="mt-2.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300">
          ✓ Real-time SMS dispatched via {report.sms_delivery.provider} to {report.sms_delivery.phone}
        </div>
      )}
    </div>
  );
};

export default WeatherBroadcastBanner;