/** Brand and authentication invariants for the Commercial Desk visual system. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sanitizeRedirectUrl } from '../../src/app/lib/auth-redirect';
import { ResetPasswordSchema } from '../../src/app/lib/team-schemas';

describe('Commercial Desk brand and authentication invariants', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const tokens = read('src/app/admin/styles/tokens.scss');
  const shell = read('src/app/admin/components/auth/AdminAuthShell.tsx');
  const shellStyles = read('src/app/admin/components/auth/AdminAuthShell.module.scss');
  const login = read('src/app/admin/login/LoginForm.tsx');
  const loginPage = read('src/app/admin/login/page.tsx');
  const resetPage = read('src/app/admin/reset-password/page.tsx');

  it('uses the approved restrained red brand accent and shared auth composition', () => {
    assert.match(tokens, /--admin-accent-brand: #ea002a/);
    assert.match(tokens, /--admin-btn-primary-bg: #ea002a/);
    assert.match(shell, /marca-ubi-dark\.svg/);
    assert.match(loginPage, /<AdminAuthShell/);
    assert.match(resetPage, /<AdminAuthShell/);
  });

  it('preserves the horizontal logo ratio and reflows the auth composition on mobile', () => {
    const logo = read('public/images/marca-ubi-dark.svg');
    const viewBox = logo.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    assert.ok(viewBox);
    const ratio = Number(viewBox[1]) / Number(viewBox[2]);
    assert.ok(ratio > 4 && ratio < 5, `Unexpected logo aspect ratio ${ratio}`);
    assert.match(shellStyles, /height: auto/);
    assert.match(shellStyles, /@media \(max-width: 860px\)/);
  });

  it('keeps sign-in language direct and does not imply unsupported security guarantees', () => {
    assert.match(login, /Use your agency account to continue/);
    assert.doesNotMatch(login, /Protected by enterprise MFA|TLS 1\.3 encryption|Authenticate Session/);
    assert.match(login, /role="alert"/);
  });

  it('retains internal redirect validation and password rules', () => {
    assert.equal(sanitizeRedirectUrl('https://evil.example'), '/admin');
    assert.equal(sanitizeRedirectUrl('/admin/works'), '/admin/works');
    assert.equal(ResetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' }).success, false);
    assert.equal(ResetPasswordSchema.safeParse({ newPassword: 'SecureEnterprisePass2026!#', confirmPassword: 'SecureEnterprisePass2026!#' }).success, true);
  });
});
