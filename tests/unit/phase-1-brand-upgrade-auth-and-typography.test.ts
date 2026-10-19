/**
 * @file tests/unit/phase-1-brand-upgrade-auth-and-typography.test.ts
 * @description Dedicated Unit Test Suite for Phase 1: Brand Soul, Typography & Authentication Portal Overhaul.
 *              Validates authentic logo coloration, eradication of Courier New typewriter font leak,
 *              modern luxury Obsidian button tokens, and clean human SaaS copy.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeRedirectUrl } from '../../src/app/lib/auth-redirect';
import { ResetPasswordSchema } from '../../src/app/lib/team-schemas';

describe('Phase 1 Brand Upgrade: Authentication Portal & Typography Hygiene Suite', () => {
  const loginScssPath = path.resolve(process.cwd(), 'src/app/admin/login/login.module.scss');
  const loginFormPath = path.resolve(process.cwd(), 'src/app/admin/login/LoginForm.tsx');
  const resetScssPath = path.resolve(process.cwd(), 'src/app/admin/reset-password/reset-password.module.scss');
  const resetFormPath = path.resolve(process.cwd(), 'src/app/admin/reset-password/ResetPasswordForm.tsx');
  const resetPagePath = path.resolve(process.cwd(), 'src/app/admin/reset-password/page.tsx');
  const workloadScssPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/ManagerWorkloadCard.module.scss');
  const tokensScssPath = path.resolve(process.cwd(), 'src/app/admin/styles/tokens.scss');

  describe('1. Brand Soul & Authentic Logo Coloration', () => {
    it('verifies login.module.scss permanently removes filter: brightness(0) to preserve brand colors', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.strictEqual(content.includes('filter: brightness(0)'), false);
      assert.strictEqual(content.includes('filter: brightness(0);'), false);
    });

    it('verifies reset-password.module.scss permanently removes filter: brightness(0)', () => {
      const content = fs.readFileSync(resetScssPath, 'utf8');
      assert.strictEqual(content.includes('filter: brightness(0)'), false);
      assert.strictEqual(content.includes('filter: brightness(0);'), false);
    });

    it('verifies login page references authentic Marca Ubi logo asset', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8');
      assert.ok(content.includes('/hero/marca-ubi-logo.png'));
    });
  });

  describe('2. Modern Luxury Button Tokens & Geometry', () => {
    it('verifies tokens.scss defines Obsidian #0f172a primary button tokens', () => {
      const content = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(content.includes('--admin-btn-primary-bg: #0f172a;'));
      assert.ok(content.includes('--admin-btn-primary-hover: #1e293b;'));
      assert.ok(content.includes('--admin-btn-primary-text: #ffffff;'));
      assert.ok(content.includes('--admin-accent-brand: #ff6100;'));
    });

    it('verifies login submit button adopts Obsidian #0f172a with 10px radius and 48px height', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.ok(content.includes('background-color: #0f172a;'));
      assert.ok(content.includes('border-radius: 10px;'));
      assert.ok(content.includes('height: 48px;'));
      assert.ok(content.includes('min-height: 48px;'));
      assert.ok(content.includes('transform: scale(0.98);'));
      assert.strictEqual(content.includes('#eefb87'), false);
    });

    it('verifies reset-password submit button adopts Obsidian #0f172a with 10px radius and 48px height', () => {
      const content = fs.readFileSync(resetScssPath, 'utf8');
      assert.ok(content.includes('background-color: #0f172a;'));
      assert.ok(content.includes('border-radius: 10px;'));
      assert.ok(content.includes('height: 48px;'));
      assert.ok(content.includes('min-height: 48px;'));
      assert.ok(content.includes('transform: scale(0.98);'));
      assert.strictEqual(content.includes('#eefb87'), false);
    });
  });

  describe('3. Elimination of Courier New Typewriter Monospace Font Leak', () => {
    it('verifies ManagerWorkloadCard.module.scss metricValue uses primary sans with tabular-nums', () => {
      const content = fs.readFileSync(workloadScssPath, 'utf8');
      const metricValueBlock = content.match(/\.metricValue\s*\{[\s\S]*?\}/)?.[0] || '';
      assert.ok(metricValueBlock.includes('var(--font-admin-sans'));
      assert.ok(metricValueBlock.includes('font-variant-numeric: tabular-nums;'));
      assert.ok(metricValueBlock.includes("font-feature-settings: 'tnum' 1;"));
      assert.strictEqual(metricValueBlock.includes('var(--font-admin-code, monospace)'), false);
    });

    it('verifies ManagerWorkloadCard.module.scss statValue uses primary sans with tabular-nums', () => {
      const content = fs.readFileSync(workloadScssPath, 'utf8');
      const statValueBlock = content.match(/\n\.statValue\s*\{[\s\S]*?\}/)?.[0] || '';
      assert.ok(statValueBlock.includes('var(--font-admin-sans'));
      assert.ok(statValueBlock.includes('font-variant-numeric: tabular-nums;'));
      assert.ok(statValueBlock.includes("font-feature-settings: 'tnum' 1;"));
      assert.strictEqual(statValueBlock.includes('var(--font-admin-code, monospace)'), false);
    });

    it('verifies workload pills utilize tabular numerals and modern typography', () => {
      const content = fs.readFileSync(workloadScssPath, 'utf8');
      assert.ok(content.includes('.pillAmber'));
      assert.ok(content.includes('.pillOrange'));
      assert.ok(content.includes('.pillRed'));
      assert.ok(content.includes('.pillClear'));
    });

    it('verifies tokens.scss defines modern system monospace stack in font-admin-code', () => {
      const content = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(content.includes("ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas"));
    });
  });

  describe('4. Purging Pseudo-Security Copy & Jargon Cleansing', () => {
    it('verifies LoginForm.tsx eliminates fake military/security copy', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8');
      assert.strictEqual(content.includes('Executive Access'), false);
      assert.strictEqual(content.includes('Commercial Authentication'), false);
      assert.strictEqual(content.includes('Authenticate Session'), false);
      assert.strictEqual(content.includes('Protected by enterprise MFA'), false);
      assert.strictEqual(content.includes('TLS 1.3 encryption'), false);
    });

    it('verifies LoginForm.tsx presents clean modern SaaS copy', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8');
      assert.ok(content.includes('Sign in to Marca Ubi'));
      assert.ok(content.includes('Enter your agency credentials to access the CRM console'));
      assert.ok(content.includes('Sign In'));
    });

    it('verifies reset-password page.tsx and form eliminate pseudo-governance copy', () => {
      const pageContent = fs.readFileSync(resetPagePath, 'utf8');
      const formContent = fs.readFileSync(resetFormPath, 'utf8');
      assert.strictEqual(pageContent.includes('Identity Governance Protocol'), false);
      assert.strictEqual(pageContent.includes('Mandatory Initial Credential Rotation'), false);
      assert.ok(pageContent.includes('Set New Password'));
      assert.ok(formContent.includes('Set New Password'));
    });
  });

  describe('5. Security & Authorization Input Boundaries (CWE-601, CWE-284)', () => {
    it('verifies sanitizeRedirectUrl rejects external open redirect vectors (CWE-601)', () => {
      assert.strictEqual(sanitizeRedirectUrl('https://evil.com'), '/admin');
      assert.strictEqual(sanitizeRedirectUrl('http://attacker.com/malicious'), '/admin');
      assert.strictEqual(sanitizeRedirectUrl('//evil.com/phish'), '/admin');
      assert.strictEqual(sanitizeRedirectUrl('/\\evil.com'), '/admin');
      assert.strictEqual(sanitizeRedirectUrl('\\evil.com'), '/admin');
      assert.strictEqual(sanitizeRedirectUrl('/admin\r\nSet-Cookie: evil=1'), '/admin');
    });

    it('verifies sanitizeRedirectUrl preserves valid internal CRM routes with parameters', () => {
      assert.strictEqual(sanitizeRedirectUrl('/admin/deals?bucket=potential'), '/admin/deals?bucket=potential');
      assert.strictEqual(sanitizeRedirectUrl('/admin/leads?assigned_to=123'), '/admin/leads?assigned_to=123');
      assert.strictEqual(sanitizeRedirectUrl('/admin/works'), '/admin/works');
    });

    it('verifies ResetPasswordSchema strictly enforces 12+ character complexity and symbols (CWE-284)', () => {
      const invalidShort = ResetPasswordSchema.safeParse({
        newPassword: 'Short1!',
        confirmPassword: 'Short1!',
      });
      assert.strictEqual(invalidShort.success, false);

      const invalidNoSymbol = ResetPasswordSchema.safeParse({
        newPassword: 'Password123456',
        confirmPassword: 'Password123456',
      });
      assert.strictEqual(invalidNoSymbol.success, false);

      const validPayload = ResetPasswordSchema.safeParse({
        newPassword: 'SecureEnterprisePass2026!#',
        confirmPassword: 'SecureEnterprisePass2026!#',
      });
      assert.strictEqual(validPayload.success, true);
    });
  });
});
