# Architectural Specification & PRD: Marca Ubi Authentic Brand Auth Gateway

**Module:** Commercial Desk Authentication & Registration Portal  
**Target Routes:** `/admin/login`, `/admin/signup`, `/admin/reset-password`  
**Location:** `docs/auth_redesign/AUTH_PORTAL_LUXURY_REDESIGN_PRD.md`  
**Status:** PROPOSED ARCHITECTURAL SPECIFICATION (Awaiting User Execution Approval)  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`

---

## 1. Executive Summary & Root Cause Analysis

Following a visual audit of the live rendering on wide desktop displays (`Screenshot 2026-11-09 190939.png`), three critical anti-patterns and brand mismatches were identified:
1. **Alien Typography**: The use of generic `Playfair Display` / `Georgia` serifs contradicted Marca Ubi's modern Swiss grotesque design identity (`Circular XX` and `Graphik`).
2. **Floating Island Card on Black Void**: Constraining the layout to a centered card (`max-width: clamp(...)` inside `.canvas` with padding) created massive black empty gutters around the screen on 1080p, 1440p, and 4K monitors.
3. **Foreign Purple/Magenta Wave**: Generating a purple/magenta/cyan fluid ribbon SVG (`#d946ef`, `#7c3aed`, `#2563eb`) introduced colors that are completely alien to Marca Ubi's strict obsidian (`#000000`), white (`#ffffff`), and signature crimson red (`#ea002a`) brand palette.

---

## 2. Core Architecture: True 100vw × 100vh Full-Bleed Dual-Pane Split

On desktop displays (`>= 1024px`), the portal will be an edge-to-edge, full-bleed split:
- **Left Showcase Pane (50vw × 100vh)**:
  - Deep Obsidian Black (`#000000` / `#09090b`).
  - Authentic agency photography (`/images/hero-image.png`) with an architectural obsidian vignette scrim.
  - Subtle brand crimson ambiance (`rgba(234, 0, 42, 0.14)`). Zero purple or magenta.
  - Top header pairing the official white vector mark (`/images/marca-ubi-white.svg`, 148px) with a Raycast-style live indicator (`COMMERCIAL DESK`) and hairline rule.
  - Authentic agency headline in **Circular XX Bold** with tight Swiss tracking (`-0.035em`).
- **Right Commercial Desk Pane (50vw × 100vh)**:
  - Pure Paper White (`#ffffff`) with hairline neutral separation (`1px solid #e4e4e7`).
  - Centered form container (`max-width: 440px`).
  - Eradicated duplicate brand logo on desktop (preserved on mobile).
  - Soft-filled `#f8fafc` squircle inputs (48px height, 10px radius) with `#ea002a` focus states.
  - Solid luxury black `#0a0a0a` primary CTA with `#ea002a` hover transition.
- **Mobile Reflow (< 1024px)**:
  - Gracefully stacks into a single-column layout with a compact obsidian header (240px) and full-width form desk.

---

## 3. Typography System Matrix

| Element | Typeface Token | Weight | Size | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Showcase Headline** | `var(--font-circular)` | 700 (Bold) | `clamp(2.4rem, 3.4vw, 3.8rem)` | `-0.035em` |
| **Showcase Subtitle** | `var(--font-graphik)` | 400 (Regular) | `clamp(0.95rem, 1.1vw, 1.05rem)` | Normal |
| **Showcase Eyebrow** | `var(--font-circular)` | 700 (Bold) | 11px | `+0.14em` |
| **Desk Title** | `var(--font-circular)` | 700 (Bold) | `clamp(1.75rem, 2.2vw, 2.25rem)` | `-0.03em` |
| **Desk Subtitle** | `var(--font-graphik)` | 400 (Regular) | 14px | Normal |
| **Form Inputs & Labels** | `var(--font-graphik)` | 500 (Medium) | 13–14px | `-0.01em` |
| **Primary CTA Button** | `var(--font-circular)` | 600 (SemiBold) | 14px | `-0.01em` |
| **Security Badges & Mono**| `var(--font-admin-mono)` | 500 (Medium) | 11px | `+0.04em` |

---

## 4. Security & Invariant Defenses

1. **Edge Proxy Protection (`src/proxy.ts`)**: Preserves perimeter gating for both `/admin/login` and `/admin/signup`.
2. **Brute-Force & Bot Defense**: Progressive IP rate limiting, hidden honeypot (`website`), and terms agreement.
3. **Atomic Rollback in `signupAction`**: Service-role profile creation with compensating deletion rollback (`adminClient.auth.admin.deleteUser`).
4. **Test Suite Compatibility**: 100% pass rate maintained across `phase-1`, `phase-2`, and `phase-auth` test suites.
