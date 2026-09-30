import React, { useState } from 'react';
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { playTextToSpeech, stopTextToSpeech } from '../../utils/tts';

export const SpeakButton = ({ text, lang = 'en', t, className = '' }) => {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const label = t?.listen || (lang === 'or' ? 'ପରାମର୍ଶ ଶୁଣନ୍ତୁ' : lang === 'hi' ? 'सलाह सुनें' : 'Listen');
  const playingLabel = t?.playing || (lang === 'or' ? 'ପରାମର୍ଶ ଚାଲିଛି...' : lang === 'hi' ? 'सलाह सुनाई जा रही है...' : 'Playing...');

  const handleSpeak = () => {
    if (playing) {
      stopTextToSpeech();
      setPlaying(false);
      return;
    }

    setError(false);
    playTextToSpeech({
      text,
      lang,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => {
        setPlaying(false);
        setError(true);
      }
    });
  };

  if (error && !playing) {
    return (
      <button
        onClick={handleSpeak}
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md bg-yellow-600 hover:bg-yellow-500 text-white ${className}`}
      >
        <AlertTriangle className="h-4 w-4" />
        <span>{lang === 'hi' ? 'पुनः प्रयास' : lang === 'or' ? 'ପୁଣି ଚେଷ୍ଟା' : 'Retry Voice'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSpeak}
      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
        playing
          ? 'bg-amber-500 text-slate-950 animate-pulse'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
      } ${className}`}
    >
      {playing ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span>{playing ? playingLabel : label}</span>
    </button>
  );
};

export default SpeakButton;
