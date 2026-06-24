# 言葉の処方箋AI

人生相談に特化した対話型AI。AIが必要な質問を重ねながら相談内容を深く理解し、心に響く「処方箋」を届けます。

> 苦しかったことは、いつかあなたの力になります。

## 機能

- **ヒアリングAI**: 会話履歴を分析しながら必要な情報だけを質問（固定質問なし）
- **処方箋生成**: 5つのセクション（心の根っこ・未来・明日への処方箋・今日の言葉・感謝）
- **今日の言葉カード**: SNSシェア用コピー機能付き
- **お守りメッセージ**: 100文字以内の前向きなメッセージ

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、OpenAI APIキーを設定します。

```bash
cp .env.local.example .env.local
```

`.env.local`:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

## Vercelデプロイ手順

### 方法1: Vercel CLIを使う

```bash
npm install -g vercel
vercel
```

デプロイ後、Vercelダッシュボードで環境変数 `OPENAI_API_KEY` を設定してください。

### 方法2: GitHubと連携する

1. GitHubにリポジトリを作成してプッシュ
2. [Vercel](https://vercel.com) でNew Projectからリポジトリをインポート
3. Environment Variablesに `OPENAI_API_KEY` を追加
4. Deployボタンをクリック

## 技術スタック

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **OpenAI API** (gpt-4o-mini でヒアリング、gpt-4o で回答生成)

## ディレクトリ構成

```
kotoba-ai/
├── app/
│   ├── api/
│   │   ├── hearing/route.ts   # ヒアリングAI
│   │   └── answer/route.ts    # 回答生成AI
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ChatInterface.tsx      # メインUI
│   ├── MessageBubble.tsx      # チャットバブル
│   ├── WordCard.tsx           # 今日の言葉カード
│   └── AmuletMessage.tsx      # お守りメッセージ
├── types/
│   └── index.ts               # 型定義
└── lib/
    └── openai.ts              # OpenAIクライアント
```
# kotoba-ai
