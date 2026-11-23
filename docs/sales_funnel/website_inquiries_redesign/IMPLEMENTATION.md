# Website Inquiries implementation

The inquiry inbox represents individual accepted interactions. CRM leads represent ongoing relationships and retain the existing dossier and pipeline workflows. A staff member can record an inquiry for later review, link an authorized exact match, or create a lead for a distinct opportunity. Each decision records inquiry history.

## Verification environments

- Source tests and browser fixtures use fictional contacts. Simulated writes exercise UI states and have no network path to a deployed CRM.
- Database tests use a dedicated loopback PostgreSQL instance and synthetic identities. Results establish a database contract under the fixture's roles and policies. A deployed Supabase project still needs smoke verification against its real auth, migration history, and notification configuration.
- Application and migration changes must be reviewed together. An app preview without the migration cannot read or capture inquiries.

## Rollout and rollback

1. Verify the staging migration baseline and service-role configuration. The public intake process requires a server-side Supabase service-role client. Configure a staging notification sink before public or authenticated smoke tests.
2. Apply the additive inquiry migration before the application cutover. Confirm that the new functions and row visibility behave as intended under anonymous, staff and server roles.
3. Deploy the application and submit isolated Contact, Start Project and Chat Pod requests. Save a manual inquiry, link it to a lead, and verify the counts and audit history. Compare durable receipts against committed rows. Historical coverage starts where provenance can be verified. Compare the queue to legacy records only with that limitation in view.
4. During rollback, retain accepted inquiry rows and history. Revert application code only after determining how intake accepted by the prior writer will be reconciled. Keep the additive migration in place until that reconciliation is complete. A destructive down migration would discard accepted submissions.

The production database is outside the PR update. Apply migrations through the existing human-controlled release workflow.
