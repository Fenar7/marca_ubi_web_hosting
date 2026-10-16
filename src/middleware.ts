/**
 * @file middleware.ts
 * @description Next.js 16 Edge Middleware perimeter firewall and session synchronization engine.
 *              Intercepts administrative requests, cryptographically authenticates JWT claims against Supabase Auth,
 *              prevents circular redirect loops, propagates mutated session cookies across redirects,
 *              and enforces sub-millisecond edge role-based route gating for governance routes (/admin/team).
 * @module middleware
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/app/lib/supabase/middleware';
import { sanitizeRedirectUrl } from '@/app/lib/auth-redirect';

/**
 * Propagates mutated session cookies from the Supabase session adapter onto a redirection response.
 *
 * Architectural Invariant (Finding M-02 Compliance):
 * When `@supabase/ssr` rotates an access or refresh token during `getUser()`, the updated
 * token cookies reside on `sourceResponse.cookies`. If a raw `NextResponse.redirect()` is returned
 * without copying these cookies, the browser never receives the rotated tokens, leading to
 * dropped sessions and unexpected re-authentications.
 *
 * @param {URL} redirectUrl The target redirection URL.
 * @param {NextResponse} sourceResponse The response containing updated Supabase cookies.
 * @returns {NextResponse} A 307 temporary redirect with session cookies intact.
 */
export function createRedirectResponse(redirectUrl: URL, sourceResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(redirectUrl);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path ?? '/',
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      expires: cookie.expires,
      sameSite: cookie.sameSite ?? 'lax',
      secure: cookie.secure ?? (process.env.NODE_ENV === 'production'),
      httpOnly: cookie.httpOnly ?? true,
    });
  });

  return redirectResponse;
}

/**
 * Next.js Edge Middleware entry point.
 * Intercepts `/admin/:path*` requests before server rendering.
 *
 * Security Lifecycle:
 * 1. Synchronize incoming cookies and cryptographically verify active session with `supabase.auth.getUser()`.
 * 2. Unauthenticated requests to protected `/admin/*` routes redirect to `/admin/login?next=[encoded_path]`.
 * 3. Suspended accounts have credentials invalidated and redirect to `/admin/login?error=account_suspended`.
 * 4. Authenticated requests navigating to `/admin/login` redirect to their sanitized destination or `/admin`.
 * 5. High-Security Governance routes (`/admin/team`) assert caller role in `['admin', 'sales_manager']`.
 *    Unauthorized roles (`sales_executive`, `viewer`) redirect to `/admin?error=unauthorized_role_access`.
 *
 * @param {NextRequest} request The incoming HTTP request.
 * @returns {Promise<NextResponse>} The verified response or route guard redirection.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  // Execute Supabase SSR session synchronization and cryptographic JWT validation
  const { supabaseResponse, user } = await updateSession(request);

  const isAuthRoute = pathname === '/admin/login';
  const isAdminRoute = (pathname === '/admin' || pathname.startsWith('/admin/')) && !isAuthRoute;
  const isTeamGovernanceRoute = pathname === '/admin/team' || pathname.startsWith('/admin/team/');

  // Scenario 1: Unauthenticated visitor attempting to access protected administrative enclaves
  if (isAdminRoute && !user) {
    const rawNext = `${pathname}${search}`;
    const safeNext = sanitizeRedirectUrl(rawNext, '/admin');

    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', safeNext);

    return createRedirectResponse(loginUrl, supabaseResponse);
  }

  // Scenario 2: Authenticated visitor with suspended status
  if (user) {
    const userStatus =
      (user.app_metadata?.status as string | undefined) ||
      (user.user_metadata?.status as string | undefined);

    if (userStatus === 'suspended') {
      // If already on the authentication route, purge session cookies on the response and permit rendering
      if (isAuthRoute) {
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith('sb-') || cookie.name.includes('-auth-token')) {
            supabaseResponse.cookies.delete(cookie.name);
          }
        });
        return supabaseResponse;
      }

      const suspendedUrl = new URL('/admin/login', request.url);
      suspendedUrl.searchParams.set('error', 'account_suspended');

      const redirectResponse = createRedirectResponse(suspendedUrl, supabaseResponse);
      // Dynamically purge all Supabase session cookies (including chunked shards) from browser
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-') || cookie.name.includes('-auth-token')) {
          redirectResponse.cookies.delete(cookie.name);
        }
      });

      return redirectResponse;
    }

    // Scenario 2b: Mandatory First-Login Password Reset Interception
    const mustChangePassword =
      user.app_metadata?.must_change_password === true ||
      user.user_metadata?.must_change_password === true;

    if (mustChangePassword) {
      // Allow user to access the password reset workflow
      if (pathname === '/admin/reset-password') {
        return supabaseResponse;
      }

      // Intercept all other administrative requests and redirect to password reset
      const resetUrl = new URL('/admin/reset-password', request.url);
      return createRedirectResponse(resetUrl, supabaseResponse);
    }

    // If user has already rotated their credentials, prevent re-entering reset-password portal
    if (pathname === '/admin/reset-password') {
      const adminUrl = new URL('/admin', request.url);
      return createRedirectResponse(adminUrl, supabaseResponse);
    }
  }

  // Scenario 3: Authenticated visitor attempting to re-enter login portal
  if (isAuthRoute && user) {
    const rawNext = request.nextUrl.searchParams.get('next');
    let safeNext = sanitizeRedirectUrl(rawNext, '/admin');

    // Prevent circular redirection loop back to the authentication route itself
    if (safeNext === '/admin/login' || safeNext.startsWith('/admin/login')) {
      safeNext = '/admin';
    }

    const destinationUrl = new URL(safeNext, request.url);
    return createRedirectResponse(destinationUrl, supabaseResponse);
  }

  // Scenario 4: Role-based Edge route gating for Team Governance (/admin/team)
  if (isTeamGovernanceRoute && user) {
    const userRole =
      (user.app_metadata?.role as string | undefined) ||
      (user.user_metadata?.role as string | undefined);

    // Only 'admin' and 'sales_manager' are authorized to access team governance routes
    if (userRole !== 'admin' && userRole !== 'sales_manager') {
      const forbiddenUrl = new URL('/admin', request.url);
      forbiddenUrl.searchParams.set('error', 'unauthorized_role_access');

      return createRedirectResponse(forbiddenUrl, supabaseResponse);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
