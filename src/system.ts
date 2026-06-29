import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { TwitterApi } from 'twitter-api-v2';

const prisma = new PrismaClient();

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

function getTwitter(): TwitterApi {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    throw new Error(
      'X API credentials incomplete — set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET'
    );
  }
  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_TOKEN_SECRET,
  });
}

export async function runPostingWorker(): Promise<void> {
  const now = new Date();
  const duePosts = await prisma.post.findMany({
    where: { status: 'pending', scheduledAt: { lte: now } },
    orderBy: { scheduledAt: 'asc' },
  });

  if (duePosts.length === 0) {
    console.log('No posts due at this time.');
    return;
  }

  const twitter = getTwitter();
  for (const post of duePosts) {
    try {
      const tweet = await twitter.v2.tweet(post.content);
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'posted', postedAt: new Date(), xPostId: tweet.data.id },
      });
      console.log(`Posted ${tweet.data.id}: ${post.content.slice(0, 60)}…`);
    } catch (err) {
      await prisma.post.update({ where: { id: post.id }, data: { status: 'failed' } });
      console.error(`Failed to post ${post.id}:`, err);
    }
  }
}

export async function runDailyPDCACycle(accountId: string): Promise<void> {
  const openai = getOpenAI();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setDate(endOfYesterday.getDate() + 1);

  const posts = await prisma.post.findMany({
    where: {
      accountId,
      status: 'posted',
      postedAt: { gte: yesterday, lt: endOfYesterday },
    },
  });

  const postSummary =
    posts.length > 0
      ? posts.map((p) => `・${p.content}`).join('\n')
      : '（昨日の投稿データなし）';

  const prompt = `以下は昨日投稿したXのAmazonアフィリエイト投稿です:
${postSummary}

これらをPDCA観点で分析し、何が効果的だったか・何を改善すべきかを日本語で簡潔に回答してください。`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  const analysis = res.choices[0].message.content ?? '';

  // Ensure the account row exists
  await prisma.account.upsert({
    where: { id: accountId },
    update: {},
    create: { id: accountId },
  });

  await prisma.pdcaLog.create({ data: { accountId, date: yesterday, analysis } });
  console.log('PDCA analysis saved.');
}

export async function queueDailyPostsWithPDCA(
  accountId: string,
  baseText: string,
  amazonUrl: string
): Promise<void> {
  const openai = getOpenAI();

  const recentLog = await prisma.pdcaLog.findFirst({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  });

  const pdcaContext =
    recentLog?.analysis ?? '初回投稿のため過去データなし。魅力的な商品紹介投稿を作成してください。';

  const prompt = `以下の情報を元に、Xに投稿するAmazonアフィリエイト投稿を16本作成してください。

【PDCA分析（前回の振り返り）】
${pdcaContext}

【元ネタ（商品・訴求内容）】
${baseText}

【AmazonアフィリエイトURL】
${amazonUrl}

要件:
- 各投稿は270文字以内（URL含む）
- 最後にAmazonのURLを必ず含める
- 絵文字を効果的に使い目を引くコピー
- 購買意欲を高める多様な切り口（悩み解決・口コミ・限定感など）
- 16本すべて異なる切り口で

必ず次のJSON形式のみで回答: {"posts": ["投稿1", "投稿2", ...]}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const raw = res.choices[0].message.content ?? '{"posts":[]}';
  let posts: string[];
  try {
    const parsed = JSON.parse(raw) as { posts?: string[] };
    posts = parsed.posts ?? [];
  } catch {
    throw new Error(`OpenAI response is not valid JSON: ${raw}`);
  }

  if (posts.length === 0) throw new Error('OpenAI returned 0 posts');

  // Ensure account row exists
  await prisma.account.upsert({
    where: { id: accountId },
    update: {},
    create: { id: accountId },
  });

  // Schedule starting from the next full hour, every 90 minutes
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const intervalMs = 90 * 60 * 1000;

  for (let i = 0; i < posts.length; i++) {
    const scheduledAt = new Date(start.getTime() + intervalMs * i);
    await prisma.post.create({
      data: { accountId, content: posts[i], amazonUrl, scheduledAt },
    });
  }

  console.log(`Queued ${posts.length} posts starting at ${start.toISOString()}.`);
}
