# Public service interest and short-brief contract

Implemented contract, 4 November 2026. This records the M0 decisions authorised by the implementation request, without changing the existing full-form pipeline.

## Representation

The short brief collects public service IDs in `serviceInterest`, scope in `projectDescription`, name, and one reply channel. Timing is optional. `undecided` is an explicit, exclusive alternative to named services. A carried service is displayed for confirmation; existing draft choices take precedence.

Categories and deliverables from the existing design form are optional enrichment. Their canonical strings are unchanged. Choosing a public service never fabricates a legacy deliverable. Company and project title are separate optional fields.

## Routing

Every named public service routes to the existing `Full-Suite Advisory` CRM enum. This is an explicit discovery queue for strategic marketing/creative enquiries, not a claim that each enquiry commissions every service. The precise public service IDs, labels, and routing rationale remain in `brief_payload.chatPod.serviceInterests` and human-readable notes. There is no silent `Other` fallback.

| Public ID | Audience | Discovery rationale |
|---|---|---|
| demand-generation | B2B | Paid acquisition and pipeline scope |
| integrated-marketing | B2B | Coordinated marketing programme |
| corporate-communications | B2B | Corporate messaging and communications |
| social-influencer-marketing | B2B | Social strategy beyond legacy design deliverables |
| content-and-scale | B2B | Content operations and capacity |
| public-relations-pr | B2B | Business communications |
| customer-marketing | B2B | Customer lifecycle programme |
| account-based-marketing | B2B | Sales and marketing account programme |
| integrated-creativity | B2C | Brand, campaign, and production scope |
| social-influencer | B2C | Consumer channels and creator programme |
| digital-performance | B2C | Acquisition and measurement |
| sports-marketing | B2C | Partnerships and activation |
| crm-and-loyalty | B2C | Lifecycle and platform scope |
| public-relations | B2C | Consumer communications |
| live-experiences | B2C | Experience and operational scope |
| retail-activation | B2C | Retail channel and activation |
| undecided | Unspecified | Scope discovery before delivery assignment |

`intake/serviceInterest.ts` is the executable policy. Its coverage test compares the policy IDs with every published accordion service; additions cannot silently escape the mapping.

## Payload and compatibility

The existing ingestion endpoint, schema, rate limits, honeypot, and deduplication path remain unchanged. No database migration or additional endpoint is introduced.

For the new brief, `brief_payload.chatPod.version` is 2. The envelope records service interests and rationales, company, project name, and timing. Existing fields retain scope and optional design deliverables. `company` at the top level receives only the real company field. A project title never becomes a company. Timing remains labelled in the brief rather than being presented as a monetary `budget_bracket`. Exact deliverable arrays are preserved even when a canonical label contains commas.

The shared `/start-project` builder is unchanged. Calling the pod adapter with a legacy record that has no service interest preserves the historical full-form mapping. A restored old draft retains its previous answers but must answer or confirm the new required short-brief questions before sending; no public interest is inferred from an unrelated design item.

Draft storage remains v1 because its string/list slot map is additive and readable. Missing new keys are initialised by the reducer. Restored values are revalidated before review/submission. No normalised text replaces a raw field answer, and no transcript is sent to the server.

## State invariants

- Email suppresses the redundant phone question; declining email requires a number.
- Review is available once required values validate, before timing and optional enrichment.
- Completing or skipping timing opens review automatically.
- Add details explicitly enters the optional tail. Review now leaves it without losing answers.
- Editing the only email to blank asks for a replacement phone before returning to review.
- In-flight submission refuses exit/reset/re-entrant send. Stale success/failure callbacks outside submission are ignored.
- Failed transport retries reuse the intent key; this remains a client-side guarantee, not an unsupported server-idempotency claim.
