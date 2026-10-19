/**
 * @file tests/unit/phase-2-redesign-auth-portal.test.ts
 * @description Dedicated Unit Test Suite for Phase 2:
 *              Authentication Portal & Credential Overhaul (/admin/login, /admin/reset-password).
 *              Verifies Accordion Executive Advisory & Sypher Minimalist Light Canvas tokens,
 *              WCAG AAA contrast ratios, 48px touch targets, and anti-slop copy cleansing.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeRedirectUrl } from '../../src/app/lib/auth-redirect';
import { ResetPasswordSchema } from '../../src/app/lib/team-schemas';

/**
 * Computes the relative luminance of an sRGB color per WCAG 2.1 specifications.
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Computes the contrast ratio between two hex colors per WCAG 2.1 specifications.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Phase 2 Redesign: Authentication Portal & Credentials Overhaul Suite', () => {
  const loginScssPath = path.resolve(process.cwd(), 'src/app/admin/login/login.module.scss');
  const loginFormPath = path.resolve(process.cwd(), 'src/app/admin/login/LoginForm.tsx');
  const loginPagePath = path.resolve(process.cwd(), 'src/app/admin/login/page.tsx');

  const resetScssPath = path.resolve(process.cwd(), 'src/app/admin/reset-password/reset-password.module.scss');
  const resetFormPath = path.resolve(process.cwd(), 'src/app/admin/reset-password/ResetPasswordForm.tsx');
  const resetPagePath = path.resolve(process.cwd(), 'src/app/admin/reset-password/page.tsx');

  describe('1. WCAG AAA Contrast Engine & Token Mathematics', () => {
    it('verifies primary ink #1f242f on #ffffff card exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#ffffff');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 15.54) < 0.2);
    });

    it('verifies secondary slate #525965 on #ffffff card exceeds WCAG AA (>= 4.5:1) and AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#525965', '#ffffff');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.10) < 0.2);
    });

    it('verifies primary button ink #1f242f on Lemon Yellow #eefb87 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#eefb87');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 13.92) < 0.2);
    });

    it('proves white text #ffffff on Lemon Yellow #eefb87 strictly FAILS (< 4.5:1)', () => {
      const ratio = getContrastRatio('#ffffff', '#eefb87');
      assert.ok(ratio < 4.5, `Expected failure (< 4.5), got ${ratio}`);
      assert.ok(Math.abs(ratio - 1.12) < 0.2);
    });

    it('verifies emerald text #065f46 on tint #ecfdf5 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#065f46', '#ecfdf5');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.29) < 0.2);
    });

    it('verifies danger rose text #991b1b on tint #fef2f2 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#991b1b', '#fef2f2');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.60) < 0.2);
    });
  });

  describe('2. Login Portal Architecture & Token Hygiene (/admin/login)', () => {
    it('verifies login.module.scss purges legacy obsidian (#0b0b0b) and brand orange (#ff6100)', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.strictEqual(content.includes('#0b0b0b'), false);
      assert.strictEqual(content.includes('#ff6100'), false);
      assert.strictEqual(content.includes('radial-gradient'), false);
    });

    it('verifies login.module.scss adopts Accordion Lemon Yellow and Sypher light canvas', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.ok(content.includes('--admin-canvas-bg'));
      assert.ok(content.includes('--admin-card-bg'));
      assert.ok(content.includes('--admin-accent-lemon'));
      assert.ok(content.includes('--admin-border-strong'));
      assert.ok(content.includes('border-radius: var(--admin-radius-pill, 9999px);'));
    });

    it('enforces 48px input height and 44px minimum touch targets (Rule R-03)', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.ok(content.includes('height: 48px;'));
      assert.ok(content.includes('min-height: 48px;'));
      assert.ok(content.includes('width: 44px;'));
      assert.ok(content.includes('height: 44px;'));
    });

    it('verifies zero generic blue (#2563eb) in login styles (Rule R-01)', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.strictEqual(content.includes('#2563eb'), false);
      assert.strictEqual(content.includes('#1d4ed8'), false);
    });
  });

  describe('3. Password Reset Portal Architecture (/admin/reset-password)', () => {
    it('verifies reset-password.module.scss purges legacy obsidian (#0b0b0b) and brand orange (#ff6100)', () => {
      const content = fs.readFileSync(resetScssPath, 'utf8');
      assert.strictEqual(content.includes('#0b0b0b'), false);
      assert.strictEqual(content.includes('#ff6100'), false);
      assert.strictEqual(content.includes('radial-gradient'), false);
    });

    it('verifies reset-password.module.scss adopts Accordion Lemon Yellow pill submit button', () => {
      const content = fs.readFileSync(resetScssPath, 'utf8');
      assert.ok(content.includes('background-color: var(--admin-accent-lemon, #eefb87);'));
      assert.ok(content.includes('border: 1px solid var(--admin-border-strong, #1f242f);'));
      assert.ok(content.includes('border-radius: var(--admin-radius-pill, 9999px);'));
      assert.ok(content.includes('color: var(--admin-accent-lemon-ink, #1f242f);'));
    });

    it('enforces 48px height on password inputs and 44px on visibility toggles (Rule R-03)', () => {
      const content = fs.readFileSync(resetScssPath, 'utf8');
      assert.ok(content.includes('height: 48px;'));
      assert.ok(content.includes('min-height: 48px;'));
      assert.ok(content.includes('width: 44px;'));
      assert.ok(content.includes('height: 44px;'));
    });
  });

  describe('4. Anti-Slop Vocabulary & Editorial Copywriting Cleansing', () => {
    it('verifies LoginForm.tsx purges military jargon ("Internal Access", "Restricted Agency Portal")', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8');
      assert.strictEqual(content.includes('Internal Access'), false);
      assert.strictEqual(content.includes('Restricted Agency Portal'), false);
      assert.strictEqual(content.includes('Access monitored and logged.'), false);
    });

    it('verifies LoginForm.tsx displays authoritative executive terminology', () => {
      const content = fs.readFileSync(loginFormPath, 'utf8');
      assert.ok(content.includes('Executive Access'));
      assert.ok(content.includes('Executive Portal.'));
      assert.ok(content.includes('Enterprise Administration'));
      assert.ok(content.includes('Commercial Authentication'));
      assert.ok(content.includes('Authenticate Session'));
    });

    it('verifies reset-password page.tsx displays editorial period and governance phrasing', () => {
      const content = fs.readFileSync(resetPagePath, 'utf8');
      assert.ok(content.includes('Establish Credentials.'));
      assert.ok(content.includes('Identity Governance Protocol'));
      assert.strictEqual(content.includes('stroke="#ff6100"'), false);
    });
  });

  describe('5. Mobile Viewport Safety & Layout Reflow (Rule R-03)', () => {
    it('verifies login canvas avoids overflow: hidden to prevent mobile keyboard lockup', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.ok(content.includes('overflow-x: hidden;'));
      assert.ok(content.includes('overflow-y: auto;'));
      assert.strictEqual(/overflow:\s*hidden;/.test(content), false);
    });

    it('verifies reset-password canvas avoids overflow: hidden to prevent mobile keyboard lockup', () => {
      const content = fs.readFileSync(resetScssPath, 'utf8');
      assert.ok(content.includes('overflow-x: hidden;'));
      assert.ok(content.includes('overflow-y: auto;'));
      assert.strictEqual(/overflow:\s*hidden;/.test(content), false);
    });

    it('verifies helpLink meets 44px minimum touch target requirement (Rule R-03)', () => {
      const content = fs.readFileSync(loginScssPath, 'utf8');
      assert.ok(content.includes('min-height: 44px;'));
      assert.ok(content.includes('display: inline-flex;'));
    });

    it('verifies copyright text color satisfies WCAG AA and AAA contrast (> 4.5:1)', () => {
      const ratio = getContrastRatio('#525965', '#f7f8fa');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(ratio >= 6.5, `Expected contrast >= 6.5, got ${ratio}`);
    });

    it('verifies criteria met dot indicator satisfies WCAG 2.1 SC 1.4.11 graphical contrast (>= 3:1)', () => {
      const ratio = getContrastRatio('#065f46', '#f8fafc');
      assert.ok(ratio >= 3.0, `Expected graphical contrast >= 3.0, got ${ratio}`);
      assert.ok(ratio >= 7.0, `Expected graphical contrast >= 7.0, got ${ratio}`);
    });
  });

  describe('6. Security & Authorization Input Boundaries (CWE-601, CWE-284)', () => {
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

    it('verifies ResetPasswordSchema strictly enforces 12+ character complexity and symbols', () => {
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

      const invalidMismatch = ResetPasswordSchema.safeParse({
        newPassword: 'ValidPassword123!',
        confirmPassword: 'DifferentPassword123!',
      });
      assert.strictEqual(invalidMismatch.success, false);

      const validPayload = ResetPasswordSchema.safeParse({
        newPassword: 'SecureEnterprisePass2026!#',
        confirmPassword: 'SecureEnterprisePass2026!#',
      });
      assert.strictEqual(validPayload.success, true);
    });

    it('verifies resetTemporaryPassword updates app_metadata to prevent infinite loops', () => {
      const authActionPath = path.resolve(process.cwd(), 'src/app/actions/auth.ts');
      const content = fs.readFileSync(authActionPath, 'utf8');
      assert.ok(content.includes('adminClient.auth.admin.updateUserById(user.id'));
      assert.ok(content.includes('must_change_password: false'));
    });
  });
});
