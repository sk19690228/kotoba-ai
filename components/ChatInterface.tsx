'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, AppPhase, AnswerResponse } from '@/types';
import MessageBubble from './MessageBubble';
import WordCard from './WordCard';
import AmuletMessage from './AmuletMessage';
import SpeakButton from './SpeakButton';
import VoiceInputButton from './VoiceInputButton';

const WELCOME_QUESTION = 'どんなことでお悩みですか？どんな小さなことでも、安心してお話ください。';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<AppPhase>('hearing');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceBaseRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, answer, isLoading]);

  const appendMessage = (role: 'user' | 'assistant', content: string): Message => {
    const msg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const autoResizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`;
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const userText = input.trim();
    if (!userText || isLoading || phase === 'complete') return;

    setInput('');
    setIsStarted(true);
    setTimeout(autoResizeTextarea, 0);

    const newUserMsg: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const hearingRes = await fetch('/api/hearing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!hearingRes.ok) throw new Error(`HTTP ${hearingRes.status}`);
      const hearingData = await hearingRes.json();

      if (hearingData.status === 'question' && hearingData.question) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-ai`,
            role: 'assistant',
            content: hearingData.question,
            timestamp: new Date(),
          },
        ]);
      } else if (hearingData.status === 'ready') {
        setPhase('answering');

        const thinkingId = `${Date.now()}-thinking`;
        setMessages((prev) => [
          ...prev,
          {
            id: thinkingId,
            role: 'assistant',
            content: 'お話をしっかり受け止めました。あなたへの処方箋を丁寧に準備しています...',
            timestamp: new Date(),
          },
        ]);

        const answerRes = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        if (!answerRes.ok) throw new Error(`HTTP ${answerRes.status}`);
        const answerData = await answerRes.json();

        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        setAnswer(answerData);
        setPhase('complete');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content: '申し訳ありません。エラーが発生しました。もう一度お試しください。',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setPhase('hearing');
    setAnswer(null);
    setIsStarted(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <header className="bg-stone-900/95 backdrop-blur-md border-b border-stone-700 px-4 py-3.5 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-xl font-bold text-amber-200 tracking-widest">こころの縁側</h1>
          <p className="text-xs text-amber-400/90 mt-1 tracking-wide leading-relaxed">
            〜伝説の尼僧の波乱万丈な生涯と仏の智慧を再現～
          </p>
          <p className="text-xs text-stone-300 mt-0.5 tracking-wide leading-relaxed">
            人間の業や弱さを丸ごと包み込み、まるで本人が語りかけているような法話室
          </p>
        </div>
      </header>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Welcome screen */}
          {!isStarted && (
            <div className="text-center py-10 space-y-5">
              <div className="text-5xl">🌸</div>
              <div className="space-y-2">
                <p className="text-amber-800 text-lg font-semibold">{WELCOME_QUESTION}</p>
                <p className="text-amber-500 text-sm leading-relaxed max-w-sm mx-auto">
                  AIがあなたの話をじっくりお聞きし、<br />
                  心に響く言葉をお届けします。
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['仕事・キャリア', '恋愛・人間関係', '家族・親子', '将来・お金', '自己肯定感'].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-amber-100 text-amber-700 rounded-full px-3 py-1 border border-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading dots */}
          {isLoading && (
            <div className="flex gap-2 items-center pl-12">
              <div className="bg-white border border-amber-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Answer sections */}
          {answer && phase === 'complete' && (
            <div className="space-y-5 mt-2">
              {/* Prescription card */}
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3 border-b border-amber-100">
                  <p className="text-xs font-bold text-amber-600 tracking-widest text-center">
                    ✦ あなたへの処方箋 ✦
                  </p>
                </div>

                <div className="divide-y divide-amber-50">
                  <section className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-amber-500 tracking-wider">
                        ① 心の根っこを見つめる
                      </h3>
                      <SpeakButton text={answer.section1} variant="light" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {answer.section1}
                    </p>
                  </section>

                  <section className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-amber-500 tracking-wider">
                        ② この経験が未来にもたらすもの
                      </h3>
                      <SpeakButton text={answer.section2} variant="light" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {answer.section2}
                    </p>
                  </section>

                  <section className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-amber-500 tracking-wider">
                        ③ 明日への処方箋
                      </h3>
                      <SpeakButton text={answer.section3} variant="light" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {answer.section3}
                    </p>
                  </section>

                  <section className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-amber-500 tracking-wider">
                        ⑤ 感謝すること
                      </h3>
                      <SpeakButton text={answer.section5} variant="light" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {answer.section5}
                    </p>
                  </section>
                </div>
              </div>

              <WordCard word={answer.todaysWord} />
              <AmuletMessage message={answer.amuletMessage} />

              <div className="text-center pt-2 pb-8">
                <button
                  onClick={handleReset}
                  className="text-sm text-amber-500 hover:text-amber-700 underline underline-offset-4 transition-colors"
                >
                  別のお悩みを相談する
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      {phase !== 'complete' && (
        <footer className="bg-white/95 backdrop-blur-sm border-t border-amber-100 px-4 py-3 shadow-lg">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResizeTextarea();
              }}
              onKeyDown={handleKeyDown}
              placeholder="お悩みをお聞かせください..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-3 text-sm text-gray-800 placeholder-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent disabled:opacity-50 leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '144px' }}
            />
            <VoiceInputButton
              disabled={isLoading}
              onStart={() => { voiceBaseRef.current = input; }}
              onTranscript={(text) => {
                setInput(voiceBaseRef.current + text);
                setTimeout(autoResizeTextarea, 0);
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-200 text-amber-900 px-5 py-3 text-sm font-semibold transition-colors h-11 flex items-center justify-center min-w-[64px] shadow-sm"
            >
              送信
            </button>
          </form>
          <p className="text-center text-xs text-amber-900 mt-1.5">
            Enterで送信 &nbsp;/&nbsp; Shift+Enterで改行
          </p>
        </footer>
      )}
    </div>
  );
}
