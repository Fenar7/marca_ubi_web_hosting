# Master Architectural Plan: Project Brief Questionnaire Flow Restoration & Dark Luxury Aesthetic Elevation

> **Task ID**: `TASK-CLIENT-FORM-RESTORATION-001`  
> **Status**: READY FOR USER REVIEW  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Audited Baseline**: Commit `ebff860` (Authentic multi-step questionnaire flow and complete category taxonomy)  
> **Target Alignment**: Commit `HEAD` (`master`), `DESIGN.md`, `master-ui-ux-design-system`, `antislop-ui`

---

## 1. Executive Summary & Root Cause Analysis

In commit `13619db` (*"Overhaul brief form with authentic agency disciplines and isolate modal scroll"*), an effort to purge generic AI copy inadvertently went too far: it stripped out the **entire catalog of 8 categories and 52 granular sub-services**, replacing them with 4 generic agency pillars. Furthermore, multiple critical client intake dimensions across Steps 2, 3, and 4 (Instagram handle, Industry selection, Agency partnership status, Referral tracking, 6 granular timeline milestones, Inspiration URL repeater, Portfolio showcase permission, and Extra notes) were removed.

The user explicitly clarified:
> *"btw man now what happened with the form i need the old form flow evyething otins etc but i inly otld you to tweak the diesng man pelae hire the team of expoert agents na ully anzye nad reahc and give meth efully diteld plan"*

### Core Objective
Restore **100% of the authentic 4-step questionnaire flow, all 8 categories, 52 sub-services, and all form options** from `ebff860`, while **elevating ONLY the visual aesthetic** according to Marca Ubi's Swiss dark luxury design tokens (`#ea002a` brand red, `#0c0c0c` obsidian canvas, Swiss 2px/4px border radii, Circular XX typography, tabular figures, and verified scroll isolation).

---

## 2. Complete Inventory of Restored Questionnaire Flow & Options

### Step 1: "What do you need designed?" (`Step1Services.tsx`)

#### 8 Categories:
1. `Logo & identity`
2. `Web & app design`
3. `Business & advertising`
4. `Clothing & merchandise`
5. `Art & illustration`
6. `Packaging & label`
7. `Book & magazine`
8. `Other`

#### 52 Sub-Services & `@sanity/icons` Mappings:
| Category | Sub-Service Name | `@sanity/icons` Symbol |
| :--- | :--- | :--- |
| **Logo & identity** | Logo design | `<SparkleIcon />` |
| | Logo & brand identity pack | `<StarIcon />` |
| | Logo & social media pack | `<HeartIcon />` |
| | Logo & hosted website | `<EarthGlobeIcon />` |
| | Logo & business card | `<UserIcon />` |
| | Brand guide | `<BookIcon />` |
| | Business card | `<UserIcon />` |
| | Stationery | `<DocumentIcon />` |
| | Logo & brand guide | `<BookIcon />` |
| | Logo & product packaging | `<PackageIcon />` |
| **Web & app design** | Web page design | `<DesktopIcon />` |
| | WordPress theme design | `<DashboardIcon />` |
| | Landing page design | `<DesktopIcon />` |
| | Icon or button | `<ComponentIcon />` |
| | App design | `<MobileDeviceIcon />` |
| | Facebook cover | `<ImagesIcon />` |
| | Social media page | `<ImagesIcon />` |
| | Banner ad | `<ImageIcon />` |
| | Other web or app design | `<DesktopIcon />` |
| **Business & advertising** | Postcard, flyer or print | `<EnvelopeIcon />` |
| | Poster | `<DocumentsIcon />` |
| | Infographic | `<ControlsIcon />` |
| | Brochure | `<BookIcon />` |
| | Car, truck or van wrap | `<ColorWheelIcon />` |
| | Signage | `<BlockElementIcon />` |
| | Email | `<EnvelopeIcon />` |
| | PowerPoint template | `<DesktopIcon />` |
| | Menu | `<TextIcon />` |
| | Other business or advertising | `<BulbOutlineIcon />` |
| | Album Cover | `<ImagesIcon />` |
| | Podcast | `<PlayIcon />` |
| **Clothing & merchandise** | T-shirt | `<TagIcon />` |
| | Clothing or apparel | `<TagIcon />` |
| | Merchandise | `<PackageIcon />` |
| | Cup or mug | `<StarIcon />` |
| | Sticker | `<SparkleIcon />` |
| | Other clothing or merchandise | `<TagIcon />` |
| **Art & illustration** | Illustration or graphics | `<EditIcon />` |
| | Card or invitation | `<EnvelopeIcon />` |
| | Character or mascot | `<UserIcon />` |
| | Tattoo | `<EditIcon />` |
| | 3D | `<BlockElementIcon />` |
| | Other art or illustration | `<EditIcon />` |
| **Packaging & label** | Product packaging | `<PackageIcon />` |
| | Product label | `<TagIcon />` |
| | Other packaging or label | `<PackageIcon />` |
| **Book & magazine** | Book cover | `<BookIcon />` |
| | Magazine cover | `<ImagesIcon />` |
| | Typesetting | `<TextIcon />` |
| | Typesetting with imagery | `<ImagesIcon />` |
| | Other book or magazine | `<BookIcon />` |
| **Other** | Other design | `<BulbOutlineIcon />` |

---

### Step 2: "Tell us about your business" (`Step2Business.tsx`)

#### Complete Restored Field Matrix:
| Field Name | Type | Key in `ProjectFormData` | Required? | Restored Options / Placeholder |
| :--- | :--- | :--- | :--- | :--- |
| **Your Name** | `text` input | `name` | Yes (`*`) | `"E.g. John Doe"` |
| **Email Address** | `email` input | `email` | Yes (`*`) | `"E.g. john@example.com"` |
| **Phone Number** | `tel` input | `phone` | No | `"E.g. +1 234 567 8900"` |
| **Instagram Handle** | `text` input | `instagram` | No | `"E.g. @johndoe"` |
| **Preferred Language** | `select` | `language` | No | `["English", "Spanish", "French", "German", "Arabic", "Other"]` |
| **Name your project** | `text` input | `projectName` | Yes (`*`) | `"E.g. Packaging for an organic juice company"` |
| **Describe your project** | `textarea` | `projectDescription` | Yes (`*`) | `"Tell us what you need..."` |
| **Industry** | `select` | `industry` | No | `["Technology", "Retail", "Healthcare", "Finance", "Real Estate", "Education", "Food & Beverage", "Other"]` |
| **Website** | `text` input | `website` | No | `"E.g. www.best-site-ever.com"` |
| **Are you an agency?** | `radio` group | `agencyStatus` | No | 1. `"Yes and I'm interested in agency services"`<br>2. `"Yes and I'm NOT interested in agency services"`<br>3. `"No, I'm not an agency"` |
| **How did you hear?** | `select` | `referral` | No | `["Google", "Social Media", "Friend/Colleague", "Advertisement", "Other"]` |
| **Navigation** | Buttons | N/A | N/A | `Back` (`prevStep()`) and `Next Step` (`nextStep()`) |

---

### Step 3: "Details & Timeline" (`Step3Details.tsx`)

#### Complete Restored Options:
1. **Dynamic Inspiration Links Repeater**:
   - Multiple URL inputs with `<AddIcon />` ("Add another link") and `<TrashIcon />` delete buttons.
   - Saves newline-delimited URLs into `formData.inspirationLinks`.
2. **Timeline Selection (6 Granular Cards with Icons)**:
   - `48 hours (Quick turnaround fees typically apply)` with `<RocketIcon />`
   - `1 week` with `<ClockIcon />`
   - `2 weeks` with `<CalendarIcon />`
   - `1 month` with `<CalendarIcon />`
   - `Choose a start & end date` with `<OlistIcon />`
   - `Not sure. I'd like to chat with my Brand experience consultant` with `<CommentIcon />`
3. **Showcase Permission**:
   - Prompt: *"Can your Brand experience consultant showcase the finished designs in their portfolio?"*
   - Radio buttons: `Yes` / `No`
4. **Extra Notes Textarea**:
   - Prompt: *"Anything else you'd like to share with your Brand experience consultant?"*
   - Textarea placeholder: *"Any extra details..."*
5. **Navigation**:
   - `Back` (`prevStep()`) and `Review Brief` (`nextStep()`).

---

### Step 4: "Review your project brief" (`Step4Summary.tsx`)

#### Complete Restored Summary Dossiers:
1. **Section 1: Design Needs** (with `Edit` jump-button to Step 1):
   - Category (`formData.category`)
   - Service (`formData.service`)
2. **Section 2: Business Details** (with `Edit` jump-button to Step 2):
   - Name, Email, Phone, Instagram, Language, Project Name, Description, Industry, Website, Agency Status, Referral Source.
3. **Section 3: Details & Timeline** (with `Edit` jump-button to Step 3):
   - Inspiration Links, Timeline, Showcase Permission, Extra Notes.
4. **Error Alert Banner**: Inline Notion-callout-styled error alert if network or validation fails.
5. **Direct Transmission Action**:
   - Submit button (`"Let's do this!"` / `"Send Project Brief"`), disabled during `isSubmitting`.
   - Sends atomic payload to `/api/sales-funnel/ingest` with fallback retry loop.

---

## 3. Dark Luxury Visual Design Elevation (Styling ONLY)

While keeping 100% of the functional options above, the visual appearance is elevated to the Swiss dark luxury standard:

| Visual Element | Legacy Outdated Styling | Elevated Swiss Dark Luxury Styling |
| :--- | :--- | :--- |
| **Category Tabs** | Rounded `9999px` bubble pills | Crisp Swiss `2px` border-radius, `#111111` surface with hairline `1px solid rgba(255,255,255,0.1)`. Active tab highlighted with `#ea002a` border and high-contrast white text. |
| **Service Cards** | Grey generic boxes (`12px` radius) | High-end card architecture: `border-radius: 4px;`, `#0e0e0e` pitch-black obsidian background, `1px solid rgba(255,255,255,0.08)`. Hover lifts with `#141414`, active state framed with `1px solid #ea002a` and soft `#ea002a` glow. |
| **Accent Color** | Generic orange (`#ff6100` / `#dc4216`) | Official brand red `--client-accent-red: #ea002a;`. |
| **Form Inputs & Selects** | Bubbly borders with generic grey focus rings | Architectural `border-radius: 2px;`, `#111111` background, hairline border `rgba(255,255,255,0.12)`. Focus ring: `inset 0 0 0 1px #ea002a, 0 0 12px rgba(234,0,42,0.2)`. |
| **Typography** | Generic system font, non-tabular figures | Circular XX font hierarchy (`var(--font-circular)`), step counters formatted with `font-variant-numeric: tabular-nums;` (e.g., `01 / 04`). |
| **Modal Scroll Isolation** | Background website scrolled with modal | Verified rock-solid isolation: `.modalBody` has `overscroll-behavior: contain; touch-action: pan-y;` and `onWheel={(e) => e.stopPropagation()}`. |

---

## 4. Execution Plan (Awaiting Explicit "proceed")

1. **Branch Creation**:
   - Create child branch from `master`: `refactor/project-form-option-restoration-and-luxury-polish`.
2. **Component Implementation**:
   - Restore `Step1Services.tsx` with all 8 category tabs, 52 sub-services, and `@sanity/icons`.
   - Restore `Step2Business.tsx` with Instagram, Industry, Agency Status, Referral, and Back navigation.
   - Restore `Step3Details.tsx` with dynamic Inspiration links repeater, 6 timeline options, Showcase permission, Extra notes, and Back navigation.
   - Restore `Step4Summary.tsx` with 3 comprehensive review dossiers, section edit jump-links, and ingestion submission.
   - Update `Step.module.scss` with Swiss 2px/4px tokens, `#ea002a` accents, and obsidian palette.
3. **Verification**:
   - Run full automated platform test suite (`node --import tsx --test tests/client/client_160over90_platform.test.ts`).
   - Run type checks (`npx tsc --noEmit`).
   - Click-through verification in browser.
4. **Git Delivery**:
   - Commit strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - Push to `origin/refactor/project-form-option-restoration-and-luxury-polish`.
   - Open Pull Request against `master` with descriptive title (no `feat`).
   - Keep Pull Request strictly **OPEN** awaiting manual user merge.
