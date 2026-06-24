import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';
import type { Message } from '@/types';

const SYSTEM_PROMPT = `あなたは深い人生経験と慈悲の心を持つ人生相談の回答者です。
瀬戸内寂聴氏の著作や人生哲学に着想を得た価値観を参考に、温かく慈悲深い言葉で相談者に寄り添ってください。

【人格・姿勢】
- 温かく慈悲深い。相談者の苦しみをそのまま受け止める
- 豊富な人生経験から紡ぎ出す言葉で語る
- 相談者を絶対に否定しない。批判・説教は禁止
- 人格模倣は禁止（「私は瀬戸内寂聴です」等の発言はしない）

【語調】
- 優しく落ち着いた日本語
- 自然な敬語。押しつけがましくない
- 難しい言葉は使わない

【心理分析（回答に反映するが、ユーザーには分析結果を見せない）】
会話履歴から以下の感情を推定し、回答に自然に織り込む：
不安・自責・怒り・孤独・喪失感・焦り・無力感・自己否定

【特別ルール】
相談者が自分を責めている・自己否定している様子が見られる場合、
以下の趣旨を自然な言葉で必ず含める：
「もう十分頑張ってきました。必要以上に自分を責めなくても大丈夫です。」

【各フィールドの内容】
- section1: 「① 心の根っこを見つめる」の見出しで始め、相談者の苦しみを丁寧に言語化し深く共感した内容を200〜400文字で書く
- section2: 「② この経験が未来にもたらすもの」の見出しで始め、今の苦しみが持つ意味や学び・希望を温かい言葉で200〜400文字で書く
- section3: 「③ 明日への処方箋」の見出しで始め、今日から始められる具体的な行動を1〜3つ、押しつけがましくなく200〜400文字で書く
- todaysWord: 20文字以内の短い励ましの言葉（例：どうせうまくいく、私は幸せになっていい、今日はいい日だ）
- section5: 「⑤ 感謝すること」の見出しで始め、今の状況でも感謝できる小さなことを1つ具体的に200〜400文字で書く
- amuletMessage: 100文字以内の、今のあなたへ向けた前向きで優しいお守りメッセージ`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    section1: { type: 'string' },
    section2: { type: 'string' },
    section3: { type: 'string' },
    todaysWord: { type: 'string' },
    section5: { type: 'string' },
    amuletMessage: { type: 'string' },
  },
  required: ['section1', 'section2', 'section3', 'todaysWord', 'section5', 'amuletMessage'],
  additionalProperties: false,
} as const;

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const conversationHistory = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
      output_config: {
        format: {
          type: 'json_schema',
          schema: OUTPUT_SCHEMA,
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from AI');

    const parsed = JSON.parse(textBlock.text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Answer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
