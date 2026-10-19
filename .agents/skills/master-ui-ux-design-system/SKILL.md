---
name: master-ui-ux-design-system
description: >-
  All-in-one context-adaptive UI/UX design intelligence skill. Automatically maps domain
  data types to their optimal visual archetypes (Stripe Scorecards, Linear Fluid Cards,
  Uber/Airbnb Map HUD, Notion Callouts, Raycast Monospace Tokens, Apple HIG Vibrancy)
  and strictly enforces the 8 Zero-Tolerance Anti-AI-Slop Commandments.
---

# 🧠 Intelligent Unified Master Design System & Anti-AI-Slop Engineering Guide

This skill is the central visual architecture, component construction, and UX intelligence standard for **Stayee Anywhere**. All UI components, Next.js pages, dashboards, modal sheets, tables, and interactive widgets must strictly adhere to these standards.

--------------------------------------------------------------------------------

## 1. Context-Adaptive Design Decision Matrix

Always inspect the **domain data context** and **user intent** to automatically assign the exact visual archetype, typography, border physics, and micro-interactions:

| Domain / Data Context | Auto-Assigned Archetype | Core Aesthetics & Layout | Typography & Tokens | Micro-Interactions & Accents |
| :--- | :--- | :--- | :--- | :--- |
| **📊 Financial / Metrics / Counts**<br>*(Revenue, Dues, Active Bookings, Aggregates)* | **STRIPE SCORECARDS** | • Deep dark container (`#141418`)<br>• 1px specular top border (`rgba(255,255,255,0.08)`)<br>• Compact vertical rhythm | • `font-variant-numeric: tabular-nums`<br>• SF Pro Display 26–30px / 600 weight<br>• Uppercase 11px 0.05em tracking headers | • Inline SVG delta sparkline (`#18b92b` / `#ff3b30`)<br>• Delta trend pill `↑ +14.2%`<br>• Sub-period comparison label |
| **👥 Operations / Staff / Queues**<br>*(Rosters, Shifts, Work Orders, Approvals)* | **LINEAR FLUID CARDS** | • 34px signature squircle geometry<br>• Specular border gradient (`#666` to `#000`)<br>• Dense 36–40px key-value rhythm | • SF Pro Text 14–16px<br>• 2-column key-value grid<br>• Neutral secondary labels (`#8E8E93`) | • Ambient cursor glow on hover<br>• 1px elevation lift on card hover<br>• Unified 36px action footer toolbar |
| **📍 GPS / Geofencing / Location**<br>*(Off-site checks, Radar maps, Campus bounds)* | **UBER / AIRBNB HUD** | • Floating frosted glass pill/overlay<br>• `backdrop-filter: blur(20px)`<br>• Concentric 16px/24px geometry | • Monospace Fira Code coordinates<br>• SF Pro Text 12px status<br>• High-contrast coordinate badges | • Live distance offset chips (`450m away`)<br>• 1-click Google Maps deep link<br>• Monospace accuracy indicator |
| **💬 Staff Justifications / Notes**<br>*(Leave reasons, Audit notes, Exceptions)* | **NOTION CALLOUTS** | • Subtle warm-neutral tint (`rgba(255,255,255,0.03)`)<br>• 2px solid quote left-accent (`#ff5500` or `#a1a1aa`)<br>• Zero heavy border hacks | • High-legibility italic typography<br>• SF Pro Text 13–14px<br>• Relaxed line-height (1.55–1.6) | • Author avatar + timestamp capsule<br>• Inline quotation accents<br>• Clean padding (12px 16px) |
| **🏷️ Codes / Technical Tags / Status**<br>*(Codes `[EMP-1005]`, Roles, System state)* | **RAYCAST TOKENS** | • Ultra-compact monochrome base<br>• 1px subtle boundary (`rgba(255,255,255,0.1)`)<br>• Rounded 6px / 8px badges | • Fira Code / SF Mono 11–12px<br>• Font-weight 500 / 600<br>• Letter-spacing +0.02em | • 6px pulsing radar status dot (`#34C759` active, `#FF9500` pending)<br>• Click-to-copy tooltip confirmation |
| **✨ Buttons / Modals / Dialogs**<br>*(Action bars, Slide-overs, Modal windows)* | **APPLE HIG VIBRANCY** | • `backdrop-filter: blur(24px)`<br>• `inset 0 1px 1px rgba(255,255,255,0.15)` top-rim highlight<br>• Concentric nested squircles | • SF Pro Display / Text<br>• Button text 13–14px medium/semibold<br>• Letter-spacing -0.01em | • `active: scale(0.98)` tactile spring<br>• Smooth glass overlay transition<br>• Top-rim specular sheen |

--------------------------------------------------------------------------------

## 2. The 8 Zero-Tolerance Anti-AI-Slop Commandments

Every UI engineer and code review agent must enforce these 8 hard rules:

1. **NO Nested Bento Inception**: Never nest bordered cards inside bordered cards. Maintain a single outer container with borderless row strips, tabular columns, or Notion callouts.
2. **NO Loud Flat Neon / Generic Blue Buttons**: Never use solid flat `#2563eb` or `#00ff00` buttons. Use multi-stop gradients with top-rim highlight and subtle radial glow (`linear-gradient(180deg, #ff4d1a 0%, #ff3b00 100%)`).
3. **NO Unstyled Stacked Text**: Never render raw stacked `div`s with identical weight. Pair micro-labels (11px uppercase, 0.05em tracking) with high-contrast tabular values.
4. **NO Raw Unformatted Numbers**: All numeric data must use `font-variant-numeric: tabular-nums`, formatted currencies (`Intl.NumberFormat('en-IN')`), and percentage delta pills.
5. **NO Muddy Dark Mode Shadows**: Never use light-mode black drop shadows on dark surfaces. Use 1px specular border highlights + deep ambient drop shadows (`0 20px 48px rgba(0,0,0,0.6)`).
6. **NO Toy Emoji Pills**: Never use emojis for status or category chips. Use 14-16px micro vector icons (1.5px stroke) or 6px glowing status dots.
7. **NO Corner Radius Collisions**: Always follow concentric math ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$). Outer container = 34px, inner card = 15-20px, badge = 6px.
8. **NO Wasted Header Space**: Headers must be compact 40px rails containing title, status badge, and trailing action triggers in a single row.

--------------------------------------------------------------------------------

## 3. Master Design Tokens & SCSS Mixins

### Typography Stacks
```scss
$font-sf-pro: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
$font-mono: 'Fira Code', 'SF Mono', Menlo, Consolas, Monaco, monospace;
```

### Essential Master Mixins
```scss
// 1. Signature Specular Dark Card (34px Geometry)
@mixin dark-card-specular($radius: 34px) {
  border-radius: $radius;
  border: 1px solid transparent;
  background-image: 
    linear-gradient(180deg, #141418 0%, #101014 100%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(0, 0, 0, 0.8) 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.08);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    box-shadow: 0 24px 54px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.14);
    transform: translateY(-1px);
  }
}

// 2. Apple HIG Material Vibrancy (Frosted Glass Surfaces)
@mixin apple-glass-surface($blur: 24px, $opacity: 0.75, $radius: 20px) {
  background: rgba(20, 20, 24, $opacity);
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);
  border-radius: $radius;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15);
}

// 3. Tabular Numeric Typography for Financial / Metrics
@mixin tabular-metrics {
  font-family: $font-sf-pro;
  font-feature-settings: "tnum" 1, "cv05" 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  -webkit-font-smoothing: antialiased;
}

// 4. Raycast Monospace Badge
@mixin raycast-badge {
  font-family: $font-mono;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// 5. Radar Pulse Dot Animation
@mixin radar-dot($color: #34c759) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: $color;
  position: relative;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: $color;
    opacity: 0.4;
    animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
}

@keyframes radar-ping {
  0% { transform: scale(0.8); opacity: 0.6; }
  75%, 100% { transform: scale(2.2); opacity: 0; }
}

// 6. Unified Specular Action Button
@mixin unified-action-btn($variant: 'secondary') {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-family: $font-sf-pro;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;

  &:active {
    transform: scale(0.97);
  }

  @if $variant == 'primary' {
    background: linear-gradient(135deg, #ff3b00 0%, #d42e00 100%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(255, 59, 0, 0.25);

    &:hover {
      background: lighten(#ff3b00, 3%);
      box-shadow: 0 6px 20px rgba(255, 59, 0, 0.35);
    }
  } @else {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f5f5f5;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.18);
    }
  }
}
```

--------------------------------------------------------------------------------

## 4. Verification & PR Audit Checklist

Before submitting code, all subagents and PR auditors must verify:

- [ ] **Zero Bento Clutter**: No nested double-bordered cards. Flat rows with `divide-y divide-white/[0.06]`.
- [ ] **Zero AI Neon / Generic Blue**: No raw `#2563eb` or solid flat buttons. Specular gradient buttons only.
- [ ] **Typography Hierarchy**: SF Pro tracking applied; micro-labels are uppercase 11px; metrics are `tabular-nums`.
- [ ] **Concentric Radii**: Card ($34\text{px}$) $\rightarrow$ Sub-block ($15\text{px}-20\text{px}$) $\rightarrow$ Badge ($6\text{px}$ or pill).
- [ ] **Specular Highlights**: Cards and buttons include `inset 0 1px 1px 0 rgba(255, 255, 255, 0.12-0.35)`.
- [ ] **No Emoji Slop**: Clean Lucide vector icons (1.5px stroke) or 6px glowing status dots only.
- [ ] **Keyboard & Density Ergonomics**: Table/list rows are 36-40px height with monospace code chips.
- [ ] **Strict Type Safety**: Zero `any` types in TypeScript component props and data models.
