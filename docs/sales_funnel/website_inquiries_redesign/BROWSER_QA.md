# Inquiry inbox browser evidence

The loopback harness renders the production inquiry inbox components and styles with fictional records. Writes return a simulated rejection, which keeps the draft available and exercises the retry path without touching Supabase or sending a notification.

| Journey | Chromium evidence |
| --- | --- |
| Scoped queue | Website and Manual scopes show their corresponding rows. Search updates the URL and Clear filters restores the queue. |
| Detail | Opening a row focuses the detail heading and shows a structured brief and recent history. Closing returns to the queue. |
| Manual entry | The native dialog returns focus on Escape. A rejected save preserves the form and reuses its idempotency key. Choosing a matching lead is explicit. |
| Triage and permissions | The update sends an exact timestamp with microsecond precision and a closure reason. Viewers see read controls only. Operators without Leads access can triage but cannot link or create a lead from the inbox. |
| Availability | Empty and failed reads have distinct states. One unavailable count does not suppress other metrics. |
| Responsive and accessible | No page overflow at 320, 375, 768, 1024, 1440 or 1920 CSS pixels. No serious or critical axe findings and no browser runtime errors. |

[Desktop inbox](./screenshots/inquiries-desktop.png) · [Inquiry detail](./screenshots/inquiries-detail.png) · [Manual entry](./screenshots/inquiries-add.png) · [Mobile](./screenshots/inquiries-mobile.png) · [Browser results](./browser-results.json)

From the repository root, start `node docs/sales_funnel/website_inquiries_redesign/visual-harness.cjs`, then run `node docs/sales_funnel/website_inquiries_redesign/verify-browser.cjs` in a second terminal. The harness binds to `127.0.0.1:3027`. The browser run does not verify production credentials, real writes, or database policies.
