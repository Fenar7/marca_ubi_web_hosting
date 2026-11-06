/**
 * Authentication design contract and security boundary tests for the shared auth portal.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sanitizeRedirectUrl } from '../../src/app/lib/auth-redirect';
import { ResetPasswordSchema } from '../../src/app/lib/team-schemas';

describe('Commercial Desk authentication portal', () => {
  const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const login = source('src/app/admin/login/LoginForm.tsx');
  const loginPage = source('src/app/admin/login/page.tsx');
  const loginStyles = source('src/app/admin/login/login.module.scss');
  const resetPage = source('src/app/admin/reset-password/page.tsx');
  const resetForm = source('src/app/admin/reset-password/ResetPasswordForm.tsx');
  const resetStyles = source('src/app/admin/reset-password/reset-password.module.scss');
  const shell = source('src/app/admin/components/auth/AdminAuthShell.tsx');
  const shellStyles = source('src/app/admin/components/auth/AdminAuthShell.module.scss');

  it('uses one shared branded split composition for sign-in and mandatory reset', () => {
    assert.match(loginPage, /<AdminAuthShell/);
    assert.match(resetPage, /<AdminAuthShell/);
    assert.match(shell, /marca-ubi-dark\.svg/);
    assert.match(shellStyles, /grid-template-columns/);
    assert.match(shellStyles, /@media \(max-width: 860px\)/);
    assert.match(shellStyles, /height: auto/);
  });

  it('keeps form controls keyboard visible and usable at touch sizes', () => {
    assert.match(loginStyles, /min-height: 48px/);
    assert.match(loginStyles, /:focus-visible/);
    assert.match(loginStyles, /min-height: 44px/);
    assert.match(resetStyles, /min-height: 48px/);
    assert.match(resetStyles, /:focus-visible/);
    assert.match(resetStyles, /width: 42px/);
    assert.doesNotMatch(loginStyles, /overflow:\s*hidden;/);
    assert.doesNotMatch(resetStyles, /overflow:\s*hidden;/);
  });

  it('keeps sign-in errors announced and credential help available', () => {
    assert.match(login, /role="alert"/);
    assert.match(login, /aria-describedby=\{displayError \? 'login-error' : undefined\}/);
    assert.match(login, /mailto:security@marcaubi\.com/);
  });

  it('retains the reset route authorization gate and temporary password flow', () => {
    assert.match(resetPage, /supabase\.auth\.getUser\(\)/);
    assert.match(resetPage, /must_change_password/);
    assert.match(resetForm, /resetTemporaryPassword\(null, formData\)/);
    assert.match(resetForm, /Could not update the password/);
    assert.match(resetStyles, /criteriaList/);
  });

  it('rejects external redirects and accepts internal CRM routes', () => {
    assert.equal(sanitizeRedirectUrl('https://evil.example'), '/admin');
    assert.equal(sanitizeRedirectUrl('//evil.example/path'), '/admin');
    assert.equal(sanitizeRedirectUrl('/admin/deals?bucket=potential'), '/admin/deals?bucket=potential');
  });

  it('enforces the existing password complexity schema', () => {
    assert.equal(ResetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' }).success, false);
    assert.equal(ResetPasswordSchema.safeParse({ newPassword: 'SecureEnterprisePass2026!#', confirmPassword: 'SecureEnterprisePass2026!#' }).success, true);
  });
});
