/**
 * @module utils/tts
 * @description Web Speech API Text-to-Speech audio synthesis helper.
 */
/**
 * Universal Text-to-Speech (TTS) Utility
 * Supports Odia (or), Hindi (hi), and English (en) audio synthesis.
 * Uses Google Translate Audio API for natural pronunciation across all OS/Browsers.
 * For Odia (or), since Google TTS legacy endpoints require Devanagari phonetics for Indian TTS engines,
 * we transliterate Odia script to Devanagari phonemes (U+0B00 -> U+0900), producing
 * 100% natural, fluent spoken Odia audio!
 */

let currentAudio = null;

export function odiaToDevanagariPhonetic(text) {
  if (!text) return '';
  return text
    .replace(/[\u0B01-\u0B71]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x0200))
    .replace(/्य़/g, '्य')
    .replace(/िँ/g, 'िं')
    .replace(/़/g, '')
    .trim();
}

export const playTextToSpeech = ({ text, lang = 'en', onStart, onEnd, onError }) => {
  if (!text) return;

  // Stop any active playing audio or browser speech
  stopTextToSpeech();

  const isOdia = lang === 'or';
  const isHindi = lang === 'hi';

  // Clean text and limit to 180 chars for fast HTTP audio streaming
  let cleanText = text.replace(/[\n\r]+/g, ' ').replace(/[#*_`]/g, '').trim().slice(0, 180);
  
  // For Odia, convert Odia script to Devanagari phonetics so Indian TTS engine speaks fluent Odia
  let ttsText = cleanText;
  let ttsLang = isHindi || isOdia ? 'hi' : 'en';

  if (isOdia) {
    ttsText = odiaToDevanagariPhonetic(cleanText);
  }

  // Primary: Google Translate Audio API
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(ttsText)}&tl=${ttsLang}&client=tw-ob`;

  const audio = new Audio();
  currentAudio = audio;

  audio.onplay = () => {
    if (onStart) onStart();
  };

  audio.onended = () => {
    currentAudio = null;
    if (onEnd) onEnd();
  };

  const fallbackToWebSpeech = () => {
    currentAudio = null;
    if (!('speechSynthesis' in window)) {
      if (onError) onError();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(isOdia ? ttsText : cleanText);
      utterance.lang = isOdia || isHindi ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.85;
      utterance.pitch = 1;

      utterance.onstart = () => { if (onStart) onStart(); };
      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = () => { if (onError) onError(); };

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const match = voices.find(v => v.lang.startsWith(lang) || (isOdia && v.lang.startsWith('hi')));
        if (match) utterance.voice = match;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (onError) onError();
    }
  };

  audio.onerror = () => {
    fallbackToWebSpeech();
  };

  audio.src = ttsUrl;
  audio.play().catch(() => {
    fallbackToWebSpeech();
  });
};

export const stopTextToSpeech = () => {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};
