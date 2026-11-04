# Local assistant delivery and independent review

Implementation branch: `remediation/chat-pod-local-assistant`.
Base: `remediation/turbopack-compaction-dev-server` at `fe41027`.
Date: 4 November 2026.

The owner authorised implementation of plan 25, a separate branch, an open PR, and independent audit/fix cycles. Antislop applies throughout. Design Read: ENERGY 1 / RHYTHM 2 / MOTION 1. The existing public white/red palette takes precedence over older CRM defaults.

## Implemented behaviour

Services questions answer immediately, including the reported request wrappers and bounded abbreviations. Capability enquiries answer without entering intake. The catalogue separates the two audiences and preserves exact service IDs. Negation and multiple topics receive focused clarification. Exact informational answers remain available after repeated misses; lexical thresholds remain unchanged.

Selection values have visible markers and toggle semantics. Continue, Back, Review brief and Send brief occupy a separate action area. Long choices retain their active question. Questions during intake preserve draft values and selections, with an explicit return action. Ambiguous name/project answers can be confirmed verbatim.

The short brief collects interest, scope, name and a reply channel. Timing is optional; enrichment is explicit. See [the service contract](./service-interest-contract.md) for all 16 discovery-routing decisions, compatible drafts, and separation of company, project title and timing. No new conversational API, runtime dependency, migration or transcript telemetry is introduced.

## Verification at initial review checkpoint

- Full unit suite: 1,357 passed before the additional contrast assertion and final UI lint corrections; final rerun pending.
- Scoped pod TypeScript passed. Final whole-project check pending.
- UI ESLint passed with zero errors after correcting four controller hook findings.
- Live browser checks confirmed the reported services wording and principal width/touch behaviours. The first integrated run found a short-height layout issue (fixed) and an outdated accessible-name selector (fixed). A host memory failure interrupted that run; it is not recorded as a product pass.
- Independent CTO review found exact `back`, `contact`, and `review` commands could be filed as text answers. Whole-message intake routing now handles them before field matching, preserves the raw command in the transcript, and leaves longer titles verbatim. The service-carryover browser journey now uses the contextual `Discuss this service` action that supplies the stable ID.
- Full unit suite after these fixes: 1,364 passed. Focused command/short-brief browser journey: passed against the main-folder preview on port 3003. Contrast suite: 14 passed. Updated whole-project TypeScript, lint, boundary, complete browser, build and independent re-review remain pending.
- The latest browser suite was interrupted when its isolated port 3004 server was stopped at the owner's request. Seven initial geometry tests passed; the remaining suite was not completed. This is not recorded as a full browser pass.

The installed Next 16.1.6 package does not contain `next/dist/docs`; relevant official Next guidance was consulted as fallback. Browser checks use isolated port 3004 because the user's existing port 3003 must remain untouched. Submitted test briefs are intercepted locally.

## Independent review cycles

First independent logic review findings were corrected and re-tested; independent re-review is pending. A separate UI reviewer found no blocking UI defects; physical-device and screen-reader evidence remains unavailable. Continue audit/fix loops before considering release evidence complete.

## Four-block delivery gate

1. **Hard Gate — pending:** final unit/types/lint/build/boundary/browser evidence.
2. **Purpose-Gate — pending:** integrated supported journeys and failure recovery.
3. **Liveliness — pending:** recorded R-35 browse/select/continue/back/detour/resume/review/send/retry/contact/overlay checks.
4. **Craftsmanship / Quality Locks — pending:** independent review closure, contrast/mobile/focus/scroll checks. Physical iOS/Android keyboard checks and observed intended-visitor studies are unavailable in this environment; emulation must not be described as that evidence.
