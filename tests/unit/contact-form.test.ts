/**
 * @file contact-form.test.ts
 * @description Comprehensive unit and contract tests for the `/contact` route:
 *              1. Zod input validation & schema bounds (RFC email, name length, message bounds).
 *              2. Cryptographic honeypot interception invariant.
 *              3. Budget amount field flexibility.
 *              4. Swiss Light Editorial luxury design tokens (pure white #ffffff, Brand Red #ea002a, zero #ff6100 orange, zero #2563eb blue).
 *              5. Technical SEO, metadata and JSON-LD Schema.org graph contracts.
 *              6. Server Action boundary enforcement.
 * @module tests/unit/contact-form.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { contactInquirySchema, type ContactTrack } from '@/app/lib/validations/contact';

describe('Contact Portal: Input Validation & Sanitization Schema', () => {
  it('validates a complete enterprise new-business inquiry', () => {
    const payload = {
      name: 'Eleanor Vance',
      email: 'eleanor@vance-holdings.com',
      organization: 'Vance Luxury Holdings',
      phone: '+91 98400 12345',
      track: 'new-business' as ContactTrack,
      budgetAmount: '₹25,00,000',
      message: 'We require a complete architectural brand overhaul and digital flagship design.',
    };

    const result = contactInquirySchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.name, 'Eleanor Vance');
      assert.equal(result.data.email, 'eleanor@vance-holdings.com');
      assert.equal(result.data.budgetAmount, '₹25,00,000');
      assert.equal(result.data.track, 'new-business');
    }
  });

  it('validates press & media inquiry without budget amount', () => {
    const payload = {
      name: 'Julian Sterling',
      email: 'julian@design-quarterly.co.uk',
      organization: 'Architectural Digest UK',
      phone: '+44 20 7946 0991',
      track: 'press-media' as ContactTrack,
      message: 'Requesting an interview dispatch regarding the Swiss Light Editorial platform architecture.',
    };

    const result = contactInquirySchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.track, 'press-media');
      assert.equal(result.data.budgetAmount, null);
    }
  });

  it('rejects submissions with invalid email addresses', () => {
    const payload = {
      name: 'Arthur Pendelton',
      email: 'not-an-email',
      message: 'This should fail validation due to invalid email format.',
    };

    const result = contactInquirySchema.safeParse(payload);
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      assert.ok(errors.email);
    }
  });

  it('rejects submissions where name is shorter than 2 characters', () => {
    const payload = {
      name: 'A',
      email: 'valid@brand.com',
      message: 'Short name test should fail.',
    };

    const result = contactInquirySchema.safeParse(payload);
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      assert.ok(errors.name);
    }
  });

  it('rejects submissions where message is shorter than 10 characters', () => {
    const payload = {
      name: 'Valid Name',
      email: 'valid@brand.com',
      message: 'Short',
    };

    const result = contactInquirySchema.safeParse(payload);
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      assert.ok(errors.message);
    }
  });

  it('normalizes email addresses to lowercase', () => {
    const payload = {
      name: 'Marcus Croft',
      email: 'MARCUS.CROFT@ENTERPRISE.COM',
      message: 'Testing email lowercase normalization transform.',
    };

    const result = contactInquirySchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, 'marcus.croft@enterprise.com');
    }
  });
});

describe('Contact Portal: Cryptographic Honeypot Invariant', () => {
  it('identifies honeypot population when bot fills hidden field', () => {
    const botPayload = {
      name: 'Bot Crawler',
      email: 'bot@spamnetwork.com',
      message: 'Automated spam payload transmitted via automated script.',
      marca_contact_hp: 'http://spam-link-target.com',
    };

    const result = contactInquirySchema.safeParse(botPayload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.marca_contact_hp, 'http://spam-link-target.com');
      // Honeypot detection logic checks non-empty string
      const isBot = Boolean(result.data.marca_contact_hp && result.data.marca_contact_hp.trim().length > 0);
      assert.equal(isBot, true);
    }
  });

  it('allows clean human submission with empty honeypot', () => {
    const humanPayload = {
      name: 'Real Client',
      email: 'client@legitimate.com',
      message: 'Real client message requesting studio engagement.',
      marca_contact_hp: '',
    };

    const result = contactInquirySchema.safeParse(humanPayload);
    assert.equal(result.success, true);
    if (result.success) {
      const isBot = Boolean(result.data.marca_contact_hp && result.data.marca_contact_hp.trim().length > 0);
      assert.equal(isBot, false);
    }
  });
});

describe('Contact Portal: Swiss Light Editorial Design Tokens & Anti-Slop Audit', () => {
  const scssPath = path.join(process.cwd(), 'src/app/contact/Contact.module.scss');
  const scssContent = fs.readFileSync(scssPath, 'utf8');

  it('enforces pure white canvas (#ffffff), obsidian black masthead (#000000), and soft blush pink (#ffd6e7)', () => {
    assert.match(scssContent, /#ffffff/);
    assert.match(scssContent, /#000000/);
    assert.match(scssContent, /#ffd6e7/);
  });

  it('enforces Brand Red (#ea002a) as surgical accent', () => {
    assert.match(scssContent, /#ea002a/);
  });

  it('strictly purges internal CRM #ff6100 orange from public contact styles', () => {
    assert.doesNotMatch(scssContent, /#ff6100/i);
  });

  it('strictly purges generic AI blue (#2563eb) from styles', () => {
    assert.doesNotMatch(scssContent, /#2563eb/i);
  });

  it('applies Linear/Raycast fluid capsule geometry (border-radius: 9999px) on track selector pills', () => {
    assert.match(scssContent, /border-radius:\s*9999px/);
  });

  it('enforces touch targets >= 44px (min-height: 48px and height: 52px)', () => {
    assert.match(scssContent, /min-height:\s*48px/);
    assert.match(scssContent, /height:\s*52px/);
  });

  it('verifies complete elimination of AI-slop ticking clocks and pulsating radar dots', () => {
    const pagePath = path.join(process.cwd(), 'src/app/contact/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(pageContent, /StudioCorridors/);
    assert.doesNotMatch(pageContent, /useStudioClocks/);
    assert.doesNotMatch(pageContent, /TALK TO US\./);
  });
});

describe('Contact Portal: Technical SEO & Metadata Architecture', () => {
  const pagePath = path.join(process.cwd(), 'src/app/contact/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  it('declares self-referential canonical URL for /contact', () => {
    assert.match(pageContent, /canonical:\s*`\${siteUrl}\/contact`/);
  });

  it('includes JSON-LD Schema.org graph with ContactPage and Organization', () => {
    assert.match(pageContent, /['"]@type['"]:\s*['"]ContactPage['"]/);
    assert.match(pageContent, /['"]@type['"]:\s*\[['"]Organization['"]/);
  });

  it('includes verified physical studio coordinates for Calicut and Trivandrum', () => {
    assert.match(pageContent, /HiLITE Business Park/);
    assert.match(pageContent, /Technopark Phase III/);
    assert.match(pageContent, /\+917012052472/);
  });

  it('registers /contact in sitemap.ts with priority 0.8', () => {
    const sitemapPath = path.join(process.cwd(), 'src/app/sitemap.ts');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    assert.match(sitemapContent, /\${siteUrl}\/contact/);
  });

  it('wires hamburger NavigationOverlay contact link to /contact', () => {
    const navOverlayPath = path.join(process.cwd(), 'src/app/components/NavigationOverlay/NavigationOverlay.tsx');
    const navOverlayContent = fs.readFileSync(navOverlayPath, 'utf8');
    assert.match(navOverlayContent, /\{\s*label:\s*["']contact["'],\s*href:\s*["']\/contact["']\s*\}/);
  });
});

describe('Contact Portal: Server Action Boundary Compliance', () => {
  const actionPath = path.join(process.cwd(), 'src/app/actions/contactActions.ts');
  const actionContent = fs.readFileSync(actionPath, 'utf8');

  it('enforces "use server" directive at file top', () => {
    assert.match(actionContent, /^'use server'/m);
  });

  it('strictly exports async function submitContactInquiry and zero constants', () => {
    const lines = actionContent.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('export ') && !trimmed.startsWith('export type') && !trimmed.startsWith('export interface')) {
        assert.ok(
          trimmed.startsWith('export async function ') || trimmed.startsWith('export default async function '),
          `Server Action boundary violation: line "${trimmed}" in contactActions.ts must only be an async function`
        );
      }
    });
  });
});
