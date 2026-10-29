## Summary

Implements the complete Careers experience matching the user design references:

1. **Homepage Careers Cutout Section (`CareersCutout`)**:
   - Matches the monumental aesthetic of the Works Cutout section (`Screenshot 2026-10-29 135442.png`).
   - Monumental 2-line Circular XX typography: **Explore / Careers.** with signature Brand Red (`#ea002a`) period accent.
   - Primary action pill: **`View Positions ->`** (`href="/careers"`) with 52px height and WCAG AA contrast.
   - Secondary ghost button: **`Kerala Studios ->`** (`href="/#locations"`).

2. **Careers Hub Listing Page (`/careers`)**:
   - Matches `Screenshot 2026-10-29 134506.png` and `134518.png`.
   - **Swiss Hairline / Thin Typography**: Uses `Helvetica Neue Thin` (weight 100/200, `$font-helvetica`) for the hero headline: *"We’re always on the lookout for talented people to join our team."*
   - Authentic studio collaborative workspace banner.
   - Editorial job listings table with hairline dividers, metadata tags, and underlined **`Apply Now`** action.

3. **Position Detail & Candidate Application Page (`/careers/[slug]`)**:
   - Matches `Screenshot 2026-10-29 135637.png` and `135645.png`.
   - Swiss Thin role title, location/workplace tags, role overview, *"On any given day you might"*, and *"What we value"*.
   - **Swiss Minimalist Application Form**:
     - Underline inputs for Full Name, Email, Phone, LinkedIn, Portfolio.
     - Custom resume/CV file attachment trigger (**Attach** + accepted formats: doc, docx, rtf, pdf under 12 MB).
     - Honeypot bot protection (`_hp_careers_confirm`) & IP rate limiting.

4. **Sanity Studio Integration & Live Ingest Engine**:
   - Document schema `careerPosting` for managing open roles in Sanity Studio.
   - Document schema `careerApplication` for storing candidate submissions and resume file assets.
   - Registered both schemas in `sanity.config.ts`.
   - Multipart API route `/api/submit-application` streaming uploaded files to Sanity Assets and creating application documents.
   - Fallback dataset with 3 authentic initial openings (*Brand & Account Manager*, *Senior Copywriter & Strategist*, *Senior UI/UX Designer*).

## Verification
- `npx tsx --test tests/client/client_160over90_platform.test.ts`: **60/60 PASS** (100% pass rate).
- `npm run test:boundaries`: **48/48 PASS** (100% Server Action boundary compliance).
- `npx tsc --noEmit`: **0 errors** (Zero TypeScript compilation errors).
