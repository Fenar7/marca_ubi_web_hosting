/**
 * @file phase-auth-luxury-redesign-and-signup.test.ts
 * @description Unit test suite for the Cogie Full-Display Luxury Auth Redesign and Admin Signup Portal.
 *              Validates registration schema invariants, proxy perimeter route gating,
 *              editorial shell typography, viewport-adaptive scaling, and anti-AI-slop guarantees.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Luxury Auth Redesign & Administrative Signup Portal', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

  const loginForm = read('src/app/admin/login/LoginForm.tsx');
  const loginPage = read('src/app/admin/login/page.tsx');
  const signupForm = read('src/app/admin/signup/SignupForm.tsx');
  const signupPage = read('src/app/admin/signup/page.tsx');
  const authShell = read('src/app/admin/components/auth/AdminAuthShell.tsx');
  const authShellStyles = read('src/app/admin/components/auth/AdminAuthShell.module.scss');
  const proxySource = read('src/proxy.ts');
  const authActions = read('src/app/actions/auth.ts');

  it('enforces Edge Proxy route protection for both login and signup endpoints', () => {
    assert.match(proxySource, /pathname === '\/admin\/login' \|\| pathname === '\/admin\/signup'/);
    assert.match(proxySource, /safeNext === '\/admin\/signup'/);
  });

  it('eradicates fake telemetry, residual status pills, and uppercase developer wireframe slop from Auth Shell', () => {
    // Zero unauthenticated fake telemetry metrics
    assert.doesNotMatch(authShell, /ACTIVE PIPELINE/);
    assert.doesNotMatch(authShell, /₹\s*65\.4L/);
    assert.doesNotMatch(authShell, /99\.98% Uptime/);
    assert.doesNotMatch(authShell, /End-to-End Enterprise Auth Guard/);
    assert.doesNotMatch(authShell, /Commercial Intelligence · Active Telemetry/);
    assert.doesNotMatch(authShell, /v2\.4\.0/);

    // Verified luxury Cogie full-display responsive design tokens
    assert.match(authShell, /FluidSilkArtwork/);
    assert.match(authShell, /quoteEyebrow/);
    assert.match(authShell, /quoteHairline/);
    assert.match(authShellStyles, /clamp\(1040px, 90vw, 1540px\)/);
    assert.match(authShellStyles, /border-radius: 28px/);
  });

  it('enforces authentic Marca Ubi editorial copy and typography on login and signup pages', () => {
    assert.match(loginPage, /headline="Architecting Living Brand Systems"/);
    assert.match(loginPage, /eyebrow="COMMERCIAL INTELLIGENCE"/);
    assert.match(signupPage, /headline="Precision in Commercial Execution"/);
    assert.match(signupPage, /eyebrow="COMMERCIAL GOVERNANCE"/);
  });

  it('guarantees zero generic serif typography (Playfair Display) across all auth desks', () => {
    const loginStyles = read('src/app/admin/login/login.module.scss');
    const signupStyles = read('src/app/admin/signup/signup.module.scss');

    assert.doesNotMatch(loginStyles, /Playfair Display|Didot|Bodoni|Georgia/);
    assert.doesNotMatch(signupStyles, /Playfair Display|Didot|Bodoni|Georgia/);
    assert.doesNotMatch(authShellStyles, /Playfair Display|Didot|Bodoni|Georgia/);
    assert.match(loginStyles, /var\(--font-circular\)/);
    assert.match(signupStyles, /var\(--font-circular\)/);
  });

  it('implements complete soft-filled squircle inputs and eradicates unconfigured social auth in LoginForm', () => {
    // Zero Google OAuth slop
    assert.doesNotMatch(loginForm, /Sign In with Google/);
    assert.doesNotMatch(loginForm, /styles\.googleBtn/);
    assert.doesNotMatch(loginForm, /styles\.badgeWrapper/);

    assert.match(loginForm, /styles\.brandLogo/);
    assert.match(loginForm, /styles\.inputWithLeading/);
    assert.match(loginForm, /name="email"/);
    assert.match(loginForm, /name="password"/);
    assert.match(loginForm, /href="\/admin\/signup"/);
  });

  it('implements registration controls, honeypot, and terms agreement while eradicating social auth in SignupForm', () => {
    // Zero Google OAuth slop
    assert.doesNotMatch(signupForm, /Sign Up with Google/);
    assert.doesNotMatch(signupForm, /styles\.googleBtn/);
    assert.doesNotMatch(signupForm, /styles\.badgeWrapper/);

    assert.match(signupForm, /styles\.brandLogo/);
    assert.match(signupForm, /name="website"/);
    assert.match(signupForm, /name="fullName"/);
    assert.match(signupForm, /name="email"/);
    assert.match(signupForm, /name="password"/);
    assert.match(signupForm, /name="terms"/);
    assert.match(signupForm, /href="\/admin\/login"/);
  });

  it('implements robust signupAction with rate limiting, profile provisioning, and rollback defense', () => {
    assert.match(authActions, /export async function signupAction/);
    assert.match(authActions, /const SignupSchema = z\.object/);
    assert.match(authActions, /checkRateLimit\(rateLimitKey\)/);
    assert.match(authActions, /adminClient\.from\('profiles'\)\.insert/);
    assert.match(authActions, /adminClient\.auth\.admin\.deleteUser\(data\.user\.id\)/);
  });
});
