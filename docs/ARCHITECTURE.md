# SkillTree — Architecture, User Flows & Wireframes

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | One deployable unit for UI + API, first-class Vercel target |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) | Dark-first design system with runtime light-mode overrides |
| Auth + Billing | Clerk v7 (`SignIn`, `SignUp`, `UserProfile`, `UserButton`, `PricingTable`, `CheckoutButton`, webhooks) | Identity & payments outsourced to an audited provider |
| ORM / DB | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) on PostgreSQL | Type-safe queries; connection config in `prisma.config.ts` |
| AI | Anthropic Claude Haiku 4.5 via `@anthropic-ai/sdk` (server-only) | Cheapest current Claude model; structured JSON outputs |
| Visual flair | React Bits: Grainient, CardNav, MagicBento, GlassIcons, SpotlightCard, LightPillar, LineSidebar, Dock | Premium landing + app chrome |
| Tests | Vitest | Pure-logic units: SM-2, XP math, markdown sanitizer |

## 2. Directory layout

```
prisma/schema.prisma          # data model (see DB design below)
prisma.config.ts              # Prisma 7 datasource for migrate/db push
src/
  middleware.ts               # Clerk default-deny route protection
  lib/                        # db, auth, api helpers, validation, plans,
                              # srs (SM-2), xp, activity, achievements,
                              # markdown sanitizer, ai (Claude), notes
  app/
    page.tsx                  # landing (public)
    pricing/                  # Clerk PricingTable + CheckoutButton (public)
    sign-in/ sign-up/         # Clerk components (public)
    (app)/                    # authenticated shell (sidebar + mobile dock)
      dashboard/ skills/ resources/ notes/ reviews/ journal/
      projects/ assistant/ achievements/ settings/ user-profile/
    api/                      # all under requireUser() except webhooks
      me/ skills/ resources/ notes/ flashcards/ reviews/ sessions/
      projects/ journal/ goals/ dashboard/ achievements/
      ai/{summarize,plan,explain,quiz,search}/
      webhooks/clerk/         # Svix-verified user sync
  components/
    reactbits/                # the 8 integrated React Bits components
    AppShell, QuickAdd, ui, icons, ProgressRing, Heatmap, Markdown
```

## 3. Data flow

```
Browser (client components)
   │  fetch JSON (same-origin)
   ▼
API routes  ── requireUser() ──► Clerk session (server-side)
   │  Zod-validated input, userId-scoped queries
   ▼
Prisma 7 ──► PostgreSQL
   │
   └──► Anthropic (Claude Haiku 4.5) for /api/ai/* (server-only key)

Clerk ── Svix-signed webhook ──► /api/webhooks/clerk ──► user upsert/delete
```

A single authorization path: pages are shells, all data crosses through the
guarded API. Gamification (XP → level, streaks, achievements) is applied by
the API as a side effect of the action that earned it.

## 4. Database design (summary)

```
User 1─* Skill (self-referencing tree via parentId)
User 1─* Resource ─? Skill
User 1─* Note ─? Skill,  Note *─* Note ("NoteLinks" wiki links)
User 1─* Flashcard ─? Skill/Resource/Note   (SM-2 state on the card)
User 1─* Review ──► Flashcard               (grade history)
User 1─* LearningSession ─? Skill/Resource/Project (minutes, date)
User 1─* Project 1─* ProjectTask,  Project *─* Skill
User 1─* JournalEntry (unique per userId+date)
User 1─* UserAchievement (unique per userId+code; definitions in code)
User 1─* Goal
User 1─* AiUsage (unique per userId+day — AI quota metering)
```

Derived values: user level/title from `xp` (quadratic curve), skill
tier/progress from skill `xp`, project progress from task completion.

## 5. Key user flows

### Onboarding
```
Landing → Sign up (Clerk) → webhook creates User row →
Dashboard (empty states) → "Plant your first skill" → Skill created (+5 XP)
```

### Daily loop (the habit)
```
Open app → Dashboard: streak, today's goal ring, reviews due
 → Reviews: grade cards Easy/Medium/Hard (SM-2 reschedules, +5 XP each)
 → Quick add (＋): log 25 min on a skill (+25 XP, streak extends)
 → Journal: 3 reflection prompts + confidence (+15 XP, once/day)
```

### Study a new material
```
Library → Add resource (linked to skill) →
Assistant → paste text → Summarize → study kit
 (summary, concepts, terms, flashcards → saved into review deck, quiz)
 → cards appear in tomorrow's review queue
```

### Upgrade
```
Any limit hit (403 with message) → /pricing → Clerk PricingTable /
CheckoutButton (drawer) → Clerk Billing subscription → auth().has({plan:
'premium'}) flips server-side → limits raised, premium endpoints unlocked
```

## 6. Wireframes (text)

```
DESKTOP APP SHELL                      MOBILE
┌──────┬──────────────────────┐        ┌──────────────────┐
│ logo │  Good morning, Alex  │        │ ☰ SkillTree    ◉ │ ← top bar
│      │  L12 · Developer     │        ├──────────────────┤
│ 01 Dashboard ● ┌─────┐┌────┐│        │ goal ring  streak│
│ 02 Skills      │ring ││🔥23││        │ ┌──────────────┐ │
│ 03 Library     └─────┘└────┘│        │ │ heatmap →    │ │
│ 04 Notes       ┌───────────┐│        │ └──────────────┘ │
│ 05 Reviews     │ heatmap   ││        │ skills bars      │
│ 06 Journal     └───────────┘│        │                  │
│ 07 Projects    Programming  │        │                  │
│ 08 Assistant   ████████ 80% │        ├──────────────────┤
│ 09 Achievemnts Spanish      │        │ ⌂  🌳  ＋  🃏  ✦ │ ← Dock
│ 10 Settings    ██████   60% │        └──────────────────┘
│ [◉ user] [+Log]             │          (＋ = quick add)
└──────┴──────────────────────┘

REVIEW CARD                            LANDING (above the fold)
┌────────────────────────┐             ┌──────────────────────┐
│ [React]      12 in queue│            │  ~animated gradient~  │
│                        │             │  [card nav: ☰ SkillTree Get Started]
│  What is a closure?    │             │                       │
│  ──────────────────    │             │  Stop forgetting      │
│  (answer after flip)   │             │  what you learn.      │
│                        │             │                       │
│ [Hard] [Medium] [Easy] │             │ [Start free] [Sign in]│
└────────────────────────┘             └──────────────────────┘
```

## 7. Development roadmap

### Phase 1 — MVP ✅ (this repository)
Account system (Clerk), dashboard (rings/heatmap/streaks), skill tree,
resource library, notes with wiki-links, session logging, journal,
projects+tasks, gamification (XP/levels/achievements), settings, mobile
shell (dock + quick add).

### Phase 2 — Learning engine ✅ (this repository)
Flashcards + SM-2 spaced repetition + review queue; AI assistant
(summarize→study kit, explain, quiz); flashcard auto-save from AI.

### Phase 3 — Monetization & advanced AI ✅ / ⏭
✅ Clerk Billing (PricingTable/CheckoutButton), server-enforced plan
limits, premium AI learning plans, premium knowledge search.
⏭ Next: file/PDF uploads to cloud storage (premium), streak reminders
(email/push via cron), richer analytics (retention curves, per-skill time
series), optional leaderboard, PWA install + offline review, nonce-based
CSP.

### Testing strategy
- Unit (Vitest): SM-2 scheduling, XP/level math, markdown sanitizer
  (XSS suite) — `npm test`.
- Build-time: strict TypeScript + Next.js type-checked routes.
- Runtime smoke: unauthenticated access to protected pages/APIs is denied;
  unsigned webhooks rejected; security headers asserted.
- Recommended next: Playwright E2E against a seeded Postgres + Clerk test
  instance for the daily loop (log session → review → journal).
