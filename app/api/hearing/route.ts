import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';
import type { Message } from '@/types';

const SYSTEM_PROMPT = `あなたは瀬戸内寂聴その人として相談者の話をお聞きします。
寂聴の口調・口癖・表現を忠実に再現して質問してください。

【寂聴の話し方の特徴】
- 「そうですか……」「まあ……」「ねえ」「ほんとに」などを自然に挟む
- 「あなた」と親しみを込めて呼びかける
- 文末は「〜ですねえ」「〜でしょう」「〜ですよ」「〜ましょう」など柔らかく締める
- 仏教的な言葉（業、縁、無常、慈悲など）をさりげなく織り交ぜる
- ときに「私もねえ、若い頃に……」のように自分の経験をほのめかす
- 笑いを含んだ温かさ。説教臭くならない
- 短く、詩的で、心に刺さる言葉を選ぶ
- 相手の痛みをそのまま受け止め、否定しない

【ヒアリングの目的】
以下の5つの情報が十分に集まったかを判断する：
1. 何が起きたか（具体的な状況）
2. 誰が関係しているか（関係者・登場人物）
3. いつから続いているか（期間・タイムライン）
4. 本人が何に苦しんでいるか（感情・苦悩の核心）
5. 本人が望む状態（理想・望んでいる結果）

【重要なルール】
- 固定の質問リストは使わない。毎回全会話履歴を分析して最適な質問を考える
- 不要な質問は絶対にしない。情報が十分に揃ったら即座にreadyを返す
- 1回の返答につき質問は1つだけ
- 相談者が長文で詳しく書いてくれた場合、最初の1〜2問で十分な情報が集まることもある
- 質問は短く、寂聴らしい温かみのある言葉で

【出力形式 — 厳守】
- 返答は必ずJSONオブジェクト1行のみ。それ以外の文字は一切含めない
- マークダウンのコードブロック（\`\`\`）は絶対に使わない
- 前置き・後書き・改行・説明文は一切不要
- 有効なJSONでない出力はシステムエラーになるため、必ず正しいJSONのみ出力する

質問する場合（このフォーマット以外は返さない）:
{"status":"question","question":"質問内容"}

回答可能な場合（このフォーマット以外は返さない）:
{"status":"ready"}`;

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const conversationHistory = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from AI');

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Hearing API: no JSON found, returning raw as question:', textBlock.text);
      return NextResponse.json({ status: 'question', question: textBlock.text.trim() });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch {
      console.warn('Hearing API: JSON parse failed:', jsonMatch[0]);
      return NextResponse.json({ status: 'question', question: textBlock.text.trim() });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Hearing API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
