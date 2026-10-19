# Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
# Master Technical PRD: Security, Identity, Multi-User Governance & Ingestion Architecture
**Document Code:** `PRD-SEC-ID-INGEST-2026-V1`  
**Author:** Lead Full-Stack Security & Identity Engineer  
**Target Release:** Production Phase 2, 3, 4, 5 (Next.js 16 + Supabase SSR Architecture)  
**Date:** October 15, 2026  
**Classification:** Restricted / Production Engineering Specification  

---

## 1. Authentication, Identity & Edge Route Protection (Phase 2 Specification)

### 1.1 Supabase Auth & `@supabase/ssr` Cookie Architecture

The authentication architecture of the Marca Ubi CRM is engineered around a zero-trust, stateless, server-validated session model leveraging `@supabase/ssr` with Next.js 16 App Router and React 19 Server Components. Unlike standard client-side Single Page Applications (SPAs) that persist JSON Web Tokens (JWTs) in browser `localStorage` or `sessionStorage`—exposing session credentials to Cross-Site Scripting (XSS) vectors and supply-chain script compromise—the Marca Ubi CRM enforces an uncompromised `HttpOnly`, `Secure`, `SameSite=Lax` cookie storage paradigm. Under this paradigm, authentication tokens are entirely inaccessible to client-side JavaScript, neutralizing token theft even in the event of an arbitrary script execution vulnerability.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE SSR TOKEN ROTATION & COOKIE LIFECYCLE                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

  Browser Client                 Next.js 16 Edge Middleware              Supabase Auth Engine
        │                                     │                                    │
        │── 1. HTTP Request (Encrypted Cookie)│                                    │
        │   [sb-access-token, sb-refresh-token]                                    │
        │────────────────────────────────────>│                                    │
        │                                     │── 2. Validate Session Token ──────>│
        │                                     │      supabase.auth.getUser()       │
        │                                     │<── 3. Expired / Needs Rotation ────│
        │                                     │                                    │
        │                                     │── 4. Exchange Refresh Token ──────>│
        │                                     │      PKCE Code Flow                │
        │                                     │<── 5. Issue New Token Pair ────────│
        │                                     │      (New Access + Refresh JWT)    │
        │                                     │                                    │
        │<── 6. Mutated Response Cookies ─────│                                    │
        │    Set-Cookie: HttpOnly; Secure;    │── 7. Forward Request to Route ────>│
        │    SameSite=Lax; Path=/             │      [Server Components Render]    │
```

#### 1.1.1 PKCE Flow and Token Refresh Lifecycle
Authentication transitions operate strictly via the Proof Key for Code Exchange (PKCE) flow. When an administrative user initiates authentication via `/admin/login`, the client generates a cryptographically random code verifier (`code_verifier`) and derives a code challenge (`code_challenge` using SHA-256). During verification, the authorization code returned by Supabase Auth is exchanged on the Next.js server tier for a session token pair:
1. **Access Token**: A cryptographically signed RS256 JWT containing the user's UUID (`sub`), role claims, issuing authority (`iss`), and expiration timestamp (`exp`). The access token maintains a strict lifespan of 3,600 seconds (1 hour) to mitigate replay windows in the event of transient network interception.
2. **Refresh Token**: A high-entropy, cryptographically random, single-use string maintained within Supabase Auth's session store. Refresh tokens are bound to a strict rotation policy: whenever a refresh token is exchanged to issue a fresh access token, the used refresh token is invalidated immediately, and a new refresh token is issued in tandem. If an invalidated refresh token is ever presented (indicating potential token replay or interception), Supabase Auth automatically revokes the entire compromised session family.

#### 1.1.2 Cookie Chunking and Split Storage Engine
Modern browser implementations enforce strict per-cookie payload limits (typically 4,096 bytes). Supabase session payloads containing user metadata and JWT signatures frequently exceed this threshold. `@supabase/ssr` implements an automatic cookie chunking mechanism that shards session data across numbered cookies (`sb-[project-id]-auth-token.0`, `sb-[project-id]-auth-token.1`). The server-side cookie store handler must seamlessly recombine these chunks on ingress and split them on egress. All cookies are configured with the following production attributes:
* `HttpOnly = true`: Prevents client-side access via `document.cookie`.
* `Secure = true`: Enforced across all production environments, ensuring cookies are transmitted strictly over TLS 1.3 encrypted tunnels.
* `SameSite = Lax`: Delivers comprehensive protection against Cross-Site Request Forgery (CSRF) on mutation operations while permitting top-level cross-site navigations to preserve user login sessions.
* `Path = /`: Restricts cookie scope across the unified application root.

#### 1.1.3 Multi-Context Supabase Client Factory
To accommodate the execution lifecycle of Next.js 16, Supabase clients are partitioned into three isolated runtime factories:
* **Server Component / Server Action Client (`src/app/lib/supabase/server.ts`)**: Binds to `next/headers` `cookies()`. Supports asynchronous cookie retrieval and mutations within Server Actions.
* **Edge Middleware Client (`src/app/lib/supabase/middleware.ts`)**: Binds directly to the incoming `NextRequest` and outgoing `NextResponse`. Mutates cookie headers in-flight to preserve token rotation without triggering Next.js streaming errors.
* **Admin SDK Client (`src/app/lib/supabase/admin.ts`)**: Configured with `process.env.SUPABASE_SERVICE_ROLE_KEY`. Restricted exclusively to privileged server-side operations (provisioning, offboarding, batch transactions). Strictly prohibited from execution in Edge runtimes or client-facing bundles.

---

### 1.2 Next.js 16 Edge Middleware (`middleware.ts`) Protection Hierarchy

Next.js 16 Edge Middleware serves as the foundational perimeter firewall for the Marca Ubi CRM. Operating on the V8 Edge runtime prior to Server Component rendering or database query invocation, `middleware.ts` intercepts all HTTP requests, validates cryptographic session tokens, inspects organizational authorization roles, and enforces zero-latency route gating.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS 16 EDGE ROUTE PROTECTION HIERARCHY                       │
└────────────────────────────────────────────────────────────────────────────────────────┘

                               Incoming Request
                                      │
                                      ▼
                        Is Path Public Marketing or API?
                                      │
                   ┌──────────────────┴──────────────────┐
                  YES                                    NO
                   │                                     │
                   ▼                                     ▼
        Allow Pass-Through                     Is Path /admin/login?
    (/, /services, /start-project,                       │
     /api/sales-funnel/ingest)             ┌─────────────┴─────────────┐
                                          YES                          NO
                                           │                           │
                                           ▼                           ▼
                                  Has Active Session?          Has Active Session?
                                           │                           │
                                   ┌───────┴───────┐           ┌───────┴───────┐
                                  YES              NO         YES              NO
                                   │               │           │               │
                                   ▼               ▼           ▼               ▼
                              Redirect to     Render Login  Is Path       Redirect to
                                /admin         Interface   /admin/team?   /admin/login?next=...
                                                               │
                                                   ┌───────────┴───────────┐
                                                  YES                      NO
                                                   │                       │
                                                   ▼                       ▼
                                            User Role IN             Allow Access
                                       ('admin', 'sales_manager')?    to /admin/*
                                                   │
                                           ┌───────┴───────┐
                                          YES              NO
                                           │               │
                                           ▼               ▼
                                      Allow Access      Reject: 403 Forbidden
                                     to /admin/team    (Custom Security Screen)
```

#### 1.2.1 Route Protection Hierarchy & Path Matching Topology
The route topology enforces four mutually exclusive operational security zones:
1. **Public Marketing Enclave**: Unrestricted public access across `/`, `/services`, `/blog/*`, `/start-project`, and public asset paths (`/_next/*`, `/images/*`, `/pdf/*`).
2. **Public Ingestion Enclave**: Highly rate-limited public API endpoints (`/api/sales-funnel/ingest`) secured by token-bucket rate limiting and cryptographic honeypots, bypassing user authentication.
3. **Authentication Boundary (`/admin/login`)**: Unauthenticated access allowed. If an authenticated user with a valid active session navigates to `/admin/login`, the middleware intercepts the request and issues an immediate 307 Temporary Redirect to `/admin`.
4. **Protected Administrative Enclave (`/admin/*`)**: Complete authentication requirement. Any request lacking a valid Supabase session is intercepted, stripped of credentials, and redirected to `/admin/login?next=${encodeURIComponent(pathname)}`.
5. **High-Security Governance Enclave (`/admin/team`)**: Restricted exclusively to organizational identities possessing the `admin` or `sales_manager` role. Requests from users with the `sales_executive` or `viewer` role trigger an immediate HTTP 403 Forbidden rejection.

#### 1.2.2 Session Validation Engine: `getUser()` vs `getSession()`
A critical vulnerability in standard Supabase implementations involves evaluating `supabase.auth.getSession()` inside Edge Middleware. Because `getSession()` simply reads and decodes the JWT claims stored in the local cookie without verifying signature authenticity against the Supabase Auth server, an attacker with a forged, manipulated, or revoked JWT can bypass edge gates. 

The Marca Ubi Edge Middleware mandates the invocation of `supabase.auth.getUser()`. This method transmits the token to Supabase Auth's authentication endpoint, cryptographically verifying signature integrity, inspecting database-level user revocation records, and confirming that the user's account status is not `suspended`. If `getUser()` fails or throws an error, cookies are systematically cleared, and the user is redirected to the authentication portal.

#### 1.2.3 Prevention of Circular Redirect Loops
Circular redirect loops occur when the login page or error handlers inadvertently trigger redirection back to protected routes while session cookies are in an indeterminate state. To prevent redirect loops:
* The middleware explicitly bypasses internal Next.js assets (`_next/static`, `_next/image`, `favicon.ico`) using an exhaustive matcher regex.
* The query parameter `next` is validated using a relative path parser that strictly strips leading protocols, domains, and double-slashes (`//`), preventing Open Redirect phishing vulnerabilities. If `next` contains an invalid or external URI, it defaults deterministically to `/admin`.
* When redirecting an unauthenticated user, the middleware constructs the target redirect URL using `new URL('/admin/login', request.url)` with search parameters intact, returning a clean 307 Temporary Redirect.

#### 1.2.4 Role-Based Route Gating at the Edge Runtime
When an incoming request targets `/admin/team`, the middleware extracts the caller's role. To achieve sub-millisecond edge evaluation without executing redundant PostgreSQL roundtrips on every static asset load, user role claims are encoded in the custom app metadata claims of the JWT during provisioning and role updates (`app_metadata.role`). 

The middleware extracts `user.app_metadata.role`. If the evaluated role is neither `admin` nor `sales_manager`, the middleware aborts the request pipeline and rewrites the response to `/admin/unauthorized`, rendering an institutional security violation notice and recording an unauthorized traversal attempt.

---

### 1.3 Production Implementation: Next.js 16 Edge Middleware (`middleware.ts`)

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Initialize Supabase client configured for Edge Middleware cookie synchronization
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            })
          );
        },
      },
    }
  );

  // CRITICAL SECURITY ENFORCEMENT:
  // Validate token cryptographic signature and active revocation status against Supabase Auth API
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const isAuthRoute = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isAuthRoute;
  const isTeamGovernanceRoute = pathname.startsWith("/admin/team");

  // Scenario 1: Unauthenticated user attempting to access protected admin routes
  if (isAdminRoute && (authError || !user)) {
    const redirectUrl = new URL("/admin/login", request.url);
    // Sanitize redirect target to prevent Open Redirect attacks
    const safeNext = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/admin";
    redirectUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(redirectUrl);
  }

  // Scenario 2: Authenticated user attempting to access the login page
  if (isAuthRoute && user && !authError) {
    const rawNext = request.nextUrl.searchParams.get("next");
    const safeNext = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  // Scenario 3: Role-based edge route restriction for Team Management (/admin/team)
  if (isTeamGovernanceRoute && user) {
    const userRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);

    if (userRole !== "admin" && userRole !== "sales_manager") {
      // Log security violation header for Edge telemetry
      const forbiddenUrl = new URL("/admin", request.url);
      forbiddenUrl.searchParams.set("error", "unauthorized_role_access");
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, pdfs, svg)
     * - public api routes (/api/sales-funnel/ingest)
     */
    "/admin/:path*",
  ],
};
```

---

### 1.4 Branded Dark Luxury `/admin/login` Security Hardening & UX

The administrative login interface represents the commercial front door to Marca Ubi's sales intelligence platform. It must simultaneously reflect the agency's ultra-premium brand identity and implement exhaustive, defense-in-depth security countermeasures against brute-force attacks, credential stuffing, and session fixation.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BRANDED DARK LUXURY /admin/login LAYOUT                         │
└────────────────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                │
    │                                  MARCA UBI                                     │
    │                        ENTERPRISE SALES INTELLIGENCE                           │
    │                                                                                │
    │         ┌────────────────────────────────────────────────────────────┐         │
    │         │  RESTRICTED AGENCY PORTAL                                  │         │
    │         │  Authorized personnel only. Access monitored & logged.     │         │
    │         ├────────────────────────────────────────────────────────────┤         │
    │         │                                                            │         │
    │         │  WORK EMAIL                                                │         │
    │         │  ┌──────────────────────────────────────────────────────┐  │         │
    │         │  │ name@marcaubi.com                                    │  │         │
    │         │  └──────────────────────────────────────────────────────┘  │         │
    │         │                                                            │         │
    │         │  PASSWORD                                                  │         │
    │         │  ┌──────────────────────────────────────────────────────┐  │         │
    │         │  │ ••••••••••••••••••••••••••                           │  │         │
    │         │  └──────────────────────────────────────────────────────┘  │         │
    │         │                                                            │         │
    │         │  ┌──────────────────────────────────────────────────────┐  │         │
    │         │  │ [⚡] AUTHENTICATE INTO WORKSPACE                     │  │         │
    │         │  └──────────────────────────────────────────────────────┘  │         │
    │         │                                                            │         │
    │         │  🔒 Protected by Hardware TLS 1.3 & Encrypted Session JWT  │         │
    │         └────────────────────────────────────────────────────────────┘         │
    │                                                                                │
    │                   © 2026 Marca Ubi. All rights reserved.                      │
    └────────────────────────────────────────────────────────────────────────────────┘
```

#### 1.4.1 Visual Design Tokens & Aesthetic Architecture
The login portal is styled strictly utilizing Marca Ubi's design system tokens:
* **Canvas Background**: Obsidian black (`#0b0b0b`) layered with a radial micro-glow (`rgba(255, 97, 0, 0.03)` at `50% 20%`).
* **Glassmorphic Card Elevation**: `#111111` backing with `backdrop-filter: blur(24px)` and a hairline border structure (`1px solid rgba(255, 255, 255, 0.08)`).
* **High-Contrast Brand Accents**: Primary action button rendered in high-energy CTA Orange (`#ff6100`), transitioning to `#e05500` on `:hover`, with crisp white text (`#ffffff`) and subtle kinetic scaling (`transform: translateY(-1px)`).
* **Typography**: Clean typographic hierarchy featuring tracking `-0.02em` on headers, tabular numerals for time counters, and muted zinc (`#888888`) for secondary security disclosures.

#### 1.4.2 Defense-in-Depth Security Headers
To eliminate attack surfaces at the HTTP response layer, Next.js configuration enforces strict security headers across all administrative routes:
* `Content-Security-Policy`: Restricts script execution to trusted first-party hashes, prohibiting inline arbitrary scripts and blocking unauthorized third-party trackers.
* `X-Frame-Options: DENY`: Blocks framing within `<iframe>` elements to eliminate Clickjacking attacks.
* `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing by legacy user agents.
* `Strict-Transport-Security (HSTS)`: `max-age=63072000; includeSubDomains; preload` forcing strict TLS transport.
* `Referrer-Policy: strict-origin-when-cross-origin`: Strips sensitive path and query parameters from HTTP referrer headers.

#### 1.4.3 Progressive Brute-Force Lockout Engine
To neutralize automated credential stuffing and dictionary attacks, authentication requests are monitored via a progressive exponential backoff policy:
1. **Attempts 1–3**: Standard error response (`"Invalid corporate credentials"`). Error messages are deliberately generic to prevent user enumeration attacks.
2. **Attempts 4–5**: Enforced artificial latency of 1,500ms injected into the response pipeline to throttle automated multi-threaded credential stuffing bots.
3. **Attempt 6+**: Temporary account lockout triggered. The offending IP address and email identity receive an HTTP 429 Too Many Requests response with a mandatory 15-minute cooldown window. Failed attempts are recorded in `team_audit_logs` with complete IP, User-Agent, and geolocation metadata.

#### 1.4.4 WCAG 2.1 AA Accessibility & Keyboard Interaction Standards
The login interface satisfies WCAG 2.1 AA compliance benchmarks:
* Form labels are explicitly bound to inputs via `htmlFor` and `id` bindings.
* Interactive inputs provide high-contrast `:focus-visible` outline rings (`2px solid #ff6100`, offset `2px`).
* Dynamic validation errors are announced immediately to screen readers using `role="alert"` and `aria-live="assertive"`.
* Tab navigation order is strictly deterministic: Email input $\rightarrow$ Password input $\rightarrow$ Show/Hide password toggle $\rightarrow$ Submit button $\rightarrow$ Help contact link.

---

## 2. Multi-User Provisioning & Team Administration (Phase 3 Specification)

### 2.1 In-App User Provisioning Architecture via Supabase Admin SDK

In an enterprise agency environment, client confidentiality and pipeline integrity require that corporate user accounts never be created through unvetted self-registration. Public signups must be completely disabled, with team member provisioning handled exclusively by authorized administrators from within the authenticated `/admin/team` portal.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        IN-APP TEAM PROVISIONING ARCHITECTURE                           │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [Admin User in /admin/team] 
             │
             │── 1. Submit User Provisioning Form (Email, Name, Role, Job Title, TempPass)
             ▼
 [Next.js Server Action: createTeamUser]
             │
             │── 2. Authenticate Caller via supabase.auth.getUser()
             │── 3. Verify Caller Profile: role === 'admin' AND status === 'active'
             │
             ▼
 [Supabase Admin SDK (Service Role Key: Node.js Isolated Runtime)]
             │
             │── 4. supabase.auth.admin.createUser({
             │          email, password: tempPassword,
             │          email_confirm: true,
             │          app_metadata: { role }
             │      })
             │
             ▼
 [PostgreSQL 15+ ACID Transaction]
             │
             │── 5. Insert public.profiles (id, full_name, role, job_title, must_change_password=true)
             │── 6. Insert public.team_audit_logs (actor_id, action='USER_CREATED', target_user_id)
             │
             ▼
 [Return Temporary Credential Modal Payload to Admin UI]
```

#### 2.1.1 Service Role Key Isolation and Execution Boundary
The Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) possesses complete administrative privileges, entirely bypassing Row Level Security (RLS) policies. To eliminate the risk of privilege leakage:
* The Service Role Key is strictly isolated to Node.js server runtimes (`runtime = 'nodejs'`).
* It is never referenced in Edge Middleware, never exposed via `NEXT_PUBLIC_*` environment prefixes, and stripped from all client component bundles via Next.js compiler boundaries.
* The Admin SDK client is instantiated solely inside isolated Server Action modules (`src/app/lib/supabase/admin.ts`).

#### 2.1.2 Transactional Provisioning Pipeline: Two-Phase Identity Creation
The provisioning sequence executes through an atomic multi-stage pipeline:
1. **Authorization Gate**: The Server Action invokes `supabase.auth.getUser()` using the caller's session cookies. It queries `public.profiles` to confirm that the caller's role is `admin` and their status is `active`. If the caller is an executive, manager, or unauthenticated user, the action throws a `SecurityException` and terminates.
2. **Auth Identity Creation**: The server invokes `adminClient.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, app_metadata: { role } })`. Setting `email_confirm: true` bypasses external email confirmation dependencies, ensuring the team member's account is verified immediately.
3. **Profile Record Binding**: An atomic insert is executed into `public.profiles` populating `id` (matching the newly created Auth UUID), `full_name`, `email`, `role`, `job_title`, `phone`, `status = 'active'`, and `must_change_password = true`.
4. **Audit Trail Generation**: An immutable record is committed to `public.team_audit_logs` detailing the provisioning event, caller identity, target user UUID, timestamp, and IP address.
5. **Rollback Safety**: If the profile insertion or audit logging fails, the action immediately triggers a compensating transaction: `adminClient.auth.admin.deleteUser(newUserId)`, preventing orphaned identities in `auth.users`.

---

### 2.2 Production Implementation: `createTeamUser` Server Action

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Input validation schema with strict password complexity standards
const CreateTeamUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid corporate email address").toLowerCase().trim(),
  role: z.enum(["admin", "sales_manager", "sales_executive", "viewer"], {
    errorMap: () => ({ message: "Invalid role specified" }),
  }),
  jobTitle: z.string().min(2, "Job title is required").max(100),
  phone: z.string().optional().default(""),
  tempPassword: z
    .string()
    .min(12, "Temporary password must be at least 12 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
});

export type CreateTeamUserInput = z.infer<typeof CreateTeamUserSchema>;

export type CreateTeamUserResult =
  | { success: true; userId: string; email: string; role: string }
  | { success: false; error: string };

export async function createTeamUser(
  rawInput: CreateTeamUserInput
): Promise<CreateTeamUserResult> {
  const cookieStore = await cookies();

  // 1. Authenticate caller using session cookies
  const callerSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user: callerUser },
    error: callerAuthError,
  } = await callerSupabase.auth.getUser();

  if (callerAuthError || !callerUser) {
    return { success: false, error: "Authentication required. Please log in." };
  }

  // 2. Enforce Admin Role Verification from database
  const { data: callerProfile, error: profileError } = await callerSupabase
    .from("profiles")
    .select("role, status")
    .eq("id", callerUser.id)
    .single();

  if (
    profileError ||
    !callerProfile ||
    callerProfile.role !== "admin" ||
    callerProfile.status !== "active"
  ) {
    return {
      success: false,
      error: "Privilege Escalation Blocked: Only active administrators can provision team users.",
    };
  }

  // 3. Validate form inputs
  const parseResult = CreateTeamUserSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Validation failed.",
    };
  }

  const { fullName, email, role, jobTitle, phone, tempPassword } = parseResult.data;

  // 4. Initialize privileged Supabase Admin Client
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  let createdUserId: string | null = null;

  try {
    // 5. Create Auth identity via Supabase Admin API
    const { data: newAuthUser, error: authCreationError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: { full_name: fullName, job_title: jobTitle },
      });

    if (authCreationError || !newAuthUser.user) {
      return {
        success: false,
        error: `Identity Creation Failed: ${authCreationError?.message || "Unknown error"}`,
      };
    }

    createdUserId = newAuthUser.user.id;

    // 6. Insert profile record in public schema
    const { error: profileInsertError } = await adminSupabase
      .from("profiles")
      .insert({
        id: createdUserId,
        full_name: fullName,
        email,
        role,
        job_title: jobTitle,
        phone,
        status: "active",
        must_change_password: true,
        updated_at: new Date().toISOString(),
      });

    if (profileInsertError) {
      throw new Error(`Profile Persistence Failed: ${profileInsertError.message}`);
    }

    // 7. Write immutable audit log
    await adminSupabase.from("team_audit_logs").insert({
      actor_id: callerUser.id,
      actor_email: callerUser.email ?? "unknown",
      action_type: "USER_CREATED",
      target_user_id: createdUserId,
      payload_after: {
        email,
        role,
        fullName,
        jobTitle,
      },
      created_at: new Date().toISOString(),
    });

    revalidatePath("/admin/team");

    return {
      success: true,
      userId: createdUserId,
      email,
      role,
    };
  } catch (error: any) {
    // Compensating Transaction: Roll back auth identity creation if downstream steps fail
    if (createdUserId) {
      await adminSupabase.auth.admin.deleteUser(createdUserId).catch(() => {});
    }

    return {
      success: false,
      error: error?.message || "Internal server error occurred during provisioning.",
    };
  }
}
```

---

### 2.3 Privilege Escalation Prevention & Sole-Admin Lockdown

The CRM's authorization architecture enforces strict hierarchical privilege boundaries. Privilege escalation vulnerabilities arise when a non-admin user modifies their own role payload or when an administrator inadvertently demotes or suspends the agency's sole remaining administrative identity, locking the agency out of system governance.

#### 2.3.1 Hierarchical Role Matrix
* `admin`: Complete governance authority. Can provision users, modify roles, deactivate accounts, view all leads, execute batch reassignments, and inspect audit logs.
* `sales_manager`: Operational management authority. Can view all studio leads, reassign leads between sales executives, update funnel statuses, and review pipeline KPIs. Cannot provision users or modify user roles.
* `sales_executive`: Direct commercial driver. Under database RLS, can view and interact strictly with leads where `assigned_to = auth.uid()`. Cannot view teammate leads or access `/admin/team`.
* `viewer`: Read-only stakeholder access (investors, accounting). Can view all pipeline analytics and lead cards in a read-only state. Cannot edit leads, log activities, or access user management.

#### 2.3.2 Sole-Admin Protection: Database-Level Stored Trigger
Software-level validation checks in UI or Server Actions are insufficient on their own because direct database updates or concurrent race conditions could bypass application code. To guarantee that an agency is never left without an active administrator, the database schema implements a PostgreSQL trigger that executes before any `UPDATE` or `DELETE` on `public.profiles`.

```sql
-- Enforce Sole Administrator Protection Invariant
CREATE OR REPLACE FUNCTION public.check_sole_admin_invariance()
RETURNS TRIGGER AS $$
DECLARE
    active_admin_count INT;
BEGIN
    -- Evaluate only if modifying an existing active admin
    IF OLD.role = 'admin' AND OLD.status = 'active' THEN
        -- Check if operation attempts to demote role or change status away from active
        IF (TG_OP = 'DELETE') OR 
           (TG_OP = 'UPDATE' AND (NEW.role <> 'admin' OR NEW.status <> 'active')) THEN
           
            SELECT COUNT(*) INTO active_admin_count
            FROM public.profiles
            WHERE role = 'admin' 
              AND status = 'active'
              AND id <> OLD.id;

            IF active_admin_count < 1 THEN
                RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: Cannot demote, suspend, or delete the sole remaining active administrator in the agency.'
                    USING ERRCODE = 'P0001';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_protect_sole_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_sole_admin_invariance();
```

---

### 2.4 Team Management Dashboard (`/admin/team`) Specification

The `/admin/team` dashboard serves as the command center for agency personnel governance. The interface consists of an interactive team roster, real-time workload metrics, a secure temporary credential distribution flow, and audit trail inspection.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        TEAM ROSTER DASHBOARD (/admin/team)                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [👥 Team Administration]                                   [+ Add Team Member Drawer]
 Total Personnel: 8 Active | 1 Suspended

 ┌──────────────────┬─────────────────┬──────────┬──────────────┬──────────────┬────────┐
 │ TEAM MEMBER      │ ROLE            │ TITLE    │ ACTIVE DEALS │ LAST ACTIVE  │ STATUS │
 ├──────────────────┼─────────────────┼──────────┼──────────────┼──────────────┼────────┤
 │ Fenar            │ [ Admin 🛡️ ]     │ Partner  │ 12 (₹38.5L)  │ 2 mins ago   │ Active │
 │ Zayd Al-Hadi     │ [ Manager 👔 ]  │ Head Sls │ 28 (₹94.0L)  │ 14 mins ago  │ Active │
 │ Anita Nair       │ [ Executive 💼 ]│ Sr. Rep  │ 18 (₹42.0L)  │ 1 hour ago   │ Active │
 │ Marcus Vance     │ [ Suspended ⚠️] │ Jr. Rep  │ 0 (Offboard) │ Oct 12, 2026 │ Offbd  │
 └──────────────────┴─────────────────┴──────────┴──────────────┴──────────────┴────────┘
```

#### 2.4.1 Roster Table Architecture and Dynamic Workload Aggregation
The roster table renders a consolidated view of organizational personnel by joining `public.profiles` with aggregated pipeline metrics from `public.leads`:
* **Identity Column**: Avatar with initials fallback, Full Name, Corporate Email, and Phone number.
* **Role Badge**: Distinct styling based on role token:
  * `Admin`: Obsidian badge with hairline orange border (`border: 1px solid #ff6100`, text: `#ff6100`).
  * `Sales Manager`: Slate blue badge (`bg: #1e293b`, text: `#93c5fd`).
  * `Sales Executive`: Emerald badge (`bg: #064e3b`, text: `#6ee7b7`).
  * `Viewer`: Muted zinc badge (`bg: #27272a`, text: `#a1a1aa`).
* **Active Deals Count**: Live relational count of leads assigned to the user where status is neither `Converted` nor `Lost`. Clicking the badge filters the pipeline view directly to that rep's deals.
* **Status Indicator**: Pulse dot indicating `Active` (Emerald) or `Suspended` (Crimson).

#### 2.4.2 Temporary Credential Distribution Security Protocol
When a new team user is provisioned via `createTeamUser`:
1. The temporary password is displayed strictly **once** within a high-security visual modal overlay.
2. The modal incorporates a "Copy Credentials" button that copies a formatted text payload (`Email: ... | Temp Password: ... | Login URL: ...`) to the administrator's system clipboard.
3. The clipboard is purged or cleared from browser memory after 60 seconds.
4. Credentials are never sent via unencrypted standard email, preventing interception over unauthenticated SMTP relays.

#### 2.4.3 First-Login Password Reset Interception (`must_change_password`)
When a provisioned user authenticates for the first time using their temporary credentials:
1. Edge Middleware checks `user.user_metadata.must_change_password` or verifies `profiles.must_change_password === true`.
2. The user is redirected immediately to `/admin/reset-password`, preventing access to `/admin` or any CRM data.
3. The reset form enforces password complexity requirements ($\ge 12$ characters, upper, lower, numeric, symbol). Upon submission, `must_change_password` is toggled to `false`, and the user is granted full access to their scoped CRM dashboard.

#### 2.4.4 Immutable Team Audit Logging Schema
Every administrative action executed within the governance console commits an append-only row to `public.team_audit_logs`. This table is governed by RLS policies that permit `SELECT` for administrators and completely deny `UPDATE` or `DELETE` to all roles, guaranteeing evidentiary integrity.

```sql
CREATE TABLE IF NOT EXISTS public.team_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    actor_email TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'USER_CREATED',
        'ROLE_UPDATED',
        'STATUS_UPDATED',
        'PASSWORD_RESET_TRIGGERED',
        'USER_OFFBOARDED_SUSPENDED',
        'LEADS_BATCH_REASSIGNED'
    )),
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    payload_before JSONB,
    payload_after JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Read-only for admins; absolute prevention of modifications
ALTER TABLE public.team_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select" ON public.team_audit_logs
FOR SELECT TO authenticated
USING (public.current_user_role() = 'admin');

CREATE POLICY "audit_logs_no_update" ON public.team_audit_logs
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "audit_logs_no_delete" ON public.team_audit_logs
FOR DELETE TO authenticated
USING (false);
```

---

## 3. Offboarding Protocol & Automated Lead Reassignment Wizard (Phase 4 Specification)

### 3.1 Immediate Session Revocation & Account Suspension

When an employee departs the agency or undergoes a role transition, security protocols mandate that their platform access be terminated immediately to eliminate risk of data exfiltration or client tampering.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EMPLOYEE OFFBOARDING SECURITY SEQUENCE                          │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [Admin Initiates Offboarding for Target Rep]
                    │
                    ▼
 [Step 1: Immediate Token Invalidation]
 supabase.auth.admin.signOut(targetUserId, 'all')
 ──> Invalidates all active refresh tokens in Supabase Auth session store
 ──> Next request from rep's browser immediately fails with 401 Unauthorized
                    │
                    ▼
 [Step 2: Profile Status Suspension]
 UPDATE public.profiles SET status = 'suspended', updated_at = NOW() WHERE id = targetUserId
 ──> Database RLS immediately denies all SELECT/INSERT/UPDATE queries
                    │
                    ▼
 [Step 3: Launch Lead Reassignment Wizard]
 Scan active leads owned by suspended rep (status NOT IN ('Converted', 'Lost'))
 ──> If count > 0: Launch Modal Wizard to select destination rep
 ──> If count === 0: Conclude offboarding and log completion
```

#### 3.1.1 Session Revocation Mechanics: `signOut(targetUserId, 'all')`
Calling `supabase.auth.admin.signOut(targetUserId, 'all')` instructs the Supabase Auth engine to revoke every active session identifier bound to that user UUID. Even if the departed employee retains a valid client cookie in their local browser, the next HTTP request evaluated by `supabase.auth.getUser()` in Edge Middleware will fail verification against the auth engine, triggering immediate cookie destruction and redirection away from the admin portal.

#### 3.1.2 Profile Status Transition to `suspended`
Simultaneously, `profiles.status` is set to `'suspended'`. Because RLS policies evaluate `public.current_user_role()` and verify that the user's status is `'active'`, any in-flight database query executed by the suspended account is rejected at the PostgreSQL storage engine layer with zero records returned.

---

### 3.2 Interactive Lead Reassignment Wizard Architecture

A primary operational failure mode in agency CRM systems occurs when offboarded representatives leave active, high-value client deals assigned to their inactive accounts. Under strict RLS policies, these leads become orphaned—hidden from new sales reps and neglected until clients churn. The Lead Reassignment Wizard guarantees that zero deals are ever left orphaned.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     LEAD REASSIGNMENT WIZARD MODAL WORKFLOW                            │
└────────────────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │ ⚠️ OFFBOARDING & PIPELINE REASSIGNMENT WIZARD: Marcus Vance                         │
 ├──────────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                      │
 │  PORTFOLIO IMPACT ASSESSMENT                                                         │
 │  This representative currently owns 18 Active Deals valued at ₹42,50,000.            │
 │                                                                                      │
 │  Stage Breakdown:                                                                    │
 │  • Negotiation: 4 Deals (₹22,00,000)                                                 │
 │  • Proposal Sent: 6 Deals (₹14,50,000)                                               │
 │  • Qualified: 5 Deals (₹6,00,000)                                                    │
 │  • Contacted: 3 Deals (₹0)                                                           │
 │                                                                                      │
 │  SELECT DESTINATION TEAM MEMBER                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │ Zayd Al-Hadi (Sales Manager) — Currently managing 28 active deals              │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │                                                                                      │
 │  TRANSFER REASON (REQUIRED FOR AUDIT LOGGING)                                        │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │ Full offboarding transfer due to departure on Oct 15, 2026.                     │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │                                                                                      │
 │  [ Cancel ]                                 [⚡ Execute Atomic Batch Reassignment ]  │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.1 Real-Time Deal Inventory Scan
Before an administrator confirms suspension, the client-side modal invokes a server query calculating the target rep's active portfolio metrics:
* Total Active Lead Count: `COUNT(*) WHERE assigned_to = targetUserId AND status NOT IN ('Converted', 'Lost')`.
* Cumulative Pipeline Value: `SUM(expected_value)`.
* Breakdown by Funnel Stage: Tabulating deals in `Qualified`, `Proposal sent`, and `Negotiation`.
* Overdue Follow-ups Count: Flagging urgent touchpoints requiring immediate triage.

#### 3.2.2 Destination Allocation Options
The administrator can route the orphaned leads via three distinct strategies:
1. **Consolidated Reassignment**: Transfer all active deals to a single senior account executive or Sales Manager.
2. **Holding Pool Reassignment**: Transfer deals to the unassigned managerial pool (`assigned_to = NULL` or assigned to the agency Director) for phased distribution.
3. **Phased / Selective Reassignment**: Filtering deals by value tier and distributing top-tier deals to senior personnel.

---

### 3.3 Atomic Batch Reassignment Transaction & Immutable Lead Audit Trails

To ensure complete ACID transactional integrity, batch lead reassignment is executed within a dedicated PostgreSQL stored procedure. If an unexpected database failure, network drop, or constraint violation occurs halfway through transferring 50 leads, the entire transaction is rolled back, preventing partial or corrupt state.

```sql
-- Stored Procedure: Atomic Batch Reassignment with Immutable Lead Activities
CREATE OR REPLACE FUNCTION public.execute_atomic_lead_reassignment(
    p_source_user_id UUID,
    p_destination_user_id UUID,
    p_admin_id UUID,
    p_transfer_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_source_name TEXT;
    v_dest_name TEXT;
    v_affected_lead_ids UUID[];
    v_lead_id UUID;
    v_reassigned_count INT := 0;
BEGIN
    -- 1. Validate Caller is an Active Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_admin_id AND role = 'admin' AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only active administrators can execute batch lead reassignment.'
            USING ERRCODE = 'P0002';
    END IF;

    -- 2. Retrieve representative names for audit trail description
    SELECT full_name INTO v_source_name FROM public.profiles WHERE id = p_source_user_id;
    SELECT full_name INTO v_dest_name FROM public.profiles WHERE id = p_destination_user_id;

    -- 3. Lock active lead rows to prevent concurrent race condition updates
    SELECT ARRAY_AGG(id) INTO v_affected_lead_ids
    FROM public.leads
    WHERE assigned_to = p_source_user_id
      AND status NOT IN ('Converted', 'Lost')
    FOR UPDATE;

    IF v_affected_lead_ids IS NULL OR ARRAY_LENGTH(v_affected_lead_ids, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'reassigned_count', 0,
            'message', 'No active leads required reassignment.'
        );
    END IF;

    -- 4. Batch update lead assignment
    UPDATE public.leads
    SET assigned_to = p_destination_user_id,
        updated_at = NOW()
    WHERE id = ANY(v_affected_lead_ids);

    GET DIAGNOSTICS v_reassigned_count = ROW_COUNT;

    -- 5. Insert immutable audit activity on EVERY affected lead
    FOREACH v_lead_id IN ARRAY v_affected_lead_ids
    LOOP
        INSERT INTO public.lead_activities (
            lead_id,
            actor_id,
            activity_type,
            notes,
            created_at
        ) VALUES (
            v_lead_id,
            p_admin_id,
            'Lead Reassigned',
            format('Commercial ownership transferred from %s to %s. Reason: %s', 
                   v_source_name, v_dest_name, p_transfer_reason),
            NOW()
        );
    END LOOP;

    -- 6. Log system event in team audit logs
    INSERT INTO public.team_audit_logs (
        actor_id,
        actor_email,
        action_type,
        target_user_id,
        payload_after,
        created_at
    ) VALUES (
        p_admin_id,
        (SELECT email FROM public.profiles WHERE id = p_admin_id),
        'LEADS_BATCH_REASSIGNED',
        p_source_user_id,
        jsonb_build_object(
            'source_user_id', p_source_user_id,
            'destination_user_id', p_destination_user_id,
            'reassigned_count', v_reassigned_count,
            'lead_ids', v_affected_lead_ids,
            'reason', p_transfer_reason
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'reassigned_count', v_reassigned_count,
        'affected_lead_ids', v_affected_lead_ids
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Public Webhook Ingestion Engine & Deduplication Pipeline (Phase 5 Specification)

### 4.1 `/api/sales-funnel/ingest` Route Handler Architecture

The public ingestion engine serves as the high-throughput bridge connecting client touchpoints across the live digital estate directly into the Marca Ubi CRM database. It operates with zero dependencies on third-party integration platforms (such as Zapier or Make), eliminating external points of failure, latency bottlenecks, and recurring subscription costs.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC LEAD INGESTION & DEDUPLICATION PIPELINE                  │
└────────────────────────────────────────────────────────────────────────────────────────┘

  Incoming Lead Submission (POST /api/sales-funnel/ingest)
                           │
                           ▼
  [Layer 1: Security Shield & Bot Traps]
  ├── IP Rate Limiting (Token Bucket: 10 requests / 10 mins per IP)
  ├── Cryptographic Honeypot Check (_hp_company_url_confirm === "")
  └── Payload Body Size Limit (< 64 KB)
                           │
                           ▼
  [Layer 2: Schema Validation & Sanitization]
  ├── Zod Schema Parsing & Field Length Enforcement
  └── XSS HTML Sanitization
                           │
                           ▼
  [Layer 3: International Contact Normalization]
  ├── Email: input.trim().toLowerCase() (RFC-5322 regex)
  └── Phone: International E.164 parsing (+971, +91, +44, +1)
                           │
                           ▼
  [Layer 4: Smart Deduplication State Machine]
  Query Database: SELECT id, status, assigned_to FROM leads WHERE email = $1 OR phone = $2
                           │
           ┌───────────────┴───────────────┐
      Match Found                    No Match Found
           │                               │
           ▼                               ▼
  Evaluate Existing Lead State:      [Create New Lead]
  ├── Converted: Create new linked   ├── Generate ID: LD-XXXX
  │   brief, notify account manager  ├── status = 'New'
  ├── Open/Potential: Append urgent  ├── priority = 'Medium'
  │   activity note, bump priority,  ├── brief_payload = JSONB
  │   reset next_follow_up = NOW()   └── Insert Lead Activity
  └── Lost: Reactivate lead to 'New'               │
           │                                       │
           └───────────────────┬───────────────────┘
                               │
                               ▼
  [Layer 5: Studio Notification Dispatch]
  Dispatch webhook alert (Telegram / Internal Email / Push Notification)
```

#### 4.1.1 Token-Bucket IP Rate-Limiting Engine
To prevent Denial-of-Service (DoS) attacks and malicious script spamming:
* Incoming client IP addresses are extracted from `x-forwarded-for` and `x-real-ip` headers.
* A token-bucket rate limiter tracks submission frequency, allocating a burst capacity of 10 submissions per 10-minute window per IP.
* Excessive requests immediately receive an HTTP 429 Too Many Requests response with a `Retry-After: 600` header.

#### 4.1.2 Cryptographic Honeypot Defense
Frontend forms embed an invisible decoy input field:
```html
<div style="position: absolute; opacity: 0; z-index: -1; pointer-events: none;" aria-hidden="true">
  <input type="text" name="_hp_company_url_confirm" tabIndex="-1" autoComplete="off" />
</div>
```
Legitimate human users do not interact with or populate this hidden field. Automated web crawlers and spam bots indiscriminately fill all inputs. If `_hp_company_url_confirm` contains any value upon ingestion, the route handler immediately short-circuits and returns a simulated HTTP 200 OK (`{ ok: true, status: "received" }`) without performing any database operations, silently discarding the bot submission.

---

### 4.2 Form Ingestion Bindings: `/start-project` Brief Builder & `CompanyProfileModal`

#### 4.2.1 Serialization of `/start-project` 4-Step Brief Builder
The live website's interactive brief builder captures rich multi-dimensional project parameters across four sequential steps. The ingestion handler serializes this complex payload into the relational schema:
* **Contact Details**: Name, corporate email, phone, and Instagram handle mapped to primary `leads` columns.
* **Commercial Metadata**: Project category, primary service required, website URL, and industry sector.
* **`brief_payload` JSONB Serialization**: All unstructured and multi-select choices are stored cleanly in the `brief_payload` JSONB column, including:
  * Selected services array (`services: ['Branding', 'Web Design', '3D Motion']`)
  * Business description & brand positioning statements
  * Budget bracket & target delivery timeline
  * Inspiration links & benchmark URLs
  * Agency representation status (`working_with_agency: boolean`)
  * Showcase permission flag

#### 4.2.2 `CompanyProfileModal` Direct Capture Binding
When prospective clients request the official Marca Ubi Agency Profile document from the homepage modal (`CompanyProfileModal.tsx`), the form submits to the ingestion handler with `source_code = 'MODAL_COMPANY_PROFILE'`. The ingestion engine records the lead, tags the source as `Company profile modal`, and automatically grants the document download token while ensuring zero sales lead loss.

---

### 4.3 International Contact Normalization Standards

Data cleanliness is the bedrock of automated deduplication. Without strict normalization, duplicate records inevitably proliferate (e.g., `user@domain.com` vs `User@Domain.com`, or `+971501234567` vs `050 123 4567`).

#### 4.3.1 RFC-5322 Lowercase Email Normalization
Email addresses undergo strict standard sanitization:
1. Stripping leading and trailing whitespace (`input.trim()`).
2. Transformation to lowercase (`input.toLowerCase()`).
3. Domain part validation according to RFC-5322 standards.
4. Validation rejection for disposable / temporary domain suffixes if configured.

#### 4.3.2 International E.164 Phone Normalization
Because Marca Ubi operates across the United Arab Emirates, India, the United Kingdom, and the United States, phone inputs arrive in disparate regional formats. The normalization engine parses and formats all numbers into the international E.164 standard (`+[CountryCode][SubscriberNumber]`):
* **United Arab Emirates (+971)**: Strips leading trunk `0`, resolves mobile prefixes (`50`, `52`, `54`, `55`, `56`, `58`), resulting in `+97150XXXXXXX`.
* **India (+91)**: Strips leading trunk `0`, ensures 10-digit mobile subscriber format starting with 6, 7, 8, or 9, resulting in `+9198XXXXXXXX`.
* **United Kingdom (+44)**: Strips leading trunk `0`, converts mobile `07XXX` to `+447XXXXXXXXX`.
* **United States (+1)**: Normalizes 10-digit North American Numbering Plan numbers to `+1XXXXXXXXXX`.

```typescript
export function normalizePhoneNumber(rawPhone: string, defaultCountry = "AE"): string {
  if (!rawPhone) return "";
  // Strip all non-digit and non-plus characters
  let cleaned = rawPhone.replace(/[^\d+]/g, "").trim();

  // If already starts with '+', validate length and return
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1);
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return `+${digitsOnly}`;
    }
  }

  // Handle UAE regional numbers (e.g. 050 123 4567 or 501234567)
  if (defaultCountry === "AE") {
    if (cleaned.startsWith("00971")) {
      cleaned = cleaned.slice(5);
    } else if (cleaned.startsWith("971")) {
      cleaned = cleaned.slice(3);
    } else if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    return `+971${cleaned}`;
  }

  // Handle India regional numbers (e.g. 098470 12345)
  if (defaultCountry === "IN") {
    if (cleaned.startsWith("0091")) {
      cleaned = cleaned.slice(4);
    } else if (cleaned.startsWith("91")) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    return `+91${cleaned}`;
  }

  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}
```

---

### 4.4 Smart Deduplication Algorithm & Existing Customer Re-engagement

```typescript
// Core Deduplication Decision Engine inside /api/sales-funnel/ingest
const { data: existingLead } = await supabaseAdmin
  .from("leads")
  .select("id, lead_code, status, assigned_to, contact_name, organization")
  .or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (existingLead) {
  // Case A: Existing Lead is Currently Active in Funnel
  if (!["Converted", "Lost"].includes(existingLead.status)) {
    // 1. Append urgent touchpoint activity
    await supabaseAdmin.from("lead_activities").insert({
      lead_id: existingLead.id,
      actor_id: null, // System event
      activity_type: "Website Re-submission",
      notes: `Prospective client re-submitted inquiry via ${sourceName}. New brief choices merged. Priority elevated to High.`,
      created_at: new Date().toISOString(),
    });

    // 2. Escalate lead priority and reset follow-up timer to immediate
    await supabaseAdmin
      .from("leads")
      .update({
        priority: "High",
        next_follow_up: new Date().toISOString(), // Needs immediate touchpoint
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingLead.id);

    return NextResponse.json({
      ok: true,
      deduplicated: true,
      leadCode: existingLead.lead_code,
      message: "Submission appended to active commercial file.",
    });
  }

  // Case B: Existing Client Returning (Previously Converted)
  if (existingLead.status === "Converted") {
    // Create new linked opportunity with cross-reference to historical lead
    // ensuring sales team treats this as an enterprise repeat-business opportunity
    // ...
  }
}
```

---

## 5. Granular Sprint Work Breakdown Structure (Phases 2, 3, 4, and 5)

To ensure predictable, defect-free production delivery, Phases 2 through 5 are subdivided into eight granular, production-ready engineering sprints. Each sprint specifies objective technical work packages written in full paragraphs, concrete deliverables, security safeguards, and rigorous acceptance criteria.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             GRANULAR SPRINT WORK BREAKDOWN SCHEDULE (PHASES 2, 3, 4, 5)                │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [PHASE 2: AUTH & ROUTE PROTECTION]
 ├── Sprint 2.1: Supabase Auth SSR Foundation, Cookie Infrastructure & Session Engine
 └── Sprint 2.2: Next.js 16 Edge Middleware Route Guard, Role Resolution & Login UI

 [PHASE 3: MULTI-USER PROVISIONING]
 ├── Sprint 3.1: Admin SDK Provisioning Engine, Server Action createTeamUser & RBAC
 └── Sprint 3.2: Team Management Workspace (/admin/team), Credential Modal & Auditing

 [PHASE 4: OFFBOARDING & REASSIGNMENT]
 ├── Sprint 4.1: Rep Offboarding Protocol, Session Revocation & Account Suspension
 └── Sprint 4.2: Lead Reassignment Wizard, Stored Procedure & Activity Backfill

 [PHASE 5: INGESTION & DEDUPLICATION]
 ├── Sprint 5.1: Ingestion API Route, Rate Limiter, Honeypots & Contact Normalization
 └── Sprint 5.2: Client Form Bindings (/start-project & Modal), Deduplication & Alerts
```

---

### Sprint 2.1: Supabase Auth SSR Foundation, Cookie Infrastructure & Session Architecture

#### 1. Objectives
Establish the low-level authentication foundation across the Next.js 16 App Router using `@supabase/ssr`. Ensure secure, stateless session handling via encrypted `HttpOnly` cookies, eliminating reliance on client-side storage while supporting PKCE authentication and automatic token rotation.

#### 2. Detailed Technical Work Packages
* **Package 2.1.1 — Dependency Setup & Environment Secret Validation**:  
  Install `@supabase/supabase-js` and `@supabase/ssr`. Validate and bind the runtime environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Create an environment configuration validator using Zod to assert that required keys are present at build time, preventing runtime boot crashes in production.
* **Package 2.1.2 — Multi-Context Supabase Client Factory**:  
  Architect the unified client factory directory structure under `src/app/lib/supabase/`. Implement `server.ts` utilizing `createServerClient` with the asynchronous `cookies()` store from `next/headers` to support Server Components, Server Actions, and Route Handlers. Implement `client.ts` using `createBrowserClient` for interactive client component islands. Implement `middleware.ts` helper for Next.js Edge runtime response header synchronization.
* **Package 2.1.3 — PKCE Callback Handler & Exchange Route**:  
  Implement the authentication callback route handler at `src/app/api/auth/callback/route.ts`. Intercept incoming authorization code queries (`code`), exchange the code for access and refresh tokens using `supabase.auth.exchangeCodeForSession(code)`, persist the session tokens into chunked `HttpOnly` cookies, and execute a safe redirect to the sanitized destination URL.

#### 3. Concrete Deliverables
* `src/app/lib/supabase/server.ts`: Server-side Supabase client factory.
* `src/app/lib/supabase/client.ts`: Browser-side Supabase client factory.
* `src/app/lib/supabase/middleware.ts`: Edge-compatible cookie adapter.
* `src/app/api/auth/callback/route.ts`: PKCE authorization code exchange handler.
* `src/app/lib/env.ts`: Zod schema validating presence and format of Supabase keys.

#### 4. Edge Cases & Security Safeguards
* **Cookie Chunking Overflow**: High-claim JWTs exceeding 4KB are split across numbered cookies. The adapter must seamlessly assemble and deserialize chunks to prevent corrupted session errors.
* **Clock Skew Tolerance**: Network latency between Next.js servers and Supabase Auth instances can cause premature token expiration errors. Configure a 60-second clock skew margin during session verification.
* **Open Redirect Defense**: The `next` destination query parameter must be strictly checked against relative URI patterns (`/admin*`) to prevent attackers from crafting phishing redirects to external domains.

#### 5. Acceptance Criteria
* [ ] Automated script verifies that cookies are written with `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
* [ ] Attempting to access session tokens via browser console `document.cookie` returns an empty string.
* [ ] PKCE exchange route successfully exchanges an authorization code and sets active session cookies.
* [ ] Token refresh successfully issues a new JWT pair without interrupting the user's active browsing session.

---

### Sprint 2.2: Next.js 16 Edge Middleware Route Guard, Role Resolution & Luxury Admin Login Hardening

#### 1. Objectives
Deploy the Edge Middleware perimeter firewall (`middleware.ts`) to intercept unauthorized requests before page rendering, enforce role-based access control at the edge, and deliver the branded dark luxury `/admin/login` interface with security hardening.

#### 2. Detailed Technical Work Packages
* **Package 2.2.1 — Edge Middleware Perimeter Implementation**:  
  Construct `middleware.ts` at the application root. Intercept requests targeting `/admin/:path*`. Invoke `supabase.auth.getUser()` to cryptographically validate the incoming JWT against the Supabase Auth server. Redirect unauthenticated visitors to `/admin/login?next=[encoded_path]`.
* **Package 2.2.2 — Role-Based Route Gating at the Edge**:  
  Extract role claims from user metadata in the verified JWT. Guard `/admin/team` by asserting that the role matches `admin` or `sales_manager`. Redirect unauthorized roles (`sales_executive`, `viewer`) to `/admin?error=unauthorized_role_access`.
* **Package 2.2.3 — Branded Dark Luxury Login UI**:  
  Build `src/app/admin/login/page.tsx` adhering to Marca Ubi's visual identity. Style the view with `#0b0b0b` obsidian background, `#111111` glassmorphic card container, `1px solid rgba(255,255,255,0.08)` hairline borders, and `#ff6100` CTA button accents. Implement client-side validation with real-time feedback and accessibility hooks.
* **Package 2.2.4 — Security Headers & Brute-Force Rate Limiting**:  
  Configure security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options). Implement an exponential backoff policy for repeated authentication failures, enforcing a 15-minute lockout after 5 consecutive failed attempts.

#### 3. Concrete Deliverables
* `src/middleware.ts`: Production Edge Middleware route protection and cookie synchronization.
* `src/app/admin/login/page.tsx`: Branded dark luxury login page.
* `src/app/admin/login/login.module.scss`: Luxury brand SCSS tokens, glassmorphic styling, and kinetic hover states.
* `next.config.ts`: Security headers configuration block.

#### 4. Edge Cases & Security Safeguards
* **Infinite Redirect Loops**: Prevent redirect loops by ensuring `/admin/login` is explicitly excluded from authentication requirements, and authenticating visitors to `/admin/login` redirect directly to `/admin`.
* **Tampered JWT Detection**: In the event of an altered or malformed JWT cookie, `getUser()` rejects the token. Middleware must clear corrupted cookies and redirect the user cleanly to login.
* **Screen Reader Usability**: Ensure login error alerts are announced dynamically using `aria-live="assertive"`.

#### 5. Acceptance Criteria
* [ ] Unauthenticated `curl` request to `http://localhost:3000/admin` returns HTTP 307 redirecting to `/admin/login?next=%2Fadmin`.
* [ ] Authenticated user with role `sales_executive` navigating to `/admin/team` is rejected and redirected to `/admin`.
* [ ] Authenticated user with role `admin` navigates to `/admin/team` without impedance.
* [ ] Login page passes WCAG 2.1 AA accessibility audit with zero critical violations.
* [ ] Five consecutive invalid password submissions trigger a temporary 15-minute brute-force lockout.

---

### Sprint 3.1: Admin SDK Provisioning Engine, Server Action `createTeamUser` & Multi-Role Governance

#### 1. Objectives
Implement the secure backend provisioning engine allowing administrators to create team accounts from within the CRM. Prevent public self-registration while ensuring transactional integrity between Supabase Auth and the application profiles schema.

#### 2. Detailed Technical Work Packages
* **Package 3.1.1 — Privileged Admin SDK Factory**:  
  Implement `src/app/lib/supabase/admin.ts`. Instantiate the Supabase client using `SUPABASE_SERVICE_ROLE_KEY`. Enforce Node.js runtime isolation to prevent bundling the service role key into client or Edge assets.
* **Package 3.1.2 — Server Action `createTeamUser`**:  
  Build the `createTeamUser` Server Action in `src/app/actions/team.ts`. Parse and validate incoming inputs with Zod (`fullName`, `email`, `role`, `jobTitle`, `phone`, `tempPassword`). Verify that the calling user has an active session and possesses the `admin` role in `public.profiles`.
* **Package 3.1.3 — Two-Phase Transactional Identity Provisioning**:  
  Execute `adminClient.auth.admin.createUser` to generate the Auth identity with `email_confirm: true`. Atomically insert the corresponding record into `public.profiles` (`status = 'active'`, `must_change_password = true`). Implement rollback logic to delete the Auth record if profile insertion fails.
* **Package 3.1.4 — Database-Level Sole-Admin Lockdown Trigger**:  
  Execute migration creating the `check_sole_admin_invariance()` PostgreSQL stored function and bind it to the `trg_protect_sole_admin` trigger on `public.profiles`. Verify that self-demotion or deletion of the last remaining admin is blocked at the database engine layer.

#### 3. Concrete Deliverables
* `src/app/lib/supabase/admin.ts`: Privileged Supabase Admin SDK module.
* `src/app/actions/team.ts`: Server Actions for team user management.
* `supabase/migrations/20261015_sole_admin_trigger.sql`: SQL migration enforcing sole administrator protection.

#### 4. Edge Cases & Security Safeguards
* **Orphaned Auth Identities**: If a network failure occurs after Auth identity creation but prior to profile persistence, the catch block calls `admin.deleteUser()`, preventing orphaned identities.
* **Privilege Escalation via Parameter Manipulation**: Malicious actors tampering with form payloads to submit `role: "admin"` are stopped by Server Action role validation, which permits only verified admins to specify roles.
* **Duplicate Email Handling**: If the submitted email already exists in `auth.users`, return a clear validation error without leaking sensitive user details.

#### 5. Acceptance Criteria
* [ ] Non-admin user invoking `createTeamUser` receives a `"Privilege Escalation Blocked"` security exception.
* [ ] Admin successfully provisions a new `sales_executive` account; new user record appears in `auth.users` and `public.profiles`.
* [ ] Attempting to delete or demote the only active administrator in the database triggers SQL exception `P0001`.
* [ ] Public self-registration endpoint is completely disabled in Supabase configuration.

---

### Sprint 3.2: Team Management Workspace (`/admin/team`), Temporary Credential Security & Audit Logging

#### 1. Objectives
Deliver the responsive `/admin/team` dashboard view, featuring the interactive team roster table, sliding user provisioning drawer, temporary credential distribution modal, and immutable audit logging.

#### 2. Detailed Technical Work Packages
* **Package 3.2.1 — Team Roster Page & Aggregation Query**:  
  Build `src/app/admin/team/page.tsx` as a Next.js Server Component. Fetch personnel profiles joined with active deal counts from `public.leads`. Render the roster grid with full name, role badge, job title, active deals count, status dot, and action menu.
* **Package 3.2.2 — Add Team Member Drawer Component**:  
  Create the slide-out drawer component `AddTeamMemberDrawer.tsx`. Implement form fields with instant client-side validation, password generator generating 16-character high-entropy temporary passwords, and role selection dropdown.
* **Package 3.2.3 — One-Time Credential Reveal Modal**:  
  Build `CredentialRevealModal.tsx`. Display the generated credentials in a secure, high-contrast modal dialog. Implement a single-click "Copy Credentials" button that wipes the clipboard from memory after 60 seconds.
* **Package 3.2.4 — Team Audit Logging & First-Login Reset Interception**:  
  Integrate logging hooks writing to `public.team_audit_logs` on user creation, role modification, or account suspension. Implement first-login interception redirecting users with `must_change_password: true` to the `/admin/reset-password` workflow.

#### 3. Concrete Deliverables
* `src/app/admin/team/page.tsx`: Server Component rendering team roster.
* `src/app/admin/team/components/TeamRosterTable.tsx`: Interactive client data table.
* `src/app/admin/team/components/AddTeamMemberDrawer.tsx`: Slide-out provisioning drawer.
* `src/app/admin/team/components/CredentialRevealModal.tsx`: Secure one-time credential modal.
* `src/app/admin/reset-password/page.tsx`: Mandatory initial password change interface.

#### 4. Edge Cases & Security Safeguards
* **Accidental Drawer Dismissal**: If the administrator accidentally clicks outside the drawer while typing, display an unsaved changes confirmation prompt before discarding inputs.
* **Credential Exposure**: Prevent temporary passwords from being persisted in browser `localStorage` or URL query parameters.
* **Audit Trail Immutability**: Enforce PostgreSQL RLS rules preventing `UPDATE` and `DELETE` queries on `public.team_audit_logs`.

#### 5. Acceptance Criteria
* [ ] Team roster table renders all team profiles with accurate active deal counts.
* [ ] Administrator can open the drawer, fill the form, and provision a user in under 10 seconds.
* [ ] Temporary credentials appear once in the modal overlay and can be copied cleanly.
* [ ] Provisioned user logging in with temporary credentials is automatically redirected to `/admin/reset-password`.
* [ ] Audit log record is created in `public.team_audit_logs` for every provisioning operation.

---

### Sprint 4.1: Rep Offboarding Protocol, Session Revocation & Account Suspension Engine

#### 1. Objectives
Implement the technical offboarding protocol that instantly terminates active sessions and suspends database permissions for departing sales representatives, preventing unauthorized data access.

#### 2. Detailed Technical Work Packages
* **Package 4.1.1 — Server Action `suspendTeamUser`**:  
  Construct `suspendTeamUser(targetUserId: string)` in `src/app/actions/team.ts`. Verify caller is an active administrator. Prevent an administrator from suspending their own account.
* **Package 4.1.2 — Instant Token Invalidation via Supabase Admin SDK**:  
  Call `adminClient.auth.admin.signOut(targetUserId, 'all')`. Verify that all issued refresh tokens for the target user are invalidated within the Supabase Auth database.
* **Package 4.1.3 — Database Status Transition & Edge Guard Verification**:  
  Update `public.profiles` setting `status = 'suspended'` and updating `updated_at`. Ensure that the user's role permissions are immediately revoked across all PostgreSQL RLS policies.
* **Package 4.1.4 — Offboarding Audit Trail Logging**:  
  Commit an audit event to `public.team_audit_logs` recording the suspension event, executing admin UUID, target user UUID, timestamp, and optional deactivation notes.

#### 3. Concrete Deliverables
* `src/app/actions/team.ts`: Enhanced with `suspendTeamUser` Server Action.
* `src/app/admin/team/components/SuspendUserModal.tsx`: Confirmation modal with impact warning.
* `supabase/migrations/20261015_offboarding_policies.sql`: RLS update asserting `status = 'active'` for data modifications.

#### 4. Edge Cases & Security Safeguards
* **Admin Self-Suspension**: The action explicitly blocks `targetUserId === callerUser.id`, preventing accidental administrative self-lockout.
* **Active WebSocket Subscriptions**: Invalidate real-time Supabase subscriptions held by the suspended user by terminating the underlying connection token.
* **Graceful Client Rejection**: The suspended user's next API request returns an explicit session revoked error, redirecting them to `/admin/login?error=account_suspended`.

#### 5. Acceptance Criteria
* [ ] Calling `suspendTeamUser` terminates all active sessions for the target user immediately.
* [ ] Suspended user attempting to refresh or load any `/admin/*` page is redirected to `/admin/login`.
* [ ] Suspended user profile reflects `status = 'suspended'` in the team roster.
* [ ] Audit record is committed to `public.team_audit_logs`.

---

### Sprint 4.2: Lead Reassignment Wizard, Stored Procedure & Activity Backfill

#### 1. Objectives
Build the interactive Lead Reassignment Wizard modal and the atomic PostgreSQL stored procedure to transfer orphaned active deals from suspended reps to designated active team members with complete audit trails.

#### 2. Detailed Technical Work Packages
* **Package 4.2.1 — Active Deal Inventory Scanner**:  
  Implement Server Action `getRepDealInventory(userId: string)`. Query all active deals where `assigned_to = userId` and `status NOT IN ('Converted', 'Lost')`. Calculate total count, cumulative pipeline value (`SUM(expected_value)`), and breakdown by funnel stage.
* **Package 4.2.2 — Lead Reassignment Wizard Modal Component**:  
  Build `LeadReassignmentWizardModal.tsx`. Display impact metrics (e.g. "18 Active Deals valued at ₹42,50,000"). Provide destination team member selection dropdown and mandatory text input for transfer reason.
* **Package 4.2.3 — Atomic Stored Procedure Execution**:  
  Create and deploy PostgreSQL stored procedure `execute_atomic_lead_reassignment`. Inside an ACID transaction, lock affected lead rows (`FOR UPDATE`), update `assigned_to = destinationUserId`, and insert an immutable audit record into `public.lead_activities` for each affected lead.
* **Package 4.2.4 — UI Revalidation & Activity Timeline Verification**:  
  Trigger `revalidatePath('/admin')` and `revalidatePath('/admin/team')` upon transaction completion. Confirm that reassigned leads appear immediately in the destination rep's active workspace with the reassignment note displayed on their detail drawer.

#### 3. Concrete Deliverables
* `supabase/migrations/20261015_atomic_reassignment_proc.sql`: Stored procedure DDL.
* `src/app/admin/team/components/LeadReassignmentWizardModal.tsx`: Interactive wizard modal.
* `src/app/actions/reassignment.ts`: Server Action orchestrating wizard execution.

#### 4. Edge Cases & Security Safeguards
* **Zero Active Deals**: If a departing rep owns zero active deals, the wizard bypasses reassignment and concludes suspension immediately.
* **Reassignment to Inactive User**: Validate that the destination user is `status = 'active'` and possesses a valid sales role (`admin`, `sales_manager`, `sales_executive`).
* **Database Deadlock Prevention**: The stored procedure sorts lead IDs deterministically before acquiring row locks (`FOR UPDATE`), eliminating deadlock risk during concurrent batch operations.

#### 5. Acceptance Criteria
* [ ] Wizard correctly tabulates deal count and monetary valuation for any selected sales rep.
* [ ] Executing batch reassignment transfers all active leads to the destination rep in a single transaction.
* [ ] Converted and Lost leads remain untouched to preserve historical ownership records.
* [ ] Every transferred lead contains a new activity entry in `lead_activities` documenting the transfer reason and administrator identity.

---

### Sprint 5.1: Ingestion API Route, Rate Limiter, Honeypots & Contact Normalization Engine

#### 1. Objectives
Implement the hardened public ingestion route handler at `/api/sales-funnel/ingest`. Enforce token-bucket IP rate limiting, cryptographic honeypots, Zod schema validation, and international contact normalization.

#### 2. Detailed Technical Work Packages
* **Package 5.1.1 — Public Ingestion Route Handler**:  
  Construct `src/app/api/sales-funnel/ingest/route.ts` as an asynchronous Next.js Route Handler (`export async function POST`). Configure payload size limits (< 64KB) to prevent memory exhaustion attacks.
* **Package 5.1.2 — Token-Bucket Rate Limiter**:  
  Implement an in-memory or Redis-backed token bucket rate limiter tracking requests by client IP address. Allocate 10 requests per 10-minute window per IP. Return HTTP 429 Too Many Requests when limits are exceeded.
* **Package 5.1.3 — Cryptographic Honeypot Trap**:  
  Inspect the hidden form field `_hp_company_url_confirm`. If the field contains any value, log a bot interception event and immediately return a simulated HTTP 200 OK without writing to the database.
* **Package 5.1.4 — International Contact Normalization Utilities**:  
  Build `src/app/lib/normalization.ts`. Implement RFC-5322 lowercase email normalization. Implement international E.164 phone normalization supporting UAE (+971), India (+91), UK (+44), and US (+1) dialing formats.

#### 3. Concrete Deliverables
* `src/app/api/sales-funnel/ingest/route.ts`: Public API ingestion route handler.
* `src/app/lib/rateLimit.ts`: Token-bucket rate limiting utility.
* `src/app/lib/normalization.ts`: International phone and email normalization module.
* `src/app/lib/validations/ingest.ts`: Zod schema for incoming lead submissions.

#### 4. Edge Cases & Security Safeguards
* **Spoofed IP Headers**: Inspect `x-forwarded-for` and take the leftmost untrusted IP address to prevent attackers from bypassing rate limits by injecting bogus header values.
* **Invalid Phone Strings**: If a submitted phone number cannot be parsed to E.164, preserve the cleaned digits and flag the lead with `phone_normalization_warning: true` in metadata for manual review.
* **Cross-Site Scripting (XSS)**: Sanitize all text fields by escaping HTML characters (`<`, `>`, `&`, `"`, `'`) before database persistence.

#### 5. Acceptance Criteria
* [ ] Submitting more than 10 requests within 10 minutes from a single IP triggers HTTP 429.
* [ ] Populating the honeypot field returns HTTP 200 but creates zero database records.
* [ ] Phone numbers from UAE (`050 123 4567`) and India (`098470 12345`) normalize accurately to `+971501234567` and `+919847012345`.
* [ ] Email addresses normalize to trimmed, lowercase strings.

---

### Sprint 5.2: Client Form Bindings (`/start-project` & Modal), Deduplication & Alerts

#### 1. Objectives
Bind the live `/start-project` 4-step brief builder and `CompanyProfileModal` to the ingestion route handler. Deploy the smart deduplication state machine and internal notification alerts.

#### 2. Detailed Technical Work Packages
* **Package 5.2.1 — `/start-project` Form Binding**:  
  Update `ProjectForm.tsx` to submit payload to `/api/sales-funnel/ingest`. Serialize the multi-step responses (services array, business description, budget tier, timeline, benchmark links) into the `brief_payload` JSONB column.
* **Package 5.2.2 — `CompanyProfileModal` Form Binding**:  
  Update `CompanyProfileModal.tsx` to submit to `/api/sales-funnel/ingest`. Map name, email, phone, business type, and message into CRM lead columns, setting `source_code = 'MODAL_COMPANY_PROFILE'`.
* **Package 5.2.3 — Smart Deduplication State Machine**:  
  Implement the deduplication query checking for existing matching `email` or `phone`. If an active lead exists, append an urgent activity note, elevate priority to `High`, and reset `next_follow_up = NOW()` instead of creating a duplicate lead. If the lead was previously `Lost`, reactivate it to `New`.
* **Package 5.2.4 — Studio Alert Dispatch Bridge**:  
  Implement an asynchronous notification dispatcher triggering an internal webhook (Telegram bot / Slack / internal email) upon successful lead ingestion, including Lead ID, Client Name, Company, Source, and Estimated Deal Value.

#### 3. Concrete Deliverables
* Updated `src/app/components/ProjectForm/ProjectForm.tsx`: Bound to CRM ingestion API.
* Updated `src/app/components/Hero/CompanyProfileModal.tsx`: Bound to CRM ingestion API.
* `src/app/lib/deduplication.ts`: Deduplication state machine logic.
* `src/app/lib/notifications.ts`: Webhook notification dispatcher.

#### 4. Edge Cases & Security Safeguards
* **Network Interruption During Form Submission**: Implement client-side submission retry logic with exponential backoff and unique `idempotency_key` headers to prevent double-submissions.
* **Concurrent Duplicate Submissions**: Leverage PostgreSQL unique index locks or `SERIALIZABLE` isolation during the deduplication query to avoid race conditions.
* **External Webhook Latency**: Execute notification dispatches asynchronously after responding to the client, guaranteeing client form submission response times under 600ms.

#### 5. Acceptance Criteria
* [ ] Submitting the 4-step brief on `/start-project` creates a new lead (`LD-XXXX`) with structured `brief_payload` JSONB within 600ms.
* [ ] Submitting the company profile modal captures the lead and initiates the PDF download.
* [ ] Re-submitting an existing lead's email appends an activity note and sets `next_follow_up = NOW()` without duplicating records.
* [ ] Internal notification webhook fires successfully with lead summary payload.
