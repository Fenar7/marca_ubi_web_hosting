# Architectural Specification: ConnectCutout Kinetic Left-to-Right Red Text Fill Wave

## 1. Executive Summary
Re-engineers the 3-column studio desks cluster in `ConnectCutout` ([`ConnectCutout.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ConnectCutout.tsx) & [`ConnectCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ConnectCutout.module.scss)) to feature a mathematical **Kinetic Left-to-Right Red Text Fill Wave** strictly scoped to the lower content text.

The top category labels (`CONTACT`, `GENERAL INQUIRIES`, `KERALA STUDIOS`) remain permanently static in editorial uppercase (`color: rgba(255, 255, 255, 0.6);`). The lower white content text starts at a pristine white baseline, and a continuous wave of Brand Red (`#ea002a`) sweeps through the letterforms from left to right:
1. Originates at Column 1 (`+91 7012 052 472`) on the far left.
2. Progresses across Column 2 (`hello@marcaubi.com`) in the center.
3. Concludes across Column 3 (`HiLITE Business Park, Calicut • Trivandrum`) reaching the final word on the far right.
4. Smoothly un-fills back to white in the identical left-to-right direction and rests before looping.

---

## 2. Mathematical Geometry & Bounded Color Zones
To prevent any visual color bleeding or artifacting at rest states, a calibrated `400%` background width is used with strictly separated color zones:

- **Visible Window**: `25%` of total gradient width ($W / 4W$).
- **At Rest ($P = 100\%$ or $P = 0\%$)**:
  - $P = 100\%$: Visible region $[75\%, 100\%]$ is 100% Pure White (`#ffffff`).
  - $P = 0\%$: Visible region $[0\%, 25\%]$ is 100% Pure White (`#ffffff`).
- **At Illumination Peak ($P = 50\%$)**:
  - Visible region $[37.5\%, 62.5\%]$ is 100% Brand Red (`#ea002a`).
- **Directional Continuity**:
  - $P = 100\% \to 50\%$: Red enters from the left edge of characters and sweeps across to the right edge.
  - $P = 50\% \to 0\%$: White enters from the left edge of characters and sweeps across to the right edge.
  - No direction reversal occurs; both fill and wipe maintain an identical left-to-right cadence.

---

## 3. Timeline Stagger Matrix (8.0s Cycle)
| Column | Position | Red Sweep Start | Red Illumination Hold | White Wipe Start | Rest Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Col 1 (Contact)** | Far Left | 4% (0.32s) | 24% - 50% (1.92s - 4.0s) | 50% (4.0s) | 68% - 100% (5.44s - 8.0s) |
| **Col 2 (Inquiries)** | Center | 18% (1.44s) | 38% - 56% (3.04s - 4.48s) | 56% (4.48s) | 74% - 100% (5.92s - 8.0s) |
| **Col 3 (Kerala Studios)**| Far Right | 32% (2.56s) | 52% - 62% (4.16s - 4.96s) | 62% (4.96s) | 80% - 100% (6.40s - 8.0s) |

---

## 4. Interaction & Accessibility Invariants
- **Link Hover Override**: Hovering over interactive links immediately overrides keyframe animation with full `#ea002a` fill via `-webkit-text-fill-color: $client-accent-red !important;`.
- **Reduced Motion**: Under `@media (prefers-reduced-motion: reduce)`, background-clip animation is stripped and elements render in solid high-contrast white.
- **W3C Standards**: Uses vendor-prefixed `-webkit-background-clip: text` alongside standard `background-clip: text`.
