'use client';

import SpeakButton from './SpeakButton';

interface Props {
  message: string;
}

export default function AmuletMessage({ message }: Props) {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl px-6 py-6 shadow-sm">
      <div className="text-center">
        <p className="text-xs font-semibold text-rose-400 tracking-[0.3em] mb-4">お守りメッセージ</p>
        <div className="bg-white/70 rounded-xl px-5 py-4 border border-rose-100">
          <p className="text-base text-gray-700 leading-relaxed font-medium">「{message}」</p>
        </div>
        <p className="text-xs text-rose-300 mt-3 tracking-wider">— 今のあなたへ</p>
        <div className="mt-3">
          <SpeakButton text={message} variant="rose" />
        </div>
      </div>
    </div>
  );
}
