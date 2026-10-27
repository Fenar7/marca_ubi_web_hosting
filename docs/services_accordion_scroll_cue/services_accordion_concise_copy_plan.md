# Architectural Plan: Services Accordion Concise Description Refinement

> **Document Location**: `docs/services_accordion_scroll_cue/services_accordion_concise_copy_plan.md`  
> **Status**: **AWAITING USER CONFIRMATION TO EXECUTE ("proceed")**  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Branch**: `refactor/kinetic-stage-scatter-and-operational-rail-removal`  
> **Target PR**: PR #87 (strictly **OPEN**)

---

## 1. Executive Summary & Problem Diagnosis

### Client Directive (`Screenshot 2026-10-27 173948.png`):
> *"ok so hte htoehr thing is there is lie desicxionrt text for each of these comsosenets right we have to redue he lenghto f it and jsut keep it short and simple"*

### Analysis:
In [`src/app/components/Sections/ServicesAccordion/types.ts`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ServicesAccordion/types.ts), each of the 16 service cards (`B2B_SERVICES` and `B2C_SERVICES`) contains a long paragraph (60–85 words, 4–5 sentences) in its `desc` field. On card hover (`.hoverOverlay`), this lengthy text causes vertical scrolling inside the narrow card on smaller screens, obscuring the layout.

The client directed to reduce the length and keep it **short and simple** (1–2 punchy, editorial sentences, ~18–25 words per card).

---

## 2. Proposed Concise Copy Matrix

### A. B2B Enterprise Services (8 Items)

| ID | Title | Current Length | Proposed Short & Simple Copy (~18–24 words) |
|---|---|---|---|
| `b2b-demand-generation` | Demand Generation | 64 words | Targeted multi-channel campaigns, paid media, and SEO that build market trust and convert brand awareness into high-value enterprise pipeline. |
| `b2b-integrated-marketing` | Integrated Marketing | 50 words | Unifying digital, social, and brand communications into a cohesive strategy that delivers consistent customer experiences and accelerates growth. |
| `b2b-corporate-communications` | Corporate Communications | 51 words | Strategic internal and external messaging frameworks that strengthen executive credibility, corporate reputation, and stakeholder alignment. |
| `b2b-social-influencer` | Social & Influencer Marketing | 44 words | Purposeful B2B storytelling and credible creator collaborations that expand industry reach and cultivate meaningful audience engagement. |
| `b2b-content-scale` | Content & Scale | 52 words | High-impact editorial content engines and targeted distribution frameworks that elevate brand authority and scale digital visibility. |
| `b2b-public-relations` | Public Relations (PR) | 49 words | Strategic media relations, executive positioning, and narrative placement that secure earned trust and authoritative industry presence. |
| `b2b-customer-marketing` | Customer Marketing | 64 words | Retention programs, advocacy initiatives, and personalized customer touchpoints designed to expand lifetime value and build long-term loyalty. |
| `b2b-abm` | Account-Based Marketing (ABM) | 52 words | Bespoke research, tailored content, and hyper-targeted outreach engineered to engage key decision-makers across high-priority enterprise accounts. |

---

### B. B2C Consumer Services (8 Items)

| ID | Title | Current Length | Proposed Short & Simple Copy (~18–24 words) |
|---|---|---|---|
| `b2c-integrated-creativity` | Integrated Creativity | 53 words | Fusing bold design, strategic narrative, and digital experiences across touchpoints to make consumer brands culturally relevant and memorable. |
| `b2c-social-influencer` | Social & Influencer | 58 words | Platform-native campaigns and authentic creator partnerships that spark cultural conversations, inspire discovery, and turn followers into advocates. |
| `b2c-digital-performance` | Digital Performance | 53 words | Data-driven paid acquisition, search optimization, and conversion analytics engineered to maximize consumer reach and efficiency. |
| `b2c-sports-marketing` | Sports Marketing | 51 words | High-visibility athlete partnerships, sponsorships, and experiential moments that connect brands authentically with passionate fan communities. |
| `b2c-crm-loyalty` | CRM & Loyalty | 53 words | Tailored lifecycle marketing, automated retention journeys, and rewarding loyalty programs that turn one-time shoppers into lifelong customers. |
| `b2c-public-relations` | Public Relations (PR) | 51 words | High-profile press outreach and cultural storytelling that earn consumer credibility, secure premier media coverage, and build brand fame. |
| `b2c-live-experiences` | Live Experiences | 50 words | Immersive activations, spatial pop-ups, and premier product launches that create unforgettable real-world connections between brands and people. |
| `b2c-retail-activation` | Retail Activation | 51 words | Dynamic in-store displays, merchandising, and experiential activations designed to captivate shoppers and drive point-of-sale conversion. |

---

## 3. Engineering & Delivery Verification

1. **File to Update**: [`src/app/components/Sections/ServicesAccordion/types.ts`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ServicesAccordion/types.ts)
2. **Automated Verification**: Run `node --import tsx --test tests/client/client_160over90_platform.test.ts` to confirm 37/37 passing.
3. **Commit & PR**: Commit with author `Fenar7 <86710532+Fenar7@users.noreply.github.com>`, push, and update PR #87 description.
