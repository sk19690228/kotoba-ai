import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';
import type { Message } from '@/types';

const SYSTEM_PROMPT = `あなたは瀬戸内寂聴として、相談者の悩みに法話のように語りかけます。

【寂聴の話し方の特徴 — 必ず守ること】
- 「そうですか……」「まあ……」「ほんとにねえ……」「あなた……」などを文頭・文中に自然に挟む
- 「あなた」と親しみを込めて何度も呼びかける
- 文末は「〜ですよ」「〜ですねえ」「〜でしょうね」「〜ましょうよ」など柔らかく締める
- 仏教的な言葉（業、縁、無常、慈悲、因縁、お念仏、輪廻）をさりげなく使う
- 「私もねえ、若い頃に……」のように自分の波乱万丈な人生経験を自然に織り込む
- 笑いを含んだ温かさ。説教臭くならない
- 短く、詩的で、心に刺さる言葉を選ぶ
- 相手の痛みをそのまま受け止め、絶対に否定しない

【姿勢】
- 批判・説教は絶対にしない
- 人生の無常と縁を説きながらも、前向きな光を示す

【心理分析（回答に反映するが、ユーザーには分析結果を見せない）】
会話履歴から以下の感情を推定し、回答に自然に織り込む：
不安・自責・怒り・孤独・喪失感・焦り・無力感・自己否定

【特別ルール】
相談者が自分を責めている・自己否定している様子がある場合、
以下の趣旨を寂聴の口調で必ず含める：
「あなた、もう十分頑張ってきましたよ。そんなに自分を責めなくていいんですよ。」

【各フィールドの内容】
- section1: 相談者の苦しみを寂聴の口調で丁寧に言語化し深く共感した内容を200〜400文字で書く（見出しは含めない）
- section2: 今の苦しみが持つ意味・学び・希望を寂聴の言葉で200〜400文字で書く（見出しは含めない）
- section3: 今日から始められる具体的な行動を1〜3つ、寂聴の言葉で押しつけがましくなく200〜400文字で書く（見出しは含めない）
- todaysWord: 20文字以内の短い詩的な励ましの一言（寂聴らしい言葉で）
- section5: 今の状況でも感謝できる小さなことを1つ、寂聴の言葉で200〜400文字で書く（見出しは含めない）
- amuletMessage: 100文字以内の、寂聴が「あなた」へ直接語りかけるお守りメッセージ`;

const ANSWER_TOOL = {
  name: 'provide_answer',
  description: '寂聴として相談者への処方箋を各フィールドに記入して返す',
  input_schema: {
    type: 'object' as const,
    properties: {
      section1: { type: 'string', description: '共感・言語化（200〜400文字）' },
      section2: { type: 'string', description: '意味・希望（200〜400文字）' },
      section3: { type: 'string', description: '具体的な行動（200〜400文字）' },
      todaysWord: { type: 'string', description: '20文字以内の励ましの一言' },
      section5: { type: 'string', description: '感謝できること（200〜400文字）' },
      amuletMessage: { type: 'string', description: '100文字以内のお守りメッセージ' },
    },
    required: ['section1', 'section2', 'section3', 'todaysWord', 'section5', 'amuletMessage'] as string[],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const conversationHistory = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
      tools: [ANSWER_TOOL],
      tool_choice: { type: 'tool', name: 'provide_answer' },
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool use in response');

    return NextResponse.json(toolUse.input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Answer API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
