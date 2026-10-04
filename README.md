This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Backend and logins

The web app holds no secrets. Everything that needs a paid key runs on the
**SermonFlow backend** (`sermon-flow-backend`, its own repo) on the ChristChurch
Server at **https://sermon-flow.63-35-64-133.sslip.io**:

| What | Backend endpoint | Called from |
| --- | --- | --- |
| Live transcription (Deepgram nova-3) | `WS /api/v1/transcribe` | `lib/deepgramService.ts` |
| AI scripture detection (OpenAI) | `POST /api/v1/scripture/detect` | `hooks/useGPTScriptureDetection.ts` |
| NKJV / NIV / NLT text (API.Bible) | `GET /api/v1/verses/passage` | `lib/verseLookup.ts` |

Public-domain translations (KJV, WEB, ASV) are still fetched from bible-api.com
directly. All backend calls go through `lib/api.ts`, which attaches the user's
access token.

**Logins are AWS Cognito** — user pool `sermon-flow` (`eu-west-1_sgPMhuE0p`) in the
carrycome AWS account, app client `sermon-flow-web`. The IDs are public and have
defaults in `lib/auth/config.ts`; `.env.local` only needs them to point elsewhere:

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_SERMONFLOW_API_URL` | `https://sermon-flow.63-35-64-133.sslip.io` |
| `NEXT_PUBLIC_COGNITO_REGION` | `eu-west-1` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `eu-west-1_sgPMhuE0p` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `4lm8prl7f3oq3l07sadidgf4hl` |

How the session works:

- Sign-up, login, confirmation and password reset run as server actions
  (`app/auth/actions.ts`) that call Cognito and store the tokens in **httpOnly
  cookies** (`sf_id`, `sf_access`, `sf_refresh`) — page scripts never see them.
- **Pilot: no sign-up code.** A Cognito pre sign-up trigger (Lambda
  `sermon-flow-cognito-presignup`, carrycome account) confirms every new account
  immediately, so registering signs straight in and no email is sent. The form's
  code step is still in place for when this is turned off (backend README,
  "Logins"). Password reset still emails a 6-digit code.
- `proxy.ts` verifies the ID token on every gated request and, when it has
  expired, mints new tokens from the 30-day refresh token.
- The page gets the short-lived access token for backend calls from
  `GET /auth/token`.

Cognito's built-in email sender is capped at 50 emails a day — move it to SES
before real sign-ups arrive. To make a test account without email, see the
`aws cognito-idp admin-create-user` commands in the backend README.

## Routes and auth

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | public | Landing page |
| `/login`, `/register` | public | Auth (signed-in visitors are bounced to `/admin`) |
| `/auth/token` | signed in | The access token for backend calls |
| `/admin` | **signed in** | Account Home — start a session, usage, past sessions |
| `/admin/session` | **signed in** | The live room: mic, transcript, verse detection |

The gate lives in two places on purpose: `proxy.ts` redirects to `/login?next=<path>`
so you land back where you were headed, and `app/admin/layout.tsx` repeats the check
because middleware can be bypassed and the live room is a client component that can't
check for itself.

Sessions aren't persisted yet (no database, no local storage), so Account Home's
past-session list and usage figures are stubbed. Both are marked `TODO` in
`lib/plan.ts` and `app/admin/page.tsx`, and the UI says usage isn't being tracked
rather than implying the zeros are real.

## Design system

One system across every surface — the marketing site (`/`, `/login`, `/register`) and
the dashboard (`/admin`): a warm parchment canvas, evergreen primary, amber accent and
a brick-red danger tone, with Fraunces for display type and Manrope for body text.

- Tokens live in the `@theme` block at the top of `app/globals.css`.
- Element defaults are in `@layer base`; reusable type classes (`.font-display`,
  `.eyebrow`, `.tabular`) are in `@layer components`. That ordering means Tailwind
  utilities always win, so recolouring a heading never needs `!important`.
- Shared primitives and the icon set live in `components/ui/`.
- Surfaces opt in by putting the `.parchment` class on their root element.

The app is light-only; `color-scheme: light` is pinned on `html` so native controls
don't follow the OS theme.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
