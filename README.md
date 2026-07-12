# Helagi — Medical AI Chat

A public-facing medical AI assistant. Visitors land on a homepage, sign in
(or continue as guest), then describe symptoms or ask health questions;
Helagi triages urgency, asks simple Yes/No follow-up questions (rendered as
clickable buttons), and answers grounded in the WHO ICD-11 classification —
streamed token-by-token from the Anthropic Claude API. A "Summary for your
doctor" button turns the conversation into a printable handover document.

> ⚕️ Helagi provides general health information, not medical advice. The UI and
> system prompt both enforce this framing; keep it that way.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Anthropic Claude API** (`claude-sonnet-4-6`) with streaming + tool use
- **WHO ICD-11 API** — official disease names/codes via the `search_icd` tool
- **Upstash Redis** — rate limiting **and** the auth/session/analytics store
- Deployable to **Vercel**

No other services: auth and analytics are first-party and run on the same
Upstash Redis, so the env vars below are still all you need.

## Pages & routes

| Route | What it is |
|---|---|
| `/` | Landing page: pitch, disclaimer, Log in / Create account / Continue as guest |
| `/chat` | The AI chat (requires an account session **or** a guest session; otherwise redirects to `/`) |
| `/login`, `/register` | Auth pages (client + server validation, clear errors) |
| `/legal/*` | Privacy Policy, Cookie Policy, Terms of Use, Medical Disclaimer — **placeholders needing legal review** |
| `/api/chat`, `/api/summary` | The AI server routes (unchanged) |
| `/api/auth/*` | `register`, `login`, `logout`, `guest`, `google` (+ `google/callback`) |
| `/api/chats` | Per-account chat history (GET/PUT, accounts only — guests are never stored) |
| `/api/analytics` | First-party, consent-gated event sink |

## How the chat works

1. The browser keeps the conversation in React state and POSTs the full
   history to `/api/chat`, which streams back plain text
   ([components/ChatApp.tsx](components/ChatApp.tsx) → [lib/streamChat.ts](lib/streamChat.ts)).
   Logged-in accounts additionally sync their conversations to a private
   per-account server-side history (`/api/chats` → [lib/chatStore.ts](lib/chatStore.ts),
   keyed by the session's user ID, size-capped and re-validated server-side);
   guest chats never touch the server and vanish when the tab closes.
2. The server route ([app/api/chat/route.ts](app/api/chat/route.ts)) rate
   limits, validates, then runs an agentic loop against Claude: stream text,
   execute any `search_icd` tool calls against the WHO API
   ([lib/icd.ts](lib/icd.ts)), feed results back, repeat until the model answers.
3. Helagi's persona ([lib/systemPrompt.ts](lib/systemPrompt.ts)) makes it ask
   follow-up questions in a strict format; [lib/parseQuestions.ts](lib/parseQuestions.ts)
   detects it and [components/QuestionCard.tsx](components/QuestionCard.tsx)
   renders clickable answer buttons.
4. The doctor-summary button posts the conversation to
   [app/api/summary/route.ts](app/api/summary/route.ts) and opens the result
   in a print view ([lib/printSummary.ts](lib/printSummary.ts)).

## Accounts, guests & sessions

All in [lib/auth.ts](lib/auth.ts); storage is the existing Upstash Redis
(in-memory fallback for local dev without Upstash — loud warning, never
deploy like that).

- **Accounts** are email + password only — no names, no medical data.
  Passwords are hashed with Node's built-in scrypt (per-user salt,
  constant-time compare); only the hash is stored. Every user gets a
  permanent `u_…` ID.
- **Sign in with Google** (optional): a dependency-free OAuth 2.0
  authorization-code flow in [lib/googleAuth.ts](lib/googleAuth.ts) +
  `app/api/auth/google/*`. Only the verified email is requested (`openid
  email` scopes); the account it creates is password-less and uses the same
  session system. The button appears once `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET` are set (see [.env.example](.env.example)). Signing
  in with Google on an email that already has a password account simply logs
  into that same account.
- **Sessions** are 32-byte random tokens stored server-side with a sliding
  30-day TTL (persistent login). The browser holds only the opaque token in
  an httpOnly cookie — no secrets ever reach client JS.
- **Guests** get a random anonymous `g_…` ID in an httpOnly cookie, so one
  visit is one session without an account.
- Login answers wrong-email and wrong-password identically, and the auth
  endpoints have their own stricter rate limit (5/min/IP) against credential
  stuffing.

## Cookie consent & analytics

- [components/CookieBanner.tsx](components/CookieBanner.tsx) shows on first
  visit: **Accept all / Reject optional cookies / Manage preferences**, with
  three categories (strictly necessary, analytics, performance & preferences).
  The choice is stored in the `helagi_consent` cookie for 6 months; the footer's
  **Cookie settings** link reopens the modal to change or withdraw consent.
- Analytics ([lib/analytics.ts](lib/analytics.ts) → [app/api/analytics/route.ts](app/api/analytics/route.ts))
  is first-party only and **double-gated**: the client checks consent before
  sending, and the server re-checks the consent cookie before storing.
  Rejecting optional cookies never blocks the AI.
- What's recorded (only after consent): daily event counters (page views,
  login/registration/guest events, chat opened, messages sent, summary used,
  errors), session durations, coarse browser/OS. Events are tied to a
  pseudonymous session ID — **never** emails, IPs, or conversation content;
  the server drops any long free-text prop as a backstop.
- Inspect it in Redis: `analytics:events:<YYYY-MM-DD>`, `analytics:device:<date>`,
  `analytics:duration:<date>`, `analytics:recent`, `analytics:recent_errors`
  (counters expire after ~90 days).

Cookies used: `helagi_session` (login), `helagi_guest` (guest ID),
`helagi_consent` (consent choice) — all documented on the Cookie Policy page.

## Cost & abuse protection

All knobs are constants at the top of their file:

| Protection | Value | Where |
|---|---|---|
| Burst limit per IP | 10 requests/min | `lib/rateLimit.ts` |
| Daily cap per IP | 50 requests/day | `lib/rateLimit.ts` |
| Auth attempts per IP | 5/min | `lib/rateLimit.ts` |
| Max response tokens | 2,500 per turn | `app/api/chat/route.ts` |
| Max message length | 4,000 chars | `app/api/chat/route.ts` (+ UI cap in `lib/constants.ts`) |
| Max conversation payload | 40,000 chars / 200 messages | `app/api/chat/route.ts` |
| History sent to model | last 24 messages | `app/api/chat/route.ts` |
| Tool-use loop cap | 4 turns | `app/api/chat/route.ts` |
| Cross-origin POSTs | rejected (403) | `lib/security.ts` (all API routes) |

If Upstash errors mid-request, the limiters **fail closed**. **Without
Upstash configured, rate limiting is disabled and auth falls back to process
memory** (the server logs loud warnings). Never deploy publicly in that state.

### Additional hardening

- **Security headers** on every response (`next.config.mjs`): same-origin CSP,
  `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS,
  minimal Permissions-Policy.
- **Model output is treated as untrusted**: chat replies render through
  `react-markdown` (no raw HTML); the printable summary escapes all HTML.
- **Error hygiene**: upstream error details (Anthropic, WHO, Redis) are logged
  server-side only; clients see generic messages.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

Open http://localhost:3000 (the terminal prints the actual port).

### Where each key comes from (all free tiers)

| Env var | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API Keys → Create Key |
| `WHO_ICD_CLIENT_ID` / `WHO_ICD_CLIENT_SECRET` | https://icd.who.int/icdapi → register (free) → API Access → View/manage keys. The secret is shown **once**. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | https://console.upstash.com → Create Database (Redis, free tier) → **REST API** section. |

> ⚠️ Never commit `.env.local` (already gitignored), never paste keys into
> chats/issues, and rotate any key that leaks.

## Testing checklist

1. **Landing** — visit `/` → homepage with disclaimer and the cookie banner
   (first visit). `/chat` without any session → redirected to `/`.
2. **Guest flow** — "Continue as guest" → chat opens; sidebar shows "Guest".
3. **Register/login** — create an account → chat opens with your email in the
   sidebar; log out → back to landing; log in again; wrong password → clear
   error. 6 auth attempts in a minute → 429.
4. **Cookie consent** — reject optional cookies → chat still fully works and
   `/api/analytics` stores nothing; accept all → events appear in Redis;
   footer "Cookie settings" reopens the preferences.
5. **Chat + streaming** — send a message; the answer streams with a typing
   indicator.
6. **Triage flow** — "My knee is swollen." → clickable Yes/No question buttons.
7. **ICD grounding** — "What is the ICD-11 code for migraine?" → a real code.
8. **Doctor summary** — after a triage exchange → structured print view.
9. **Input cap / rate limit** — >4,000 chars rejected; 11 messages in a
   minute → friendly 429 message.

## Deploy to Vercel

1. Push this folder to a GitHub repo and import it in Vercel (standard
   root-level Next.js app — no special settings).
2. Add all five env vars in **Project → Settings → Environment Variables**
   (Production + Preview).
3. Deploy, then re-run the testing checklist against the live URL.

### Manual steps you must do yourself

- Anthropic account/key + a monthly spend limit (console → Billing).
- WHO ICD API registration (client ID/secret).
- Upstash account + Redis DB (REST credentials).
- **Legal review**: the pages under `/legal` are drafts with `[BRACKETED]`
  gaps — a lawyer must review them (and the consent/analytics setup) before
  public launch.

## Project structure

```
app/
  layout.tsx               Fonts, metadata, global CookieBanner + AnalyticsListener
  page.tsx                 Landing page (hero, disclaimer, get-started, footer)
  globals.css              Tailwind entry + background/scrollbar/legal-prose styles
  chat/page.tsx            Server wrapper: resolve identity → render ChatApp
  login/page.tsx           Login page          register/page.tsx  Registration page
  legal/                   layout + privacy / cookies / terms / medical-disclaimer
  api/
    chat/route.ts          Server route: rate limit → validate → Claude + tools
    summary/route.ts       Server route: conversation → printable summary doc
    auth/                  register / login / logout / guest routes
    analytics/route.ts     Consent-gated first-party event sink (Redis counters)

components/
  ChatApp.tsx              The chat application (previously app/page.tsx)
  Sidebar.tsx              Conversation history + account block + Log out
  ChatMessage.tsx          One bubble; markdown for assistant replies
  QuestionCard.tsx         Clickable Yes/No questionnaire inside a reply
  ChatInput.tsx            Auto-growing composer + disclaimer
  DoctorSummaryButton.tsx  Fetches /api/summary and opens the print view
  EmptyState.tsx           Chat landing view: how-it-works + example prompts
  AuthForm.tsx             Shared login/register form with validation
  GuestButton.tsx          "Continue as guest" (creates anonymous session)
  CookieBanner.tsx         Consent banner + preferences modal
  AnalyticsListener.tsx    page_view + session-duration beacons (consent-gated)
  Footer.tsx               Legal links + Cookie settings
  TypingIndicator.tsx      Animated "thinking" dots
  Logo.tsx                 Helagi mark + wordmark (inline SVG)

lib/
  systemPrompt.ts          Helagi triage persona (the AI's "brain")
  icd.ts                   WHO ICD-11 client (OAuth + search, server-only)
  auth.ts                  Users, sessions, guest IDs (Redis; scrypt hashing)
  validation.ts            Shared email/password validation (client + server)
  consent.ts               Consent cookie model (read/write, events)
  analytics.ts             Client track() — consent-gated event beacons
  rateLimit.ts             Upstash per-IP limits: chat, daily, auth
  security.ts              Same-origin check for the API routes
  streamChat.ts            Browser → /api/chat stream reader
  parseQuestions.ts        Detects the questionnaire format in replies
  printSummary.ts          Builds the printable summary HTML + print dialog
  constants.ts             UI limits, example prompts, disclaimer
  types.ts                 Shared Message/Conversation types
```
