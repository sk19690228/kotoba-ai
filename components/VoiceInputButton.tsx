'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onStart: () => void;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInputButton({ onStart, onTranscript, disabled }: Props) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const toggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'ja-JP';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setIsListening(true);
      onStart();
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      onTranscript(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={isListening ? '録音停止' : '音声入力'}
      className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-2xl border transition-colors shadow-sm ${
        isListening
          ? 'bg-red-500 border-red-400 text-white animate-pulse'
          : 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100 active:bg-amber-200'
      } disabled:opacity-40`}
    >
      {isListening ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
