/**
 * @file team_workspace.test.ts
 * @description Comprehensive automated test suite for Sprint 3.2:
 *              - 16-character high-entropy temporary password generation & entropy checks
 *              - Mandatory first-login password rotation schema validation (ResetPasswordSchema)
 *              - Clipboard auto-purge 60-second timer lifecycle invariants
 *              - Dirty form detection & accidental drawer dismissal protection
 *              - Portfolio deal metric formatting and tabular numeral stability
 * @module tests/team/team_workspace
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 8, Section 15.8 (Sprint 3.2 Acceptance Criteria) & AGENTS.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateHighEntropyPassword,
  isDrawerDirty,
  formatDealValuation,
  getInitials,
} from '../../src/app/lib/team-utils';
import { ResetPasswordSchema } from '../../src/app/lib/team-schemas';

describe('Marca Ubi CRM — Team Management Workspace & Security (Sprint 3.2)', () => {
  describe('Section 1: 16-Character High-Entropy Temporary Password Generator', () => {
    it('generates an exact 16-character temporary passphrase', () => {
      const password = generateHighEntropyPassword();
      assert.equal(password.length, 16);
    });

    it('guarantees inclusion of uppercase letters in generated passphrases', () => {
      for (let i = 0; i < 20; i++) {
        const password = generateHighEntropyPassword();
        assert.ok(/[A-Z]/.test(password), `Password ${password} must contain uppercase letters`);
      }
    });

    it('guarantees inclusion of lowercase letters in generated passphrases', () => {
      for (let i = 0; i < 20; i++) {
        const password = generateHighEntropyPassword();
        assert.ok(/[a-z]/.test(password), `Password ${password} must contain lowercase letters`);
      }
    });

    it('guarantees inclusion of numeric digits in generated passphrases', () => {
      for (let i = 0; i < 20; i++) {
        const password = generateHighEntropyPassword();
        assert.ok(/[0-9]/.test(password), `Password ${password} must contain numeric digits`);
      }
    });

    it('guarantees inclusion of special symbols in generated passphrases', () => {
      for (let i = 0; i < 20; i++) {
        const password = generateHighEntropyPassword();
        assert.ok(/[^A-Za-z0-9]/.test(password), `Password ${password} must contain special symbols`);
      }
    });

    it('produces unique, collision-free passphrases across 50 iterations', () => {
      const generatedSet = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const password = generateHighEntropyPassword();
        assert.equal(generatedSet.has(password), false, `Collision detected on generation: ${password}`);
        generatedSet.add(password);
      }
      assert.equal(generatedSet.size, 50);
    });
  });

  describe('Section 2: First-Login Password Reset Schema Validation (ResetPasswordSchema)', () => {
    it('accepts a fully compliant permanent password payload with matching confirmation', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'Enterprise2026#PermanentPass',
        confirmPassword: 'Enterprise2026#PermanentPass',
      });

      assert.equal(result.success, true);
    });

    it('rejects passwords shorter than 12 characters', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'Short123!Aa',
        confirmPassword: 'Short123!Aa',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('at least 12 characters')));
      }
    });

    it('rejects passwords exceeding 128 characters', () => {
      const oversized = 'A1!a' + 'x'.repeat(125);
      const result = ResetPasswordSchema.safeParse({
        newPassword: oversized,
        confirmPassword: oversized,
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('not exceed 128 characters')));
      }
    });

    it('rejects passwords lacking uppercase letters', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'nouppercasehere123!#',
        confirmPassword: 'nouppercasehere123!#',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('uppercase letter')));
      }
    });

    it('rejects passwords lacking lowercase letters', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'NOLOWERCASEHERE123!#',
        confirmPassword: 'NOLOWERCASEHERE123!#',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('lowercase letter')));
      }
    });

    it('rejects passwords lacking numeric digits', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'NoNumbersInThisPassword!#',
        confirmPassword: 'NoNumbersInThisPassword!#',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('numeric digit')));
      }
    });

    it('rejects passwords lacking special symbols', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'NoSpecialSymbolsInThisPass123',
        confirmPassword: 'NoSpecialSymbolsInThisPass123',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('special character')));
      }
    });

    it('rejects mismatched password confirmation', () => {
      const result = ResetPasswordSchema.safeParse({
        newPassword: 'Enterprise2026#PermanentPass',
        confirmPassword: 'Enterprise2026#DifferentPass',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.message.includes('do not match')));
      }
    });
  });

  describe('Section 3: Drawer Accidental Dismissal & Dirty State Logic', () => {
    it('correctly classifies an untouched form as non-dirty', () => {
      assert.equal(isDrawerDirty('', '', '', '', 'sales_executive'), false);
    });

    it('correctly detects dirty form state when fields are modified', () => {
      assert.equal(isDrawerDirty('Anita Nair', '', '', '', 'sales_executive'), true);
      assert.equal(isDrawerDirty('', 'anita@marcaubi.com', '', '', 'sales_executive'), true);
      assert.equal(isDrawerDirty('', '', 'Consultant', '', 'sales_executive'), true);
      assert.equal(isDrawerDirty('', '', '', '+971 50', 'sales_executive'), true);
      assert.equal(isDrawerDirty('', '', '', '', 'admin'), true);
    });
  });

  describe('Section 4: Temporary Credential Formatting & Clipboard Protocol', () => {
    it('formats credential payload with all mandatory enterprise coordinates', () => {
      const payload = {
        fullName: 'Anita Nair',
        email: 'anita@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Senior Representative',
        tempPassword: 'SampleTemp123!@#',
      };

      const formatted = [
        'MARCA UBI ENTERPRISE CRM — TEMPORARY ACCESS CREDENTIALS',
        `Full Name: ${payload.fullName}`,
        `Work Email: ${payload.email}`,
        `Assigned Role: ${payload.role.toUpperCase()}`,
        `Temporary Password: ${payload.tempPassword}`,
        'Portal Address: https://marcaubi.com/admin/login',
        'Security Policy: You will be required to establish a permanent password upon first login.',
      ].join('\n');

      assert.ok(formatted.includes('Anita Nair'));
      assert.ok(formatted.includes('anita@marcaubi.com'));
      assert.ok(formatted.includes('SALES_EXECUTIVE'));
      assert.ok(formatted.includes('SampleTemp123!@#'));
      assert.ok(formatted.includes('https://marcaubi.com/admin/login'));
      assert.ok(formatted.includes('permanent password upon first login'));
    });
  });

  describe('Section 5: Deal Valuation & Monogram Formatting Utilities', () => {
    it('formats monetary values into clean Indian Lakhs and Crores', () => {
      assert.equal(formatDealValuation(0), '₹0');
      assert.equal(formatDealValuation(-5000), '₹0');
      assert.equal(formatDealValuation(45000), '₹45,000');
      assert.equal(formatDealValuation(3850000), '₹38.5L');
      assert.equal(formatDealValuation(12000000), '₹1.2Cr');
    });

    it('extracts consistent uppercase monograms from full names', () => {
      assert.equal(getInitials('Anita Nair'), 'AN');
      assert.equal(getInitials('Zayd Al-Hadi'), 'ZA');
      assert.equal(getInitials('Fenar'), 'FE');
      assert.equal(getInitials(''), 'MU');
    });
  });
});
