# Phase 13: Start a Project — Dedicated Light Intake Page

## Scope

Replaced the homepage "Start a Project" popup wizard with a dedicated page at
`/start-project`, rendered on the light editorial canvas with a 35vh cinematic
hero band carrying the studio's main film.

## Architecture

| Concern | Decision |
| --- | --- |
| Route | `src/app/start-project/page.tsx` — server component, static metadata, canonical `/start-project` |
| Hero band | `src/app/start-project/StartProjectHero.tsx` — client island, `video-web.mp4` muted loop at 35vh, `data-header-theme="dark"` so the fixed header rides the video legibly |
| Video failovers | `prefers-reduced-motion` and autoplay/decode failure both fall back to the static dark canvas; zero-jump reveal via `onPlaying` crossfade (ServicesAccordion pattern) |
| Wizard | `ProjectForm` + steps unchanged structurally; `ProjectForm.module.scss` and `steps/Step.module.scss` re-themed dark → light editorial (white canvas, `rgba(0,0,0,0.08)` hairlines, `$client-accent-red` #ea002a only, zero glows/shadows, red-tinted selected states) |
| Step transitions | Wizard scrolls its own header back into view on step change (`scrollIntoView` in `ProjectForm.tsx`), replacing the modal's internal scroll container |
| Popup retirement | `ProjectBriefModal/` deleted; `WorksCutout` / `ConnectCutout` lost their `onOpenBrief` prop and render `Link href="/start-project"` unconditionally; `ClientHomeExperience` no longer owns brief-modal state |
| Submit pipeline | Untouched: `POST /api/sales-funnel/ingest` with idempotency key, retries, honeypot, rate limiting |

## Integrity

- Zero `#ff6100` legacy orange on the page (verified computed styles).
- 0 TypeScript errors (`tsc --noEmit`).
- E2E journey 2 already navigates `/start-project` directly — unaffected by the modal removal.

## Evidence

- `evidence-top.png` — hero band with playing film, light step 1
- `evidence-step2.png` — step 2 business form on white canvas
