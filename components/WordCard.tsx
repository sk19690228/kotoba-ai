'use client';

import { useState } from 'react';
import SpeakButton from './SpeakButton';

interface Props {
  word: string;
}

export default function WordCard({ word }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `━━━━━━━━━━━━━━━\n　　今日の言葉\n\n「${word}」\n\n━━━━━━━━━━━━━━━\n#こころの縁側`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API not available — silent fail
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-amber-200">
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 px-6 py-8 text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-4 opacity-70">
          <span className="h-px w-10 bg-white/60 block" />
          <p className="text-xs font-medium tracking-[0.35em]">今日の言葉</p>
          <span className="h-px w-10 bg-white/60 block" />
        </div>
        <p className="text-2xl font-bold tracking-wide leading-relaxed drop-shadow-sm">
          「{word}」
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 opacity-50">
          <span className="h-px w-10 bg-white/60 block" />
          <p className="text-xs tracking-widest">こころの縁側</p>
          <span className="h-px w-10 bg-white/60 block" />
        </div>
        <div className="mt-4">
          <SpeakButton text={word} variant="amber" />
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="w-full bg-white text-amber-600 text-sm font-medium py-3 px-4 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 border-t border-amber-100"
      >
        {copied ? (
          <>
            <span>✓</span>
            <span>コピーしました</span>
          </>
        ) : (
          <>
            <span>📋</span>
            <span>SNSシェア用にコピー</span>
          </>
        )}
      </button>
    </div>
  );
}
