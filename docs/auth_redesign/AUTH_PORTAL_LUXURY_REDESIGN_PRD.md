# PRD: Commercial Desk Luxury Authentication Portal Redesign

**Feature:** Luxury Authentication Gateway (Login & Signup Architecture)  
**Target Routes:** `/admin/login`, `/admin/signup`  
**Active Branch:** `redesign/crm-luxury-editorial-workspace`  
**Base Branch:** `fix/crm-workspace-recovery`  
**PR:** PR #116 (OPEN, DRAFT)  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Benchmarks:** **Cogie** (Luxury Editorial) & **Pixelcot** (Clean Form Architecture)  

---

## 1. Problem Statement & Anti-Slop Directive

The previous authentication screen suffered from several severe UX and visual defects:
1. **Harsh Dark Wireframe Box**: The left panel rendered a pitch-black `#09090b` block that felt like an internal command-line terminal rather than consumer-grade luxury software.
2. **Fake Live Telemetry Glitches**: Exposing internal unauthenticated metrics (`ACTIVE PIPELINE ₹ 65.4L`, `39 in motion`, `99.98% Uptime`) on a public login gateway is misleading AI slop that degrades brand trust.
3. **Monospace Developer Labels**: Uppercase developer labels (`MARCA UBI · STAFF WORKSPACE`, `End-to-End Enterprise Auth Guard Commercial Desk · v2.4.0`) cluttered the visual hierarchy.
4. **Missing Self-Service Signup**: The system lacked an `/admin/signup` route, forcing administrative users to rely solely on pre-provisioned credentials without self-service onboarding or invite flows.

---

## 2. Benchmark Architecture: Cogie & Pixelcot Synergy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  MARCA UBI FLOATING LUXURY CONTAINER (1040px Max-Width · 28px Radius · Subtle Border)  │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│  LEFT: EDITORIAL VISUAL SHOWCASE          │  RIGHT: CLEAN MINIMAL AUTH DESK           │
│  (Cogie Luxury Archetype)                 │  (Pixelcot / Cogie Form Archetype)         │
│                                           │                                            │
│  ┌─────────────────────────────────────┐  │  [Marca Ubi Logo Lockup]                   │
│  │ A WISE QUOTE ────────────────────── │  │                                            │
│  │                                     │  │  Welcome Back                              │
│  │ [Fluid Chromatic Artwork            │  │  Enter your email and password to access   │
│  │  Obsidian + Crimson / Violet Glow]  │  │                                            │
│  │                                     │  │  Work Email                                │
│  │                                     │  │  [✉  name@marcaubi.com                  ]  │
│  │                                     │  │                                            │
│  │                                     │  │  Password                                  │
│  │ "Precision in Commercial            │  │  [🔒  ••••••••                        👁 ]  │
│  │  Execution."                        │  │                                            │
│  │                                     │  │  [✓] Remember me          Forgot Password? │
│  │ "You can get everything you want if │  │                                            │
│  │  you work hard, trust the process." │  │  [          Sign In (Solid Black)        ] │
│  │                                     │  │                                            │
│  │                                     │  │  ─────── or continue with ───────          │
│  │                                     │  │                                            │
│  │                                     │  │  [ G  Sign In with Google                ] │
│  │                                     │  │                                            │
│  │                                     │  │  Don't have an account? Sign Up            │
│  └─────────────────────────────────────┘  │                                            │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 3. Engineering Implementation Details

### A. Shared Auth Shell (`AdminAuthShell.tsx` & `AdminAuthShell.module.scss`)
- Floating 1040px card with 28px border radius on an ambient canvas.
- Replaces the dark terminal panel with a dedicated CSS/SVG fluid ribbon artwork container featuring `#ea002a` brand crimson and rich violet lighting sweeps.
- Editorial quote lockup: "A WISE QUOTE" header, display serif title, and inspiring quote subtext.

### B. Login Form (`LoginForm.tsx` & `login.module.scss`)
- Title: "Welcome Back".
- Subtitle: "Enter your email and password to access your account".
- Soft-filled inputs (`#f8fafc`, 1px `#e2e8f0` border, 10px squircle radius) with subtle prefix icons (`[✉]`, `[🔒]`).
- Interactive password toggle with stroke eye icons.
- Remember me checkbox and Forgot password link.
- High-contrast solid black primary button (`Sign In`).
- Social auth button: `Sign In with Google` with full-color SVG logo.
- Switcher link: "Don't have an account? Sign Up" linking to `/admin/signup`.

### C. Dedicated Signup Route (`/admin/signup/page.tsx`, `SignupForm.tsx`, `signup.module.scss`)
- Title: "Create an Account".
- Subtitle: "Enter your details to register your commercial workspace account."
- Inputs:
  - Full Name (`[👤] Full Name`)
  - Work Email (`[✉] Work Email`)
  - Password (`[🔒] Password`) with visibility toggle
- Agreement checkbox: "I agree to the Terms of Service & Privacy Policy".
- Primary button: Solid black `Create Account`.
- Social auth button: `Sign Up with Google`.
- Switcher link: "Already have an account? Sign In" linking to `/admin/login`.

### D. Server Action & Security (`src/app/actions/auth.ts`)
- Added `signupAction` enforcing Zod validation, IP-based rate limiting, Supabase Auth user registration, and automatic initial profile provisioning.
- Preserves all existing lockout countdowns, brute-force defenses, and open redirect defenses.
