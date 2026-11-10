# Dashboard and navigation redesign handoff

Branch: `redesign/dashboard-action-workspace`, based on `fix/auth-runtime-diagnostics-and-resilience` at `1ea59ba`. The user explicitly authorized implementation, verification and PR creation. Never merge.

See `../sales_funnel/dashboard_redesign_2026_11/DELIVERY_REPORT.md` and `QA_EVIDENCE.md` for current evidence and limitations. Full plan is in the same task directory. Auth PR #117 remains a dependency; do not fold unrelated auth changes into this review.

Implemented queue-first home, unboxed pipeline context, local Outcomes reporting, financial database/DTO filtering, UTC consistent queues, null/error states, new sidebar/launcher/account flow, public font pairing, loading/error boundaries and mobile photo-dialog focus/portal correction.

Tests: 1,312/1,312 pass; typecheck and server-action boundaries pass. Browser actual-component fixtures25/25 pass, no serious/critical axe violations. Authenticated database, upload/logout mutation and actual zoom verification remain unperformed without isolated credentials. Keep PR draft rather than asserting approval-ready. Existing unrelated `scratch/` remains untracked and untouched.

Current screenshots, repeatable harness and engineering logs live with the task. Implementation commit: `d2ca3fe`. Draft PR #118: https://github.com/Fenar7/marca_ubi_web_hosting/pull/118, targets `fix/auth-runtime-diagnostics-and-resilience`. Remains OPEN for manual review. Public-site styles and authentication middleware/proxy remain unchanged.
