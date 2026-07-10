# SkillTree — Security Design

Security is treated as a first-class requirement, not an afterthought. This
document describes the concrete controls in the codebase and where each one
lives.

## 1. Authentication (Clerk)

- All identity flows (sign-up, sign-in, password reset, MFA, sessions,
  device management) are delegated to **Clerk** — battle-tested, SOC 2
  audited, no passwords ever touch our code or database.
- `src/middleware.ts` uses `clerkMiddleware` with a **default-deny** policy:
  every route is protected unless explicitly whitelisted (`/`, `/pricing`,
  `/sign-in`, `/sign-up`, `/api/webhooks/*`). A newly added route is private
  by default — the safe failure mode.
- Server code resolves the caller with `requireUser()` (`src/lib/auth.ts`),
  which reads the Clerk session server-side. There is no client-supplied
  user id anywhere in the API.

## 2. Authorization / tenant isolation

- **Every** Prisma query in every route filters by `userId` (or through an
  owned parent, e.g. task → project → userId). There is no endpoint that
  accepts an object id without an ownership check.
- Foreign keys in request bodies (`skillId`, `resourceId`, `noteId`,
  `projectId`, `parentId`) are verified to belong to the caller before use —
  no cross-tenant references can be created.
- Missing and not-owned resources both return **404** (`notFound()` in
  `src/lib/api.ts`) so object ids cannot be enumerated (no 403 oracle).
- IDs are CUIDs — non-sequential and unguessable — as defense in depth, not
  as the primary control.

## 3. Input validation

- Every mutating endpoint parses its body through a **Zod schema**
  (`src/lib/validation.ts`): type-checked, length-bounded, enum-restricted,
  and unknown keys are stripped (no mass assignment).
- URLs are validated to `http(s)` only. Colors must match `#rrggbb`. Numeric
  ranges are clamped (ratings 1–5, minutes 1–1440, etc.).
- Malformed JSON and validation failures return 400 with a safe message.

## 4. XSS protection

- User markdown (notes, AI output) is rendered by a **sanitizing renderer**
  (`src/lib/markdown.ts`): all input is HTML-escaped *first*, then a fixed
  safe subset of tags is reconstructed. Link hrefs are validated to http(s)
  and URLs containing quote entities are rejected. `javascript:`/`data:`
  URLs can never become anchors. Covered by unit tests
  (`src/lib/__tests__/markdown.test.ts`).
- No other `dangerouslySetInnerHTML` sink receives user input.
- A strict **Content-Security-Policy** plus `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy` and HSTS are set for
  every response in `next.config.ts`. (Note: `script-src 'unsafe-inline'`
  is required by Next.js hydration without a nonce pipeline — documented
  tradeoff; all other directives are locked down.)

## 5. Webhooks

- `/api/webhooks/clerk` verifies the **Svix signature** with
  `verifyWebhook()` against `CLERK_WEBHOOK_SIGNING_SECRET` before touching
  the payload. Unsigned/tampered requests → 400. (Verified in smoke tests.)

## 6. Billing & plan enforcement

- Plan checks use Clerk Billing's server-side `auth().has({ plan })` —
  never a client-supplied flag.
- Free-tier limits (3 skills / 25 resources / 50 notes) are enforced by
  counting rows **in the create endpoints** (`src/lib/plans.ts`). The UI
  hints are cosmetic; the API is the boundary.
- Premium-only endpoints (`/api/ai/plan`, `/api/ai/search`) call
  `requirePremium()` server-side.

## 7. AI safety

- `ANTHROPIC_API_KEY` is server-only; `src/lib/ai.ts` imports
  `"server-only"` so it can never be bundled into client code.
- **Quota**: each AI call atomically consumes from a per-user daily counter
  stored in Postgres (`AiUsage`, unique `(userId, day)`) — works across
  serverless instances, unlike in-memory limiters. 429 on exhaustion.
- **Prompt-injection hardening**: user text is wrapped in delimited data
  blocks and the system prompts instruct the model to treat it strictly as
  data. Knowledge search retrieves **only the caller's own rows** — the
  model never sees other tenants' data.
- AI provider errors are mapped to opaque 502/429 responses; no upstream
  details leak.

## 8. Error handling & information exposure

- `withApi()` (`src/lib/api.ts`) wraps every handler: expected errors carry
  a status + safe message; anything else is logged server-side and returned
  as a generic 500. No stack traces, no Prisma error internals, no header
  `X-Powered-By` (`poweredByHeader: false`).

## 9. Data lifecycle

- Clerk `user.deleted` webhook deletes the local user row; **all** user data
  cascades via Prisma relations (GDPR-friendly erasure).

## 10. Secrets

- `.env*` is gitignored; `.env.example` documents required variables with
  placeholders only. No secret is ever committed or exposed with
  `NEXT_PUBLIC_`.

## Known gaps / future hardening

- CSP without nonces (see §4). A nonce-based CSP would allow dropping
  `unsafe-inline` for scripts.
- No per-IP rate limiting on public routes (Vercel/WAF layer recommended in
  production).
- The production Clerk custom domain must be added to the CSP when
  switching off `*.clerk.accounts.dev` (see comment in `next.config.ts`).
