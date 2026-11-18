/**
 * @file tests/unit/hydration-and-logout-lifecycle.test.ts
 * @description Dedicated Unit Test Suite for Zero-Error SSR Hydration & Administrative Logout Lifecycle.
 *              Validates RootLayout extension shielding (suppressHydrationWarning on html and body),
 *              logoutAction session invalidation and memory hygiene, defensive DOM guards,
 *              and Suspense fallback semantic tag synchronization.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('SSR Hydration & Session Logout Lifecycle Suite', () => {
  const rootLayoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
  const authActionPath = path.resolve(process.cwd(), 'src/app/actions/auth.ts');
  const userProfileDropdownPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/UserProfileDropdown.tsx'
  );
  const adminClientProviderPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/AdminRootClientProvider.tsx'
  );
  const loginFormPath = path.resolve(process.cwd(), 'src/app/admin/login/LoginForm.tsx');
  const loginPagePath = path.resolve(process.cwd(), 'src/app/admin/login/page.tsx');

  describe('1. Root Layout Extension Shielding (HTML & Body Hydration Invariants)', () => {
    it('verifies src/app/layout.tsx declares suppressHydrationWarning on <html ...>', () => {
      const content = fs.readFileSync(rootLayoutPath, 'utf8');
      const htmlMatch = content.match(/<html[^>]*>/);
      assert.ok(htmlMatch, 'RootLayout must declare <html>');
      assert.ok(
        htmlMatch[0].includes('suppressHydrationWarning'),
        '<html> must declare suppressHydrationWarning to shield against browser extension attribute injection (WebCRX, etc.)'
      );
    });

    it('verifies src/app/layout.tsx declares suppressHydrationWarning on <body ...>', () => {
      const content = fs.readFileSync(rootLayoutPath, 'utf8');
      const bodyMatch = content.match(/<body[^>]*>/);
      assert.ok(bodyMatch, 'RootLayout must declare <body>');
      assert.ok(
        bodyMatch[0].includes('suppressHydrationWarning'),
        '<body> must declare suppressHydrationWarning to shield against password manager and translation extensions'
      );
    });
  });

  describe('2. Administrative Session Logout Contract & Memory Hygiene', () => {
    it('verifies logoutAction in src/app/actions/auth.ts returns structured LogoutActionResult instead of throwing redirect', () => {
      const content = fs.readFileSync(authActionPath, 'utf8');
      assert.ok(
        content.includes('export interface LogoutActionResult'),
        'Must export LogoutActionResult interface contract'
      );
      assert.ok(
        content.includes('error?: string;'),
        'LogoutActionResult must support optional error property'
      );
      assert.ok(
        content.includes('export async function logoutAction(): Promise<LogoutActionResult>'),
        'logoutAction must be an async function returning LogoutActionResult'
      );
      assert.ok(
        content.includes("redirectTo: '/admin/login'"),
        "logoutAction must resolve redirectTo target '/admin/login'"
      );
      assert.ok(
        content.includes('try {') && content.includes('catch (err: unknown) {'),
        'logoutAction must defensively catch exceptions to prevent unhandled server rejections'
      );
      assert.strictEqual(
        content.includes("redirect('/admin/login')"),
        false,
        'logoutAction must not throw NEXT_REDIRECT in order to allow client hard navigation heap flush'
      );
    });

    it('keeps failed logout retryable and performs hard navigation only after successful invalidation', () => {
      const content = fs.readFileSync(userProfileDropdownPath, 'utf8').replace(/"/g, "'");
      assert.ok(
        /async function signOut\s*\(/.test(content),
        'UserProfileDropdown must declare an asynchronous sign-out handler'
      );
      assert.ok(
        content.includes("window.location.assign(result?.redirectTo || '/admin/login')"),
        'handleLogout must perform hard window navigation to completely flush client heap and RSC cache'
      );
      assert.ok(
        content.includes("document.documentElement.removeAttribute('data-admin-route')"),
        'handleLogout must purge data-admin-route attribute before navigation'
      );
      assert.ok(
        content.includes('if (pending) return'),
        'UserProfileDropdown must track isLoggingOut state to prevent duplicate submissions'
      );
      assert.ok(
        content.includes('aria-busy={pending}'),
        'Sign out button must declare aria-busy={isLoggingOut}'
      );
      assert.ok(
        content.includes('onSubmit={signOut}'),
        'Logout form must wire onSubmit={handleLogout}'
      );
      assert.match(content, /if \(!result.success\)\s*\{[^}]*setError\([^;]+;\s*setPending\(false\);\s*return;/,
        'A resolved server error must retain a visible retry without clearing the session UI');
    });

    it('verifies UserProfileDropdown.module.scss defines disabled styling and guards hover states', () => {
      const scssPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/layout/UserProfileDropdown.module.scss'
      );
      const scssContent = fs.readFileSync(scssPath, 'utf8');
      assert.ok(
        scssContent.includes('&:hover:not(:disabled)'),
        'Hover state must be guarded against disabled state'
      );
      assert.ok(
        scssContent.includes('&:disabled'),
        'Sign-out button must declare &:disabled styles'
      );
      assert.ok(
        /&:disabled\s*\{[^}]*cursor:\s*(?:wait|not-allowed);/.test(scssContent),
        'Pending sign-out must communicate a noninteractive cursor'
      );
    });
  });

  describe('3. Defensive DOM Guard in AdminRootClientProvider', () => {
    it('verifies AdminRootClientProvider guards documentElement access with typeof document checks', () => {
      const content = fs.readFileSync(adminClientProviderPath, 'utf8');
      assert.ok(
        content.includes("if (typeof document === 'undefined') return;"),
        'AdminRootClientProvider must include defensive typeof document checks'
      );
      assert.ok(
        content.includes("document.documentElement.removeAttribute('data-admin-route')"),
        'AdminRootClientProvider cleanup must remove data-admin-route attribute'
      );
    });
  });

  describe('4. Input Autofill Shielding & Suspense Loading Status Semantics', () => {
    it('verifies LoginForm.tsx inputs and form declare suppressHydrationWarning', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes("className={styles.form} aria-describedby={displayError ? 'login-error' : undefined} suppressHydrationWarning"),
        'Login form must declare suppressHydrationWarning'
      );
      assert.ok(
        /<input\b[^>]*id="email"[^>]*suppressHydrationWarning[^>]*\/>/.test(content),
        'Email input must declare suppressHydrationWarning'
      );
      assert.ok(
        /<input\b[^>]*id="password"[^>]*suppressHydrationWarning[^>]*\/>/.test(content),
        'Password input must declare suppressHydrationWarning'
      );
    });

    it('verifies login/page.tsx announces the Suspense fallback as a loading status', () => {
      const pageContent = fs.readFileSync(loginPagePath, 'utf8');

      assert.ok(
        /fallback=\{\s*<div className=\{styles.loadingPanel\} role="status">/.test(pageContent),
        'Suspense fallback must expose a live status while the sign-in form loads'
      );
      assert.ok(
        pageContent.includes('Loading sign-in form'),
        'Suspense status must explain what is loading'
      );
    });
  });
});
