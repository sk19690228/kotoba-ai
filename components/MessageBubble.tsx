'use client';

import type { Message } from '@/types';
import SpeakButton from './SpeakButton';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-base flex-shrink-0 mb-0.5 shadow-sm">
          🌸
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-amber-500 text-white rounded-br-sm'
            : 'bg-white border border-amber-100 text-gray-700 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && (
          <div className="mt-2">
            <SpeakButton text={message.content} variant="light" />
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center text-base flex-shrink-0 mb-0.5">
          🙋
        </div>
      )}
    </div>
  );
}
