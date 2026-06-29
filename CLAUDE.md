@AGENTS.md

# kotoba-ai — こころの縁側

AI-powered life consultation app that emulates the style of legendary Japanese Buddhist nun 瀬戸内寂聴 (Jakucho Setouchi). The user shares a personal struggle; the AI asks follow-up questions until it has enough context, then produces a structured "prescription" (処方箋) of compassionate guidance.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 — App Router |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript 5 (strict mode) |
| Primary AI | Anthropic SDK (`@anthropic-ai/sdk`) |
| Japanese NLP | kuromoji (tokenizer for TTS reading conversion) |
| Font | Noto Sans JP (Google Fonts) |

> **Next.js 16 warning**: This version has breaking changes vs. what most training data knows. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.

## Directory Structure

```
kotoba-ai/
├── app/
│   ├── api/
│   │   ├── hearing/route.ts   # Phase 1: asks follow-up questions via claude-haiku-4-5
│   │   ├── answer/route.ts    # Phase 2: generates the prescription via claude-sonnet-4-6
│   │   └── readings/route.ts  # Converts kanji text → hiragana for TTS (kuromoji)
│   ├── layout.tsx             # Root layout — sets metadata and Noto Sans JP font
│   ├── page.tsx               # Entry point — renders <ChatInterface />
│   └── globals.css
├── components/
│   ├── ChatInterface.tsx      # Main state machine: hearing → answering → complete
│   ├── MessageBubble.tsx      # Per-message chat bubble (user right, AI left)
│   ├── WordCard.tsx           # "今日の言葉" card with SNS copy button
│   ├── AmuletMessage.tsx      # Short amulet message display
│   ├── SpeakButton.tsx        # Web Speech API TTS button (calls /api/readings first)
│   └── VoiceInputButton.tsx   # Web SpeechRecognition voice input
├── lib/
│   ├── anthropic.ts           # getAnthropic() — reads ANTHROPIC_API_KEY, no singleton
│   ├── openai.ts              # getOpenAI() — singleton, not currently wired to any route
│   └── kuromoji-server.ts     # Server-side kuromoji tokenizer (lazy singleton promise)
├── types/
│   └── index.ts               # Shared types: Message, AnswerResponse, AppPhase, etc.
├── AGENTS.md                  # Next.js 16 agent rules (auto-included by CLAUDE.md)
└── CLAUDE.md                  # This file
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Used by both `/api/hearing` and `/api/answer` |
| `OPENAI_API_KEY` | No | Present in `lib/openai.ts` but not wired to any route |

Create `.env.local` with at minimum:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Application Flow

```
User types message
       ↓
POST /api/hearing  (claude-haiku-4-5)
       ↓
{ status: "question", question: "..." }  →  show question, loop
       ↓  (when enough info gathered)
{ status: "ready" }
       ↓
POST /api/answer  (claude-sonnet-4-6, tool_choice forced)
       ↓
AnswerResponse { section1..5, todaysWord, amuletMessage }
       ↓
Render prescription card + WordCard + AmuletMessage
```

`AppPhase` states in `ChatInterface`: `'hearing'` → `'answering'` → `'complete'`

## AI Models

- **`claude-haiku-4-5`** (`/api/hearing`): fast, low-cost questioning. Returns strict JSON `{"status":"question","question":"..."}` or `{"status":"ready"}`. Uses `extractFirstJson()` to recover from any model preamble.
- **`claude-sonnet-4-6`** (`/api/answer`): full prescription. Uses Anthropic **tool use** (`tool_choice: { type: 'tool', name: 'provide_answer' }`) to guarantee structured output — no JSON parsing needed.

## Key Conventions

### TypeScript
- Strict mode enabled. Never use `any` except in browser API wrappers (SpeechRecognition).
- Path alias `@/` maps to the project root. Use it for all non-relative imports.
- All shared types live in `types/index.ts`.

### Components
- Mark every component that uses browser APIs or React hooks with `'use client'` at the top.
- Server components are the default (no directive needed).
- Component files are PascalCase; one component per file.

### API Routes
- All routes are in `app/api/*/route.ts` following App Router convention.
- Each route exports only the HTTP methods it handles (e.g., `export async function POST`).
- Errors are returned as `{ error: string }` with an appropriate HTTP status code.
- `lib/anthropic.ts` exposes `getAnthropic()` (no singleton — creates a new client each call, validates `ANTHROPIC_API_KEY`).

### Styling
- Tailwind CSS v4 (PostCSS plugin at `@tailwindcss/postcss`). No `tailwind.config.*` file — v4 uses CSS-first config.
- Design language: warm amber/stone palette, rounded-2xl cards, soft shadows.
- No custom component library. All styling is inline Tailwind classes.

### Japanese Text / TTS
- `lib/kuromoji-server.ts` runs server-side only (Node.js). It converts kanji text to hiragana using kuromoji for better TTS pronunciation.
- `SpeakButton` calls `POST /api/readings` to get the hiragana reading, then falls back to original text on failure before calling `window.speechSynthesis`.
- Voice input uses `window.SpeechRecognition` (or `webkitSpeechRecognition`) with `lang: 'ja-JP'`.

## Development Workflow

```bash
npm install          # install dependencies
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build
npm run lint         # ESLint (eslint-config-next core-web-vitals + typescript)
```

No test framework is configured. Manual testing in the browser is the primary verification method.

## Deployment

Target platform is **Vercel**. Set `ANTHROPIC_API_KEY` in the Vercel project's Environment Variables. No other build configuration is needed.

## What to Watch Out For

1. **`extractFirstJson` in `/api/hearing`**: The hearing route uses a depth-tracking JSON parser because older model outputs occasionally include trailing text or XML-like tags. Do not remove this — it is a deliberate robustness fix.
2. **Hearing vs. Answer model choice**: `claude-haiku-4-5` is intentional for the hearing phase (speed/cost); `claude-sonnet-4-6` is intentional for the answer phase (quality). Do not swap them without understanding the tradeoff.
3. **kuromoji dict path**: `kuromoji-server.ts` resolves the dictionary from `process.cwd() + /node_modules/kuromoji/dict`. This only works server-side (API routes). Never import it from a client component.
4. **OpenAI client exists but is unused**: `lib/openai.ts` is a leftover from an earlier version. The app runs entirely on Anthropic. Do not wire it to new routes without deliberate intent.
5. **No `.env.local.example`**: The README documents the required variables; there is no committed example file. Create `.env.local` manually.
