'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  text: string;
  variant?: 'light' | 'dark' | 'amber' | 'rose';
}

export default function SpeakButton({ text, variant = 'light' }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const getJapaneseVoice = (): SpeechSynthesisVoice | undefined => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) =>
        v.lang.startsWith('ja') &&
        /kyoko|haruka|nanami|o-ren|mei|sakura/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith('ja'))
    );
  };

  const handleClick = useCallback(async () => {
    if (!supported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);
    let speechText = text;

    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) speechText = data.text;
      }
    } catch {
      // fall back to original text on network error
    } finally {
      setIsLoading(false);
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.70;
    utterance.pitch = 0.50;
    utterance.volume = 1;

    const assign = () => {
      const voice = getJapaneseVoice();
      if (voice) utterance.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      assign();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', assign, { once: true });
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, isSpeaking, supported]);

  if (!supported) return null;

  const styles: Record<string, string> = {
    light: 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100',
    dark:  'bg-stone-700 text-amber-200 border border-stone-600 hover:bg-stone-600',
    amber: 'bg-white/20 text-white border border-white/30 hover:bg-white/30',
    rose:  'bg-rose-50 text-rose-400 border border-rose-200 hover:bg-rose-100',
  };

  const busy = isLoading || isSpeaking;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={isSpeaking ? '停止' : '読み上げ'}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${styles[variant]}`}
    >
      {isLoading ? (
        <>
          <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          準備中
        </>
      ) : isSpeaking ? (
        <>
          <span className="inline-block w-2 h-2 rounded-sm bg-current animate-pulse" />
          停止
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path d="M7 4a1 1 0 00-1.414 0L2.172 7.414A4 4 0 002 8.828V13a1 1 0 001 1h1v1a1 1 0 002 0v-1h.172a4 4 0 002.828-1.172l.586-.586A1 1 0 0110 11.414V8.586a1 1 0 00-.293-.707L7 4zM13.5 4.5a1 1 0 011.415 0l.292.293a7 7 0 010 9.9l-.293.292a1 1 0 01-1.414-1.414l.293-.293a5 5 0 000-7.07l-.293-.293a1 1 0 010-1.415zM11.672 7.05a1 1 0 011.415 0l.121.121a3 3 0 010 4.243l-.121.121a1 1 0 01-1.414-1.414l.121-.121a1 1 0 000-1.415l-.121-.121a1 1 0 010-1.414z" />
          </svg>
          話す
        </>
      )}
    </button>
  );
}
