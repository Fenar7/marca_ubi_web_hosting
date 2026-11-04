# Chat Pod: Light Editorial Theme Restoration & Brand Red Alignment Plan

> **Design Authority**: Authentic Marca Ubi Public Site Standard (`$client-accent-red: #ea002a`, White Paper Transcript, Swiss Typography)  
> **Target Branch**: `remediation/turbopack-compaction-dev-server`  
> **Associated Pull Request**: [PR #107 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/107)  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  

---

## 1. Executive Summary & Root Cause Acknowledgment

- **The Mistake**: The previous iteration incorrectly pulled dark obsidian and orange (`#ff6100`) tokens from the internal CRM specification. The public agency website follows a strict **Swiss Light Editorial** design language (established in Phase 12-14 and `src/app/styles/client-mixins.scss`).
- **The Correction**:
  1. **Purge All Orange (`#ff6100`)**: Restore the authentic brand accent strictly to `$client-accent-red: #ea002a`.
  2. **Restore Light Editorial Paper Canvas**: The modal dialog returns to pure white paper (`#ffffff`) with subtle hairlines (`rgba(0, 0, 0, 0.08)` to `0.12`) and deep black ink (`#0a0a0a`), matching the rest of the public agency site.
  3. **Preserve Sophia Sterling Launcher Portrait**: Retain the photographic portrait thumbnail on the launcher button (`/avatars/sophia-sterling.jpg` with emerald live beacon `#22c55e`), ensuring the letter "U" tile remains permanently eliminated.
  4. **Refined Micro-Design (No Clunky Controls)**:
     - The Send button uses signature Brand Red (`#ea002a`) with crisp white text when populated.
     - The idle send state (`.sendIdle`) is styled as a subtle, clean light element (`rgba(0, 0, 0, 0.04)` fill with muted text) rather than a dated `#cccccc` grey brick.
     - Quick action chips and message bubbles feature refined Swiss typography, generous breathing room, and subtle hover borders.

---

## 2. Design Specification Comparison

| Component | Incorrect State (Screenshot 3) | Corrected Authentic Swiss Light Editorial |
| :--- | :--- | :--- |
| **Accent Color** | `#ff6100` (Orange) | **`#ea002a`** (`$client-accent-red` / Official Brand Red) |
| **Dialog Canvas** | Dark obsidian glass | **Pure White Paper** (`#ffffff`), crisp hairline `1px solid rgba(0, 0, 0, 0.08)` |
| **Launcher Button** | Floating pill with Sophia portrait | **Black Luxury Capsule Button** with Sophia Sterling portrait & green beacon (NO letter "U") |
| **Action Chips** | Dark translucent pills | **Refined Light Editorial Chips** (`#ffffff` fill, `rgba(0, 0, 0, 0.12)` border, black text) |
| **Assistant Speech** | Dark bubble | **Soft Paper Surface** (`rgba(0, 0, 0, 0.035)`), black text (`#0a0a0a`), Swiss line-height `1.55` |
| **Send Button** | Orange gradient | **Brand Red (`#ea002a`)** with white text; clean soft idle state (zero `#cccccc`) |
| **Header Controls** | Dark micro-buttons | **Crisp Editorial Buttons** (`··· Menu`, `✕ Close`) with subtle hover fill |

---

## 3. Strict Verification & Delivery Gates
- [ ] 0 TypeScript compiler errors (`tsc --noEmit`).
- [ ] 100% pass rate on Chat Pod unit suite (`chatpod-*.test.ts`) and global suite (`npm run test:unit`).
- [ ] Brand Red `#ea002a` enforced for all focus outlines and send accents; zero `#ff6100`.
- [ ] Zero legacy letter "U" tile in launcher or header.
- [ ] Git commit strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- [ ] PR #107 remains strictly OPEN awaiting manual review.
