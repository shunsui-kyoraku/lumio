# SkillTree 🌳

**An AI-powered personal learning tracker** — turn books, courses, videos and
projects into a living skill tree with spaced repetition, structured notes,
daily journaling and progress you can actually see.

Built with Next.js 15 · React 19 · TypeScript · Tailwind v4 · Prisma 7 ·
PostgreSQL · Clerk (auth + billing) · Claude Haiku 4.5.

## Features

- **Skill tree** — hierarchical skills that level up (Beginner → Expert) as
  you log sessions, finish resources and pass reviews
- **Library** — books, videos, courses, articles, PDFs, podcasts,
  certifications and projects with status + ★ ratings
- **Notes** — markdown, tags, full-text search and `[[wiki links]]`
- **Smart reviews** — SM-2 spaced repetition flashcards (Easy/Medium/Hard)
- **AI assistant** — paste material → summary + key concepts + flashcards +
  quiz; explain concepts at your level; generate quizzes; build week-by-week
  learning plans; search your own knowledge (Premium)
- **Dashboard** — daily goal ring, GitHub-style heatmap, streaks, weekly stats
- **Gamification** — XP, 100 levels, titles, 15 achievements
- **Journal** — daily reflection with confidence tracking
- **Projects** — tasks, progress %, time and linked skills
- **Subscriptions** — Free vs Premium (€6.99/mo) via Clerk Billing, enforced
  server-side

See [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md),
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/SECURITY.md`](docs/SECURITY.md).

## Getting started

### 1. Prerequisites

- Node 20+ and a PostgreSQL database (Neon / Supabase / local)
- A [Clerk](https://dashboard.clerk.com) application
- An [Anthropic API key](https://platform.claude.com) (for AI features)

### 2. Configure

```bash
cp .env.example .env.local
# fill in DATABASE_URL, Clerk keys, ANTHROPIC_API_KEY
```

In the Clerk dashboard:

1. **Webhooks** → add endpoint `https://<your-domain>/api/webhooks/clerk`
   subscribed to `user.created`, `user.updated`, `user.deleted`; copy the
   signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.
2. **Billing** → create a plan with slug `premium` (€6.99/month); copy its
   plan id into `NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID`.

### 3. Run

```bash
npm install
npm run db:push      # create tables
npm run dev          # http://localhost:3000
```

### 4. Test & build

```bash
npm test             # unit tests (SM-2, XP, markdown sanitizer)
npm run build        # production build (type-checked)
```

## Deployment (Vercel)

1. Import the repo, set the env vars from `.env.example`.
2. `npm run build` runs `prisma generate` automatically.
3. Point the Clerk webhook at the production URL and switch to production
   Clerk keys (remember the CSP note in `next.config.ts` for your custom
   Clerk domain).

## Security

Default-deny middleware, per-user data scoping on every query, Zod
validation on every input, Svix-verified webhooks, sanitized markdown
rendering, server-side plan enforcement, DB-backed AI quotas and strict
security headers. Details in [`docs/SECURITY.md`](docs/SECURITY.md).
