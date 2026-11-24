# Inquiries rollout

The inbox displays persisted Supabase inquiries in a compact list. Open a row for its brief, contact, assignment, status, linked lead and activity. Returning to the inbox restores the filters. Legacy inquiry query links redirect to the record route.

The hosted database was checked for the inquiry schema and batch `inquiries-redesign-20261124`. The batch contains 12 records, with six assigned and four linked. Test records use the same inbox and detail pages, carry a Test label and are excluded from summary counts. Fixture installation uses `supabase/seed_inquiry_review.sql` after the inquiry migrations. Test links are restricted to test leads.

Existing inbox errors remain visible and retryable. Record access and management continue to use the signed-in Supabase session and database permissions.

Test inquiries support triage and assignment. Lead resolution is disabled for test inquiries because the live matching workflow excludes synthetic leads. Existing fixture links remain visible to authorized users.

The isolated Playwright run passed all ten checks. It exercises the inbox and detail management client with simulated writes. The fixture shell supplies static brief and activity content, so this run does not verify the signed-in Next.js routes or hosted Supabase writes.

Repository-wide TypeScript and Inquiries ESLint checks passed. A separate hosted database check used an authenticated administrator role in a rollback-only transaction. It read all 12 test inquiries, changed one unlinked test inquiry to Reviewed, assigned its owner, and read back the saved state, owner, and audit event. The original revision was confirmed after rollback. This verifies the database permissions and write path independently of browser authentication.
