# Marca Ubi Enterprise CRM: Centered Client 360 Modal & Motion Choreography Architecture

> **Document Identity**: Research Module & UX Motion Specification  
> **Target Scope**: `/admin/leads`, `/admin`, Client 360 Dossier (`LeadDetailDrawer.tsx` → `LeadDetailModal.tsx`), `NewLeadDrawer.tsx`, and `AddTeamMemberDrawer.tsx`  
> **Governance Authority**: Adheres strictly to `DESIGN.md`, `.agents/skills/master-ui-ux-design-system/SKILL.md`, and `.agents/skills/antislop-ui/SKILL.md`  
> **Design Read**: `Dial: ENERGY 2 / RHYTHM 2 / MOTION 1` (Apple HIG Vibrancy & Linear Fluidity)  
> **Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  

---

## 1. Executive Summary & User Problem Diagnosis

### 1.1 User Problem Statement & Direct Feedback Analysis
During live manual inspection of the Client 360 Lead Dossier (`/admin` and `/admin/leads`), the user provided direct UX feedback regarding the slide-out drawer mechanism:

> *"btw nwo ther ohtehr thing is evyr lic snd stuffis now lke formthsdiebar as yocua cn see i otn llie thi it hsouldb liek poueoeur inthecnener you tith cmooth ootniong clisng ainiantosi and vyerhin so hire teh team of expert agetns full yreach and give me he teidl plan"*
> 
> **Decoded Directive**:
> *"By the way, now the other thing is every lead and stuff is now like from the sidebar as you can see. I don't like this. It should be like pop up in the center with smooth opening/closing animations and everything. So hire the team of expert agents, fully research and give me the detailed plan."*

Inspection of the desktop screenshot (`Screenshot 2026-10-17 140201.png`) and the existing drawer implementation (`src/app/admin/components/drawers/LeadDetailDrawer.tsx`) reveals the foundational design defect:
1. **Asymmetric Visual Stress & Cognitive Imbalance**: On desktop displays (1920×1080, 2560×1440, and 4K ultra-wide monitors), anchoring a 540px sheet to the extreme right edge leaves more than 70% of the screen as dead black space on the left. The user's gaze is yanked abruptly from the center table to the extreme right margin, causing ocular strain and disorientation.
2. **Cramped Vertical Stacking ("Bento Tower")**: A 540px drawer forces contact coordinates, account assignment dropdowns, and commercial notes into a single narrow vertical column. Field labels and values wrap awkwardly, requiring excessive vertical scrolling to perform basic qualification tasks.
3. **Lack of Cinematic Focus & Prestige**: Marca Ubi is an ultra-luxury digital infrastructure and branding agency. High-ticket enterprise transactions (deals valued from ₹50,000 to ₹1.5 Crore+) require a focused, command-center dialog positioned squarely at the user's natural center of vision, mirroring macOS QuickLook, Stripe Dashboard Command, and Linear Issue details.
4. **Abrupt Motion Dynamics**: The current drawer uses a simple lateral sliding translation (`translateX(100%) → translateX(0)`), which feels mechanical and abrasive rather than fluid, physical, and weighted.

---

## 2. Spatial Geometry & Viewport Architecture

To resolve the drawer limitations, the Client 360 Dossier is re-architected as a **floating centered modal window** engineered according to Apple Human Interface Guidelines (HIG) and Linear's fluid modal physics.

```
+---------------------------------------------------------------------------------------+
|  VIEWPORT OVERLAY: inset: 0; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(20px) |
|                                                                                       |
|                  +-------------------------------------------------+                  |
|                  |  CENTERED CLIENT 360 MODAL (max-width: 880px)   |                  |
|                  |  max-height: min(88vh, 860px); border-radius: 16px |                  |
|                  |  box-shadow: 0 32px 80px -12px rgba(0,0,0,0.85) |                  |
|                  +-------------------------------------------------+                  |
|                  | [LD-1046]  Malak Al-Khatib    VALUATION: ₹65,000 ✕| < Sticky Header  |
|                  | • Active Deal ⌄     Alserkal Avenue Foundation  |                  |
|                  +-------------------------------------------------+                  |
|                  | Overview & Contact | Creative Brief | Activities | < Sticky Nav Rail|
|                  +-------------------------------------------------+                  |
|                  |                                                 |                  |
|                  |  +--------------------+  +--------------------+ |                  |
|                  |  | Contact Coordinate |  | Account Assignment | |                  |
|                  |  | - Phone: +971...   |  | - Owner: Tariq ... | |                  |
|                  |  | - Email: malak@... |  | - Priority: High   | | < Balanced       |
|                  |  | - Channel: Web     |  | - Stage: Active    | |   2-Column Body  |
|                  |  +--------------------+  +--------------------+ |                  |
|                  |  +--------------------------------------------+ |                  |
|                  |  | Commercial Notes (Full Width / Rich Editor)| |                  |
|                  |  +--------------------------------------------+ |                  |
|                  |                                                 |                  |
|                  +-------------------------------------------------+                  |
+---------------------------------------------------------------------------------------+
```

### 2.1 Viewport Placement Specs
- **Outer Shell**:
  ```scss
  .modalOverlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(1rem, 3vw, 2.5rem);
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    overflow: hidden;
  }
  ```
- **Modal Container Geometry**:
  ```scss
  .modalDialog {
    width: 100%;
    max-width: 880px;
    max-height: min(88vh, 860px);
    background: #111114;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 32px 80px -12px rgba(0, 0, 0, 0.85),
      0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 1px rgba(255, 255, 255, 0.14);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  ```

### 2.2 Responsive Geometry Breakdown
| Breakpoint | Layout Mode | Width / Height | Padding | Border Radius |
|---|---|---|---|---|
| **Desktop Ultra-Wide** (`> 1440px`) | Centered Floating Dialog | `max-width: 880px; height: auto; max-height: 86vh;` | `2rem` (32px) | `16px` |
| **Desktop Standard** (`1024px – 1439px`) | Centered Floating Dialog | `max-width: 840px; max-height: 88vh;` | `1.75rem` (28px) | `16px` |
| **Tablet Landscape** (`768px – 1023px`) | Centered Floating Dialog | `max-width: 720px; max-height: 90vh;` | `1.5rem` (24px) | `14px` |
| **Mobile Reflow** (`< 640px`) | Responsive Bottom Sheet / Viewport Dialog | `width: 100vw; height: 100dvh; max-height: 100dvh;` | `1.25rem` (20px) | `16px 16px 0 0` |

---

## 3. Motion & Animation Choreography (Anti-Slop Luxury Standard)

In strict accordance with `DESIGN.md` (`Dial: ENERGY 2 / RHYTHM 2 / MOTION 1`) and `.agents/skills/antislop-ui/SKILL.md`, the animation choreography avoids cartoonish bounces, slow muddy fades, and high-latency transitions. Instead, it deploys an **Apple HIG spring curve** with precise duration scaling.

### 3.1 Physics & Bezier Curves
- **Primary Enter Spring Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (Fluid Deceleration: rapid initial velocity that gently settles into its final coordinates with absolute zero overshoot/jitter).
- **Secondary Exit Curve**: `cubic-bezier(0.4, 0, 1, 1)` (Snappy Acceleration: accelerates out of the viewport cleanly to minimize user wait time).

### 3.2 Keyframe Specifications

#### A. Opening Choreography (240ms)
- **Overlay Fade-In**:
  ```scss
  @keyframes overlayEnter {
    0% {
      opacity: 0;
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
    }
    100% {
      opacity: 1;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
  }
  ```
- **Modal Dialog Scale & Elevation Lift**:
  ```scss
  @keyframes modalEnter {
    0% {
      opacity: 0;
      transform: scale(0.96) translateY(12px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  ```
- **Execution**:
  - Duration: `240ms`
  - Timing: `cubic-bezier(0.16, 1, 0.3, 1)`
  - Hardware Acceleration: `will-change: transform, opacity;`

#### B. Closing Choreography (180ms)
- **Overlay Fade-Out**:
  ```scss
  @keyframes overlayExit {
    0% {
      opacity: 1;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    100% {
      opacity: 0;
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
    }
  }
  ```
- **Modal Dialog Recede & Fade**:
  ```scss
  @keyframes modalExit {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    100% {
      opacity: 0;
      transform: scale(0.97) translateY(8px);
    }
  }
  ```
- **Execution**:
  - Duration: `180ms`
  - Timing: `cubic-bezier(0.4, 0, 1, 1)`
  - State Sync: React state maintains `isExiting` boolean for 180ms before unmounting DOM nodes, preventing premature component removal.

#### C. Accessibility & Reduced Motion
In compliance with WCAG 2.2 Guideline 2.3.3 and Rule R-35:
```scss
@media (prefers-reduced-motion: reduce) {
  .modalOverlay,
  .modalDialog {
    animation-duration: 0.1s !important;
    animation-timing-function: linear !important;
    transform: none !important;
  }
}
```

---

## 4. Interior Visual Hierarchy & Component Construction

Expanding the container from a 540px lateral drawer to an 880px centered modal unlocks immense ergonomic advantages. Instead of vertical bento inception, we deploy an **architectural 2-column layout** powered by Linear Fluid Cards and Stripe Scorecards.

```
+-----------------------------------------------------------------------------------+
| [LD-1046]  MALAK AL-KHATIB                    VALUATION: ₹65,000 [✎]      [Esc] ✕|
| • Active Deal ⌄     Alserkal Avenue Cultural Foundation · Art & Culture           |
+-----------------------------------------------------------------------------------+
|  [Overview & Contact]      [Creative Brief]      [Activity Ledger (7)]     [+ Log]|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  COLUMN 1: Contact Coordinates (55%)        COLUMN 2: Commercial Controls (45%)   |
|  +--------------------------------------+   +-----------------------------------+ |
|  | CONTACT COORDINATES                  |   | ACCOUNT ASSIGNMENT                | |
|  | Telephone Coordinate:                |   | Assigned Representative:          | |
|  | +971554411846  [WhatsApp]            |   | [ Tariq Al-Mansoor (sales)    ⌄ ] | |
|  |                                      |   |                                   | |
|  | Email Address:                       |   | Expected Closing Date:            | |
|  | malak.k@alserkal.ae                  |   | [ 28 Oct 2026                 📅 ] | |
|  |                                      |   |                                   | |
|  | Service Category:    Channel:        |   | Deal Priority:                    | |
|  | [Web & Digital]      • Website Direct|   | [ High Priority (P1)          ⌄ ] | |
|  |                                      |   +-----------------------------------+ |
|  | Preferred Channel:   Acquisition:    |                                         |
|  | Phone                Organic Search  |                                         |
|  +--------------------------------------+                                         |
|                                                                                   |
|  FULL-WIDTH ROW: Commercial Notes & Strategic Directives                          |
|  +------------------------------------------------------------------------------+ |
|  | COMMERCIAL NOTES                                                             | |
|  | [ Interactive virtual art gallery tour and residency portal.             ] | |
|  |                                                                 [Save Notes] | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 4.1 Sticky Header Architecture
- **Height**: Compact `72px` (eliminating wasted header space per Rule R-08).
- **Background**: Apple HIG Frosted Obsidian Glass (`#141418` with 1px bottom border `rgba(255, 255, 255, 0.08)`).
- **Sub-Components**:
  1. **Raycast Monospace Deal ID Token**:
     - `[LD-1046]` in high-contrast Marca Orange background (`rgba(255, 97, 0, 0.12)`, border `rgba(255, 97, 0, 0.3)`).
     - Inline copy icon with tactile hover lift and 1.5s tooltip feedback: `"Deal ID copied to clipboard"`.
  2. **Pipeline Stage Dropdown Trigger**:
     - Compact pill button with 6px semantic radar dot (`#22c55e` emerald for Active, `#f59e0b` amber for Discovery, `#ff6100` orange for Negotiation).
     - Single click displays smooth dropdown popover to advance lead stage atomically.
  3. **Client Heading & Company Eyebrow**:
     - Client Name: `20px` bold, letter-spacing `-0.02em`, font `$font-movatif` / SF Pro Display.
     - Company & Industry: `12.5px`, color `#a1a1aa`, clean inline dot separator.
  4. **Deal Valuation Scorecard**:
     - Tabular numeral formatting: `₹ 65,000` (or dual USD `$ 25,000`).
     - Inline edit trigger pencil: transforms valuation into inline input field for instant quota adjustments.
  5. **Dismissal Controls**:
     - Minimalist close button (`✕`) accompanied by a subtle Raycast keyboard shortcut badge: `Esc` chip (`font-family: monospace; font-size: 10px; background: rgba(255,255,255,0.08)`).

### 4.2 Tab Navigation Rail
- **Height**: `44px` horizontal strip.
- **Tabs**:
  1. `Overview & Contact`: Full client contact coordinates, pipeline status, and commercial notes.
  2. `Creative Brief`: High-ticket agency scope, deliverables, timeline, and intake budget brackets.
  3. `Activity Ledger (N)`: Complete chronological audit trail with actor avatars and diff badges.
  4. `+ Log Touchpoint`: Rapid action panel for instant phone call, meeting, or WhatsApp logging.
- **Active State Indicator**: Smooth 2px solid Marca Orange (`#ff6100`) underline with `0.2s cubic-bezier(0.16, 1, 0.3, 1)` transition.

### 4.3 2-Column Content Body (Tab 1: Overview & Contact)
- **Column 1 (Left 55% — Contact Coordinates)**:
  - Linear Fluid Card container (`#141418`, 1px specular top highlight).
  - Direct Action Triggers:
    - Telephone Coordinate with direct green WhatsApp Web launch button (`target="_blank"` with prefilled intake greeting) and native `tel:` link.
    - Email Coordinate with single-click clipboard copy and `mailto:` action.
    - Category & Channel Tags: Clean Raycast Monospace pills with semantic indicators.
- **Column 2 (Right 45% — Account Assignment & Governance)**:
  - Representative selector dropdown with user avatars and role tags.
  - Expected deal closure date picker.
  - Priority selector (Low, Medium, High, Urgent).
- **Full-Width Strategic Notes Editor**:
  - Textarea with auto-expanding line height and keyboard shortcut (`Cmd + Enter` / `Ctrl + Enter` to save).
  - Primary button: Marca Orange gradient (`linear-gradient(180deg, #ff6100 0%, #e05500 100%)`) with specular top highlight.

### 4.4 Tab 2: Creative Brief Architecture
- High-ticket agency client briefs submitted via `/contact` or manual intake:
  - Project Scope & Core Goals (formatted Notion Callout with 2px orange left border).
  - Requested Services (Raycast tags: *Brand Strategy*, *Web & Digital*, *3D Spatial Production*).
  - Target Launch Timeline (calendar milestone chip).
  - Investment Bracket (high-contrast tabular currency pill).
  - Empty state handling: If no brief exists, provides a 1-click trigger to "Send Client Intake Brief via WhatsApp / Email".

### 4.5 Tab 3: Chronological Activity Ledger
- Replaces cramped vertical drawer timeline with an expansive, human-readable activity audit stream:
  - Left column: Relative timestamp (`2 hours ago`, `Yesterday 4:15 PM`) + Actor Avatar.
  - Middle column: Semantic event type badge (`Stage Changed`, `Call Logged`, `Brief Updated`).
  - Right column: Full event description, before/after parameter diffs, and notes.

### 4.6 Tab 4: Fast Omnichannel Touchpoint Logger
- Dedicated rapid-logging interface for sales executives:
  - Omnichannel Channel Selector: segmented radio buttons with vector icons (Phone Call, WhatsApp, Zoom/Google Meet, In-Person Meeting, Internal Memo).
  - Discussion summary editor.
  - Optional Next Follow-up scheduler with ISO date-time picker.
  - Instant submit button with optimistic UI updates.

---

## 5. Cross-CRM Modal Consistency Evaluation & Migration Matrix

A key architectural mandate is evaluating whether `NewLeadDrawer` and `AddTeamMemberDrawer` should also be unified into the centered modal design system.

### 5.1 System-Wide Comparison & Recommendation Matrix
| Component | Current Surface Type | Current Defect | Recommended Surface Type | Target Width | Design Archetype |
|---|---|---|---|---|---|
| **Client 360 Lead Dossier** (`LeadDetailDrawer.tsx`) | 540px Slide-out Drawer | Asymmetric neck strain, cramped contact rows, vertical bento inception. | **Centered Luxury Modal** (`LeadDetailModal.tsx`) | `880px` | Apple HIG Vibrancy + Linear Fluid 2-Column Grid |
| **Manual Lead Intake** (`NewLeadDrawer.tsx`) | 540px Slide-out Drawer | Excessive vertical scrolling across 10 form fields; disorienting right-side bias. | **Centered Creation Modal** (`NewLeadModal.tsx`) | `680px` | Linear "New Issue" Command Dialog (2-Column Form) |
| **Personnel Provisioning** (`AddTeamMemberDrawer.tsx`) | 540px Slide-out Drawer | Inconsistent with `CredentialRevealModal.tsx` and `SuspendUserModal.tsx` which are already centered modals! | **Centered Provisioning Modal** (`AddTeamMemberModal.tsx`) | `560px` | Stripe Identity / High-Security Command Dialog |
| **Mobile Navigation Shell** (`AdminMobileDrawer.tsx`) | Slide-out Left Drawer | N/A | **Retain as Left Drawer** | `320px` | Standard Mobile Off-Canvas Drawer (Ergonomic thumb reach) |

### 5.2 Rationale for Unifying `NewLeadDrawer` into a Centered Modal
1. **Linear & Stripe Operational Standard**: In modern enterprise tools (Linear, Notion, Stripe, GitHub), creating a new entity is universally handled via a focused, centered modal (`Cmd + K` or `C`). A slide-out drawer creates visual dissonance and feels like a temporary inspection tool rather than a deliberate authoring surface.
2. **Form Layout Optimization**: In an 880px or 680px centered modal, the New Lead form can arrange Contact Name, Email, Phone, Company, Service, and Value into clean 2-column paired rows, reducing vertical scroll depth by 50%.
3. **Seamless Transition to Client 360**: Once a lead is created, the New Lead modal can transition directly into the Client 360 Modal without disorienting layout shifts.

### 5.3 Rationale for Unifying `AddTeamMemberDrawer` into a Centered Modal
1. **Flow Cohesion with Credential Reveal**: Currently, clicking "Add Team Member" slides out a 540px drawer from the right. Upon successful submission, that drawer closes and an entirely different centered modal (`CredentialRevealModal.tsx`) pops up in the middle of the screen! This sudden jump from right-sidebar to center-screen is jarring.
2. **Unified Geometric Rhythm**: Making `AddTeamMemberModal` a centered modal (560px) means the user stays centered in the exact same focal plane before and after credential generation.

---

## 6. Technical Implementation Blueprint & React Motion Hook

### 6.1 State Machine & Unmount Delay Architecture
To guarantee silky-smooth opening and closing animations without DOM pop or premature clipping, the modal utilizes a dedicated lifecycle hook:

```tsx
/**
 * @hook useModalAnimation
 * @description Coordinates mounting and unmounting animations for centered modals.
 *              Guarantees the exit keyframes finish playing before removing DOM nodes.
 */
export function useModalAnimation(isOpen: boolean, exitDurationMs = 180) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, exitDurationMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, exitDurationMs, shouldRender]);

  return { shouldRender, isClosing };
}
```

### 6.2 Focus Trapping & Keyboard Accessibility
1. **Escape Key Dismissal**:
   - Native `keydown` listener listening for `key === 'Escape'`.
   - If unsaved changes exist in the notes or touchpoint logger, triggers the Discard Confirmation dialog instead of abruptly closing.
2. **Focus Retention & Trapping**:
   - Traps `Tab` and `Shift + Tab` navigation strictly within the modal boundaries.
   - Restores keyboard focus to the triggering table row or button upon modal dismissal.
3. **Scroll Lock with Layout Shift Compensation**:
   - Sets `document.body.style.overflow = 'hidden'` on open.
   - Calculates `window.innerWidth - document.documentElement.clientWidth` and adds equivalent `padding-right` to `document.body` to prevent horizontal layout jumps when scrollbars disappear.

### 6.3 Accidental Dismissal Protection (Dirty Check)
When the user types commercial notes or begins composing a touchpoint:
- Backdrop click or `Esc` key intercepts dismissal.
- A secondary high-contrast alert modal asks: *"Discard unsaved modifications? You have pending touchpoint or commercial notes that will be lost."*
- Options: `Keep Editing` (neutral specular) or `Discard Changes` (high-contrast red).

---

## 7. Anti-AI-Slop Governance & Verification Checklist

In strict adherence to `.agents/skills/antislop/SKILL.md` and `DESIGN.md`:

- [x] **R-01 (No Bento Inception)**: Outer modal container has a single 16px rounded shell. Interior cards use borderless rows, tabular grids, and subtle 1px specular dividers. Zero nested bordered boxes.
- [x] **R-02 (No Generic Blue Buttons)**: Strictly Marca Orange gradient (`linear-gradient(180deg, #ff6100 0%, #e05500 100%)`) with top-rim specular sheen. Zero `#2563eb`.
- [x] **R-04 (Tabular Numerals)**: Mandatory `font-variant-numeric: tabular-nums` on Deal Valuation (`₹ 65,000`), Deal IDs (`[LD-1046]`), and activity timestamps.
- [x] **R-05 (No Muddy Shadows)**: Zero light-mode black drop shadows. Pure dark luxury specular highlights (`inset 0 1px 1px rgba(255,255,255,0.14)`) + deep ambient occlusion (`0 32px 80px -12px rgba(0,0,0,0.85)`).
- [x] **R-06 (No Toy Emoji Pills)**: Zero emojis. Micro vector icons with 1.5px strokes and 6px glowing status dots.
- [x] **R-07 (Concentric Corner Radii)**: Outer container $R = 16\text{px}$, inner fluid cards $R = 10\text{px}$, badges $R = 6\text{px}$.
- [x] **R-08 (No Wasted Header Space)**: High-density 72px sticky header containing Deal ID, Client Name, Company, Pipeline Stage, Valuation, and Close controls in a single unified block.
- [x] **R-29 (Color Discipline)**: Canvas Obsidian `#111114`, Surface `#141418`, Border `rgba(255, 255, 255, 0.1)`, Brand Accent Marca Orange `#ff6100`, Semantic Emerald `#22c55e`.
- [x] **R-35 (Fluid Motion Standard)**: Apple HIG spring `cubic-bezier(0.16, 1, 0.3, 1)` with 240ms enter and 180ms exit choreography. Zero sluggish delays.

---

## 8. Phased Implementation Roadmap for Frontend Engineering

When the user grants explicit permission to implement, the engineering execution will proceed across three tightly-scoped phases:

1. **Phase 1: Component Conversion (`LeadDetailModal`)**:
   - Rename/refactor `LeadDetailDrawer.tsx` into `LeadDetailModal.tsx`.
   - Update `LeadDetailDrawer.module.scss` → `LeadDetailModal.module.scss` with centered geometry, Apple HIG backdrop, and scale/elevation keyframe choreography.
   - Update `AdminWorkspaceShell.tsx` to mount `<LeadDetailModal>`.
2. **Phase 2: Interior Layout Optimization**:
   - Re-architect Tab 1 (Overview) into the balanced 2-column grid (`55% / 45%`).
   - Enhance the sticky header with `Esc` badge and compact Raycast Deal ID copy interaction.
   - Verify smooth tab switching with zero layout jitter.
3. **Phase 3: Cross-CRM Modal Harmonization**:
   - Convert `NewLeadDrawer.tsx` into `NewLeadModal.tsx` (`680px` centered modal).
   - Convert `AddTeamMemberDrawer.tsx` into `AddTeamMemberModal.tsx` (`560px` centered modal).
   - Run type checks (`tsc --noEmit`) and verify 100% test pass rate.
