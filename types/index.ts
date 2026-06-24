export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export type Category =
  | '仕事'
  | '恋愛'
  | '家族'
  | '友人'
  | 'お金'
  | '健康'
  | '将来不安'
  | '自己肯定感'
  | 'その他';

export interface HearingResponse {
  status: 'question' | 'ready';
  question?: string;
}

export interface AnswerResponse {
  section1: string;
  section2: string;
  section3: string;
  todaysWord: string;
  section5: string;
  amuletMessage: string;
}

export type AppPhase = 'hearing' | 'answering' | 'complete';
