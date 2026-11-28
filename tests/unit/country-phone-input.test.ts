/**
 * @file country-phone-input.test.ts
 * @description Unit and structural tests for the reusable international country dial-code
 *              selector (`CountryPhoneInput`) and E.164 composition utilities (`phone-countries.ts`).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  PHONE_COUNTRIES,
  composePhoneValue,
  detectCountryFromInternationalInput,
  getPhoneCountryByIso,
  splitPhoneValue,
} from '@/app/lib/phone-countries';
import { normalizePhone } from '@/app/lib/normalization';
import { createManualLeadSchema } from '@/app/lib/lead-schemas';

describe('CountryPhoneInput & International Dial-Code Utilities', () => {
  it('exposes curated primary commercial markets first without duplicate ISO codes', () => {
    const isos = PHONE_COUNTRIES.map((c) => c.iso);
    assert.equal(new Set(isos).size, isos.length);
    assert.deepEqual(isos.slice(0, 5), ['AE', 'IN', 'SA', 'US', 'GB']);
    assert.equal(getPhoneCountryByIso('IN').dialCode, '+91');
    assert.equal(getPhoneCountryByIso('UNKNOWN').iso, 'AE');
  });

  it('returns empty string when national number has no digits to avoid dirty-state bugs', () => {
    assert.equal(composePhoneValue('AE', ''), '');
    assert.equal(composePhoneValue('IN', '   '), '');
    assert.equal(composePhoneValue('AE', '-() '), '');
  });

  it('composes clean international values and strips domestic trunk zero where appropriate', () => {
    assert.equal(composePhoneValue('AE', '050 123 4567'), '+971 50 123 4567');
    assert.equal(composePhoneValue('IN', '098765 43210'), '+91 98765 43210');
    assert.equal(composePhoneValue('IT', '02 1234 5678'), '+39 02 1234 5678');

    const normalizedUae = normalizePhone(composePhoneValue('AE', '050 123 4567'));
    assert.equal(normalizedUae.phone, '+971501234567');
    assert.equal(normalizedUae.warning, false);

    const normalizedIndia = normalizePhone(composePhoneValue('IN', '5434234343'));
    assert.equal(normalizedIndia.phone, '+915434234343');
    assert.equal(normalizedIndia.warning, false);
  });

  it('auto-detects pasted +code international prefixes and splits existing values accurately', () => {
    const pastedIndia = detectCountryFromInternationalInput('+91 5434234343');
    assert.ok(pastedIndia);
    assert.equal(pastedIndia.country.iso, 'IN');
    assert.equal(pastedIndia.nationalNumber, '5434234343');

    const pastedSaudi = detectCountryFromInternationalInput('00966 501234567');
    assert.ok(pastedSaudi);
    assert.equal(pastedSaudi.country.iso, 'SA');
    assert.equal(pastedSaudi.nationalNumber, '501234567');

    // Incomplete prefix should not switch prematurely while user is still typing
    assert.equal(detectCountryFromInternationalInput('+9'), null);

    assert.deepEqual(splitPhoneValue('+44 7700 900077', 'AE'), {
      countryIso: 'GB',
      nationalNumber: '7700 900077',
    });
    assert.deepEqual(splitPhoneValue('971501234567', 'IN'), {
      countryIso: 'AE',
      nationalNumber: '501234567',
    });
    assert.deepEqual(splitPhoneValue(null, 'IN'), {
      countryIso: 'IN',
      nationalNumber: '',
    });
  });

  it('passes createManualLeadSchema with composed phone alone even when email is empty', () => {
    const composed = composePhoneValue('IN', '5434234343');
    const parsed = createManualLeadSchema.safeParse({
      name: 'apex holdings 2',
      phone: composed,
      email: '',
    });
    assert.equal(parsed.success, true);
  });

  it('wires CountryPhoneInput across all CRM modals and public phone intake forms', () => {
    const targets = [
      'src/app/admin/components/modals/NewLeadModal.tsx',
      'src/app/admin/components/modals/EditLeadModal.tsx',
      'src/app/admin/components/modals/AddTeamMemberModal.tsx',
      'src/app/admin/(workspace)/ingestion/components/InquiryActions.tsx',
      'src/app/components/ProjectForm/steps/Step2Business.tsx',
      'src/app/contact/components/InquiryComposer.tsx',
      'src/app/components/Hero/CompanyProfileModal.tsx',
      'src/app/careers/[slug]/JobDetailClient.tsx',
    ];

    for (const relPath of targets) {
      const src = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
      assert.ok(src.includes('CountryPhoneInput'), `Expected CountryPhoneInput in ${relPath}`);
    }

    const newLeadSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/admin/components/modals/NewLeadModal.tsx'),
      'utf8'
    );
    assert.ok(
      newLeadSrc.includes('delete next.phone'),
      'NewLeadModal must clear stale contact coordinate errors as user edits email/phone'
    );
  });
});
