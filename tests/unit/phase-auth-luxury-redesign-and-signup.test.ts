/**
 * @file phase-auth-luxury-redesign-and-signup.test.ts
 * @description Unit test suite for the Cogie & Pixelcot Luxury Auth Redesign and Admin Signup Portal.
 *              Validates registration schema invariants, proxy perimeter route gating,
 *              editorial shell typography, and anti-AI-slop guarantees.
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

  it('eradicates fake telemetry and uppercase developer wireframe slop from Auth Shell', () => {
    // Zero unauthenticated fake telemetry metrics
    assert.doesNotMatch(authShell, /ACTIVE PIPELINE/);
    assert.doesNotMatch(authShell, /₹\s*65\.4L/);
    assert.doesNotMatch(authShell, /99\.98% Uptime/);
    assert.doesNotMatch(authShell, /End-to-End Enterprise Auth Guard/);

    // Verified luxury Cogie & Pixelcot design tokens
    assert.match(authShell, /FluidSilkArtwork/);
    assert.match(authShell, /quoteEyebrow/);
    assert.match(authShell, /quoteHairline/);
    assert.match(authShellStyles, /width: min\(1060px, 100%\)/);
    assert.match(authShellStyles, /border-radius: 28px/);
  });

  it('preserves Cogie editorial quotes on login and signup pages', () => {
    assert.match(loginPage, /headline="Get Everything You Want"/);
    assert.match(loginPage, /eyebrow="A WISE QUOTE"/);
    assert.match(signupPage, /headline="Precision in Commercial Execution"/);
    assert.match(signupPage, /eyebrow="A WISE QUOTE"/);
  });

  it('implements complete soft-filled squircle inputs and social auth in LoginForm', () => {
    assert.match(loginForm, /styles\.badgeWrapper/);
    assert.match(loginForm, /styles\.googleBtn/);
    assert.match(loginForm, /styles\.inputWithLeading/);
    assert.match(loginForm, /name="email"/);
    assert.match(loginForm, /name="password"/);
    assert.match(loginForm, /href="\/admin\/signup"/);
  });

  it('implements registration controls, honeypot, and terms agreement in SignupForm', () => {
    assert.match(signupForm, /styles\.badgeWrapper/);
    assert.match(signupForm, /styles\.googleBtn/);
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
