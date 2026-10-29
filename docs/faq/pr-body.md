# Pull Request: Frequently Asked Questions Curtain & Sanity Studio Engine

## Summary
Implements the Homepage FAQ Section matching the user reference (`faq_reference.png`) with Swiss Hairline Thin typography and live Sanity CMS integration:

1. **`FaqCurtain` Section Component (`src/app/components/Sections/FaqCurtain.tsx`)**:
   - Pure white solid curtain container (`id="faq"`, `data-header-theme="light"`).
   - Swiss Hairline Thin typography using `$font-helvetica` (`Helvetica Neue Thin`, weight 100/200) for the section headline:
     **"All your questions. Here."** with signature Brand Red (`#ea002a`) period accents.
   - Fine 1px bottom border dividers (`rgba(0, 0, 0, 0.15)`) matching the reference layout.
   - Smooth accordion expand/collapse disclosure powered by modern CSS Grid (`grid-template-rows: 0fr -> 1fr`).
   - Rotating chevron indicator and full WAI-ARIA compliance (`aria-expanded`, `aria-controls`, `role="region"`).

2. **5 Authentic Marca Ubi Model FAQs (`src/sanity/lib/faq-queries.ts`)**:
   - Pre-seeded with 5 comprehensive agency questions covering Marca Ubi's brand engineering philosophy, engagement cadence, startup vs. enterprise eligibility, Kerala studio coordinates & global timezones, and 100% intellectual property transfer terms.
   - Exported GROQ query `faqsQuery` and query helper `getFaqs()` with zero-downtime static fallback.

3. **Sanity Studio Integration (`src/sanity/schemas/faqItem.ts` & `sanity.config.ts`)**:
   - Registered `faqItem` document schema in Sanity Studio for publishing, ordering, and managing FAQs.

4. **Homepage Integration (`src/app/page.tsx` & `ClientHomeExperience.tsx`)**:
   - Concurrently streams `faqsQuery` alongside works and posts.
   - Seamlessly mounted in `ClientHomeExperience` maintaining the 160over90 alternating stream.

5. **Monumental Footer Brand Discipline Lines (`src/app/components/Sections/MonumentalFooter.tsx`)**:
   - Replaced single static company statement with 4 clear brand discipline statements:
     - `Marca Ubi - Brand Engineering`
     - `Marca Ubi - Creatives`
     - `Marca Ubi - Experience Design`
     - `Marca Ubi - Brand Transformation`
