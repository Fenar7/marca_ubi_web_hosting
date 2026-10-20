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

    it('verifies UserProfileDropdown.tsx implements client handleLogout with memory purge & window.location.href', () => {
      const content = fs.readFileSync(userProfileDropdownPath, 'utf8');
      assert.ok(
        content.includes('const handleLogout = async'),
        'UserProfileDropdown must declare handleLogout async handler'
      );
      assert.ok(
        content.includes("window.location.href = res?.redirectTo || '/admin/login'"),
        'handleLogout must perform hard window navigation to completely flush client heap and RSC cache'
      );
      assert.ok(
        content.includes("document.documentElement.removeAttribute('data-admin-route')"),
        'handleLogout must purge data-admin-route attribute before navigation'
      );
      assert.ok(
        content.includes('isLoggingOut'),
        'UserProfileDropdown must track isLoggingOut state to prevent duplicate submissions'
      );
      assert.ok(
        content.includes('aria-busy={isLoggingOut}'),
        'Sign out button must declare aria-busy={isLoggingOut}'
      );
      assert.ok(
        content.includes('onSubmit={handleLogout}'),
        'Logout form must wire onSubmit={handleLogout}'
      );
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
        scssContent.includes('cursor: not-allowed;'),
        'Disabled button must enforce cursor: not-allowed'
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

  describe('4. Input Autofill Shielding & Suspense Semantic Tag Synchronization', () => {
    it('verifies LoginForm.tsx inputs and form declare suppressHydrationWarning', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes('<form action={formAction} className={styles.form} suppressHydrationWarning>'),
        'Login form must declare suppressHydrationWarning'
      );
      assert.ok(
        content.includes('placeholder="name@marcaubi.com"\n              className={styles.input}\n              suppressHydrationWarning'),
        'Email input must declare suppressHydrationWarning'
      );
      assert.ok(
        content.includes('className={`${styles.input} ${styles.inputWithToggle}`}\n              suppressHydrationWarning'),
        'Password input must declare suppressHydrationWarning'
      );
    });

    it('verifies login/page.tsx Suspense fallback header tag identically matches LoginForm.tsx header', () => {
      const pageContent = fs.readFileSync(loginPagePath, 'utf8');
      const formContent = fs.readFileSync(loginFormPath, 'utf8');

      assert.ok(
        pageContent.includes('<header className={styles.brandHeader}>'),
        'Suspense fallback in login/page.tsx must use <header> element'
      );
      assert.ok(
        formContent.includes('<header className={styles.brandHeader}>'),
        'LoginForm.tsx must use <header> element'
      );
      assert.strictEqual(
        pageContent.includes('<div className={styles.brandHeader}>'),
        false,
        'Suspense fallback must not use <div> for brandHeader'
      );
    });
  });
});
