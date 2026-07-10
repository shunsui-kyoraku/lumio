# SkillTree — Product Specification

> An AI-powered personal learning tracker that turns passive content consumption
> into measurable skill development.

## 1. Problem

People consume enormous amounts of information — books, courses, videos,
podcasts, docs — but forget most of it because they never organize it, review
it, or measure their progress.

## 2. Solution

A personal learning dashboard that:

1. **Stores** learning materials (books, videos, courses, articles, PDFs, projects, certifications)
2. **Structures** knowledge as a skill tree with progress per skill
3. **Creates** notes with markdown, tags and bidirectional links
4. **Generates** summaries, flashcards, quizzes and learning plans with AI
5. **Schedules** reviews with spaced repetition (SM-2)
6. **Visualizes** progress (rings, charts, calendar heatmap, skill tree)
7. **Motivates** through XP, levels, streaks, and achievements

## 3. Target users

| Segment | Job to be done |
|---|---|
| University students | Organize course material, prepare for exams |
| Programmers | Track technology learning paths (e.g. C# → OOP → LINQ) |
| Professionals | Upskill deliberately, prove progress |
| Self-taught learners | Structure a curriculum without a school |
| Certification candidates | Spaced review until the exam date |
| Employees in training | Track mandated training + reflection |
| Hobby learners | Keep momentum through gamification |

## 4. Core feature set

### 4.1 Accounts (Clerk)
- Registration, login, password reset, MFA, profile & security management —
  all delegated to **Clerk** prebuilt components (`<SignIn/>`, `<SignUp/>`,
  `<UserProfile/>`, `<UserButton/>`).
- App-level profile: learning goals, current skills summary, preferred
  learning style, daily minutes goal, weekly hours target, timezone, theme.
- Subscription status via **Clerk Billing** (`<PricingTable/>`,
  `<CheckoutButton/>`, server-side `has({ plan })` checks).

### 4.2 Dashboard
- Today: minutes learned, sessions, reviews due, current streak.
- Week: total hours, skills improved, topics studied, weekly-target %.
- Visuals: progress ring for the daily goal, 12-month calendar heatmap
  (GitHub-style), per-skill progress bars, XP/level card.

### 4.3 Skill tree
- Hierarchical skills (parent/children, arbitrary depth).
- Fields: name, description, category, difficulty, progress %, level
  (Beginner → Intermediate → Advanced → Expert derived from XP), color.
- Progress is earned via logged learning sessions, completed resources,
  reviews and project work.

### 4.4 Learning material library
- Types: book, video, course, article, PDF, podcast, project, certification, other.
- Fields: title, type, URL, author, category, linked skill, difficulty,
  status (`NOT_STARTED / IN_PROGRESS / COMPLETED / MASTERED`),
  difficulty rating (1–5★), quality rating (1–5★), notes.

### 4.5 AI assistant (Claude Haiku 4.5 — cheapest suitable model)
- **Summarize** pasted material → summary, key concepts, key terms,
  flashcards, quiz questions (structured JSON output).
- **Plan**: "learn Python in 3 months" → week-by-week plan.
- **Explain** a concept adapted to the user's level.
- **Quiz** generation for any skill/topic.
- **Knowledge search**: "what did I learn about databases?" → AI answers
  grounded in the user's own notes/resources (retrieval from their data only).

### 4.6 Smart review (spaced repetition)
- SM-2 algorithm: each flashcard has ease factor, interval, repetition count.
- Daily review queue; grading Easy / Medium / Hard adjusts the schedule.

### 4.7 Notes
- Markdown editor with live preview (sanitized rendering — no raw HTML).
- Tags, full-text search, `[[wiki-links]]` between notes, link to skills.

### 4.8 Learning journal
- Daily reflection: what did you learn, what was difficult, open questions,
  confidence (1–5). Timeline view.

### 4.9 Gamification
- XP for every activity (sessions, reviews, notes, journal, completing resources).
- Levels 1–100 (Beginner → Developer → Master curve).
- Achievements: streaks, hours milestones, first project, etc.
- Streak = consecutive days with any learning activity.

### 4.10 Projects
- Projects with tasks, progress %, time spent, linked skills.

## 5. Business model (Clerk Billing)

| | Free | Premium €6.99/mo |
|---|---|---|
| Skills | 3 | Unlimited |
| Resources | 25 | Unlimited |
| Notes | 50 | Unlimited |
| AI requests | 10/day | 200/day |
| AI learning plans | — | ✓ |
| Knowledge search | — | ✓ |
| Advanced analytics | Basic | ✓ |

Plan slug in Clerk: `premium`. Enforcement is **server-side only** —
`hasPremium()` via Clerk's `auth().has({ plan: 'premium' })`, plus hard
count limits in every create endpoint. UI hints are cosmetic; the API is the
boundary.

## 6. Non-functional requirements

- **Security first** — see `docs/SECURITY.md`. Default-deny middleware,
  per-user data scoping on every query, Zod validation on every input,
  webhook signature verification, rate limiting, strict security headers,
  sanitized markdown, server-only AI keys.
- Mobile-first responsive design (bottom dock on mobile, sidebar on desktop).
- Dark mode default with light mode support.
- P95 API latency < 300 ms for CRUD (AI endpoints excluded).

## 7. Out of scope (v1)

- Native mobile apps (PWA-ready responsive web instead).
- Team/organization features, leaderboards (schema supports it later).
- File uploads to cloud storage (paste-text AI summarize instead; upload is a
  Phase 3 item behind Premium).
