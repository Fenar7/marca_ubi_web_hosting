/**
 * @file chatpod-ingest-payload-parity.test.ts
 * @description Proves §4 of the data contract: the pod and `/start-project` submit the same lead.
 *
 *              "Same as the form flow" is a claim about bytes, not intent. Two builders would drift in
 *              whichever field nobody thinks to compare (a missing `showcasePermission` on one side, a
 *              reworded `combinedNotes` section on the other) and the CRM would quietly grow two shapes
 *              of the same lead. Every test below runs both surfaces over the same information and
 *              asserts the only permitted difference is the attribution pair.
 *
 *              The drift guard for the five closed sets is deliberately static as well as runtime: an
 *              array that is *equal* to the shared one passes a value test while still being free to be
 *              edited in one file only. So the source of both surfaces is read and checked for a restated
 *              literal.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  NOTES_MAX_CHARS,
  NOTES_OVERFLOW_KEY,
  NOTES_OVERFLOW_MARKER,
  WEBSITE_FORM_SOURCE,
  assembleCombinedNotes,
  buildIngestPayload,
} from '@/app/lib/intake/ingestPayload';
import {
  INTAKE_AGENCY_STATUS_OPTIONS,
  INTAKE_CATEGORIES,
  INTAKE_INDUSTRIES,
  INTAKE_LANGUAGES,
  INTAKE_REFERRAL_SOURCES,
  INTAKE_SHOWCASE_CHOICES,
  INTAKE_TIMELINE_OPTIONS,
  LINK_VALUE_SEPARATOR,
  MULTI_VALUE_SEPARATOR,
  splitLinks,
} from '@/app/lib/intake/intakeOptions';
import { buildPodPayload, reviewRows, slotsToFields } from '@/app/chat-pod/intake/review';
import { SLOTS, SLOT_ORDER } from '@/app/chat-pod/intake/slots';
import { initialIntakeState, transition } from '@/app/chat-pod/intake/useIntakeFlow';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';
import { initialFormData } from '@/app/components/ProjectForm/types';
import type { IngestPayload } from '@/app/lib/intake/ingestPayload';
import type { ProjectFormData } from '@/app/components/ProjectForm/types';
import type { SlotId, SlotValue } from '@/app/chat-pod/types';

const IDEMPOTENCY_KEY = '0f2a1b3c-0000-4000-8000-000000000001';

/** §8.1 The wizard's own state object, as a real submission would hold it. */
const FORM: ProjectFormData = {
  name: 'Asha Menon',
  email: 'Asha@Studio.example',
  phone: '+91 7012 052 472',
  instagram: '@asha.studio',
  category: ['Logo & identity', 'Web & app design'].join(MULTI_VALUE_SEPARATOR),
  service: ['Logo design', 'Web page design'].join(MULTI_VALUE_SEPARATOR),
  language: INTAKE_LANGUAGES[0],
  projectName: 'Desert Bloom',
  projectDescription: 'A brand system and a digital flagship for a beverage label.',
  industry: 'Food & Beverage',
  website: 'https://desertbloom.example',
  agencyStatus: INTAKE_AGENCY_STATUS_OPTIONS[0],
  referral: INTAKE_REFERRAL_SOURCES[3],
  timeline: INTAKE_TIMELINE_OPTIONS[3].value,
  inspirationLinks: ['https://example.com/a', 'https://example.com/b'].join(LINK_VALUE_SEPARATOR),
  showcasePermission: INTAKE_SHOWCASE_CHOICES[0],
  extraNotes: 'The launch window is the end of the year.',
};

/**
 * §8.1 The same information in the pod's shape: the multi-selects are arrays and the links are a list,
 * because a conversation collects them one turn at a time. Nothing here is a value the form does not
 * also hold.
 */
const POD: Record<SlotId, SlotValue> = {
  categories: ['Logo & identity', 'Web & app design'],
  services: ['Logo design', 'Web page design'],
  timeline: INTAKE_TIMELINE_OPTIONS[3].value,
  name: FORM.name,
  email: FORM.email,
  phone: FORM.phone,
  projectName: FORM.projectName,
  industry: FORM.industry,
  projectDescription: FORM.projectDescription,
  website: FORM.website,
  instagram: FORM.instagram,
  language: FORM.language,
  agencyStatus: FORM.agencyStatus,
  referral: FORM.referral,
  inspirationLinks: ['https://example.com/a', 'https://example.com/b'],
  showcasePermission: FORM.showcasePermission,
  extraNotes: FORM.extraNotes,
};

function formPayload(fields: ProjectFormData): IngestPayload {
  return buildIngestPayload(fields, { idempotencyKey: IDEMPOTENCY_KEY, source: WEBSITE_FORM_SOURCE });
}

/** §8.3 Strip the attribution pair, which is the only key the two surfaces are allowed to differ on. */
function withoutSource(payload: IngestPayload): Record<string, unknown> {
  const { source_name: _name, source_detail: _detail, ...rest } = payload;
  return rest;
}

function readSource(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

/**
 * The same brief collected by walking the machine a visitor uses, rather than by the literal above.
 * `POD` is what a test says the answers look like; this is what the reducer actually holds at the
 * review card, and the two must be the same object for the parity claim to mean anything.
 */
function podSlotsFromMachine(): Record<SlotId, SlotValue> {
  let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
  for (const slot of SLOT_ORDER) state = transition(state, { t: 'ANSWER', slot, value: POD[slot] });
  assert.equal(state.mode, 'REVIEW', 'the walk has to reach the card, or it collected nothing');
  return state.slots;
}

describe('Chat Pod and wizard payload parity', () => {
  describe('§8.2-8.3 one builder, two surfaces', () => {
    it('produces the identical payload apart from the two attribution strings', () => {
      assert.deepStrictEqual(withoutSource(formPayload(FORM)), withoutSource(buildPodPayload(POD, IDEMPOTENCY_KEY)));
    });

    it('files the same lead from the machine as from the mirrored answers', () => {
      const walked = podSlotsFromMachine();
      assert.deepEqual(walked, POD, 'the intake machine does not produce the brief the tests claim');
      assert.deepStrictEqual(withoutSource(formPayload(FORM)), withoutSource(buildPodPayload(walked, IDEMPOTENCY_KEY)));
    });

    it('routes by the services picked, not by the disciplines tapped through', () => {
      // The discipline question scopes the 52 services down to the ones on offer. A visitor can tap
      // three of them and then order one product, and `Step1Services` has always filed the single
      // parent of that product, because `mapCategory` escalates on the count of what it is handed.
      const taps = ['Logo & identity', 'Web & app design', 'Packaging & label'];
      const pod = buildPodPayload({ ...POD, categories: taps, services: ['Product packaging'] }, IDEMPOTENCY_KEY);
      const form = formPayload({ ...FORM, category: 'Packaging & label', service: 'Product packaging' });
      assert.deepStrictEqual(withoutSource(pod), withoutSource(form));
      assert.equal(reviewRows({ ...POD, categories: taps, services: ['Product packaging'] }).find((row) => row.slot === 'categories')?.value, 'Packaging & label');
    });

    it('escalates to the whole programme on the derived count, on either surface', () => {
      const spread = { ...POD, categories: ['Logo & identity'], services: ['Logo design', 'Web page design', 'Product packaging'] };
      const pod = buildPodPayload(spread, IDEMPOTENCY_KEY);
      const form = formPayload({ ...FORM, category: ['Logo & identity', 'Web & app design', 'Packaging & label'].join(MULTI_VALUE_SEPARATOR), service: spread.services.join(MULTI_VALUE_SEPARATOR) });
      assert.equal(pod.service_category, 'Full-Suite Advisory');
      assert.deepStrictEqual(withoutSource(pod), withoutSource(form));
    });

    it('differs only in source_name and source_detail', () => {
      const form = formPayload(FORM);
      const pod = buildPodPayload(POD, IDEMPOTENCY_KEY);
      assert.equal(form.source_name, 'Website Form');
      assert.equal(pod.source_name, 'Chat Pod');
      assert.equal(form.source_detail, 'Start Project Brief Wizard (Multi-Service)');
      assert.equal(pod.source_detail, 'Conversational intake (chat pod)');
    });

    it('joins the pod arrays with the wizard separator before they reach the builder', () => {
      const fields = slotsToFields(POD);
      assert.equal(fields.category, FORM.category);
      assert.equal(fields.service, FORM.service);
      assert.equal(fields.inspirationLinks, FORM.inspirationLinks);
    });

    it('carries the timeline in budget_bracket and never a money figure', () => {
      const pod = buildPodPayload(POD, IDEMPOTENCY_KEY);
      assert.equal(pod.budget_bracket, INTAKE_TIMELINE_OPTIONS[3].value);
      assert.equal('expected_value' in pod, false);
    });

    it('collects exactly the fields the wizard state carries', () => {
      const wizardKeys = Object.keys(initialFormData).filter((key) => key !== 'services' && key !== 'categories');
      assert.deepStrictEqual(Object.keys(slotsToFields(POD)).sort(), [...wizardKeys].sort());
    });
  });

  describe('§8.4 both payloads satisfy the ingest schema', () => {
    it('parses the form payload', () => {
      assert.doesNotThrow(() => ingestLeadSchema.parse(formPayload(FORM)));
    });

    it('parses the pod payload', () => {
      assert.doesNotThrow(() => ingestLeadSchema.parse(buildPodPayload(POD, IDEMPOTENCY_KEY)));
    });

    it('parses an empty-optional payload, which is what a skipped chat really sends', () => {
      const minimal: Record<SlotId, SlotValue> = {
        ...POD,
        categories: ['Other'],
        services: ['Other design'],
        instagram: '',
        website: '',
        industry: '',
        language: '',
        agencyStatus: '',
        referral: '',
        inspirationLinks: [],
        showcasePermission: '',
        extraNotes: '',
        projectName: '',
        projectDescription: '',
      };
      const pod = buildPodPayload(minimal, IDEMPOTENCY_KEY);
      assert.equal(pod.company, undefined);
      assert.equal(pod.industry, undefined);
      assert.doesNotThrow(() => ingestLeadSchema.parse(pod));
    });

    it('refuses a lead with no contact channel on either surface', () => {
      const orphan = { ...FORM, email: '', phone: '' };
      assert.throws(() => ingestLeadSchema.parse(formPayload(orphan)));
      assert.throws(() => ingestLeadSchema.parse(buildPodPayload({ ...POD, email: '', phone: '' }, IDEMPOTENCY_KEY)));
    });
  });

  describe('§8.5 the 2,000-character trap', () => {
    const paragraph = 'Deliverables span the mark, the palette, the type system and the flagship page.';
    const overflowFields: ProjectFormData = {
      ...FORM,
      projectDescription: Array.from({ length: 20 }, () => paragraph).join('\n'),
      extraNotes: Array.from({ length: 20 }, () => paragraph).join('\n'),
    };
    const overflowSlots: Record<SlotId, SlotValue> = {
      ...POD,
      projectDescription: overflowFields.projectDescription,
      extraNotes: overflowFields.extraNotes,
    };

    it('assembles a brief longer than the server cap', () => {
      assert.ok(assembleCombinedNotes(overflowFields, ['Logo design', 'Web page design']).length > NOTES_MAX_CHARS);
    });

    it('caps the pod notes and keeps the whole brief in brief_payload', () => {
      const pod = buildPodPayload(overflowSlots, IDEMPOTENCY_KEY);
      const notes = pod.notes ?? '';
      assert.ok(notes.length <= NOTES_MAX_CHARS, `notes were ${notes.length} characters`);
      assert.ok(notes.endsWith(NOTES_OVERFLOW_MARKER));
      assert.equal(pod.brief_payload[NOTES_OVERFLOW_KEY], assembleCombinedNotes(overflowFields, ['Logo design', 'Web page design']));
    });

    it('cuts at a whole line boundary, never mid-sentence', () => {
      const notes = buildPodPayload(overflowSlots, IDEMPOTENCY_KEY).notes ?? '';
      const head = notes.slice(0, notes.length - NOTES_OVERFLOW_MARKER.length);
      const full = assembleCombinedNotes(overflowFields, ['Logo design', 'Web page design']);
      assert.ok(full.startsWith(head));
      assert.ok(head.length === full.length || full[head.length] === '\n', 'the cut must land on a line boundary');
      assert.ok(!head.includes('\n[truncated'), 'the marker appears once, at the end');
    });

    it('passes the schema where the un-truncated wizard brief would not', () => {
      const pod = buildPodPayload(overflowSlots, IDEMPOTENCY_KEY);
      assert.doesNotThrow(() => ingestLeadSchema.parse(pod));
      // The form keeps its current behaviour byte-for-byte, which means an over-cap brief still
      // reaches the route and is rejected there. That is the pre-existing trap this phase fixes on
      // the pod only; the assertion records the difference so a later decision to enable
      // `truncateOverflow` for the wizard has to change this test on purpose.
      assert.throws(() => ingestLeadSchema.parse(formPayload(overflowFields)));
    });

    it('leaves a brief inside the cap byte-identical on both surfaces', () => {
      const pod = buildPodPayload(POD, IDEMPOTENCY_KEY);
      const form = formPayload(FORM);
      assert.equal(pod.notes, form.notes);
      assert.equal(NOTES_OVERFLOW_KEY in pod.brief_payload, false);
    });
  });

  describe('§8.6 the closed sets are one import, not two copies', () => {
    const SHARED = [
      'INTAKE_CATEGORIES',
      'INTAKE_LANGUAGES',
      'INTAKE_INDUSTRIES',
      'INTAKE_REFERRAL_SOURCES',
      'INTAKE_AGENCY_STATUS_OPTIONS',
      'INTAKE_SHOWCASE_CHOICES',
    ] as const;

    const SURFACES = [
      { label: 'wizard step 1', path: ['src', 'app', 'components', 'ProjectForm', 'steps', 'Step1Services.tsx'] },
      { label: 'wizard step 2', path: ['src', 'app', 'components', 'ProjectForm', 'steps', 'Step2Business.tsx'] },
      { label: 'wizard step 3', path: ['src', 'app', 'components', 'ProjectForm', 'steps', 'Step3Details.tsx'] },
      { label: 'chat pod slots', path: ['src', 'app', 'chat-pod', 'intake', 'slots.ts'] },
    ];

    for (const name of SHARED) {
      it(`${name} is imported from the shared module by every surface that renders it`, () => {
        for (const surface of SURFACES) {
          const source = readSource(...surface.path);
          if (!source.includes(name)) continue;
          assert.ok(
            new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*"@/app/lib/intake/intakeOptions"`).test(source),
            `${surface.label} mentions ${name} without importing it from the shared module`,
          );
        }
      });
    }

    it('no surface restates a closed set as a local literal', () => {
      const restated = /const\s+(CATEGORIES|LANGUAGES|INDUSTRIES|REFERRAL_SOURCES|AGENCY_STATUS_OPTIONS|SHOWCASE_CHOICES|TIMELINE_OPTIONS)\s*=\s*\[\s*"/;
      for (const surface of SURFACES) {
        assert.equal(restated.test(readSource(...surface.path)), false, `${surface.label} declares its own copy of an option list`);
      }
    });

    it('the pod chip lists are the shared arrays element for element', () => {
      assert.deepStrictEqual(SLOTS.language.options?.map((option) => option.value), [...INTAKE_LANGUAGES]);
      assert.deepStrictEqual(SLOTS.industry.options?.map((option) => option.value), [...INTAKE_INDUSTRIES]);
      assert.deepStrictEqual(SLOTS.referral.options?.map((option) => option.value), [...INTAKE_REFERRAL_SOURCES]);
      assert.deepStrictEqual(SLOTS.agencyStatus.options?.map((option) => option.value), [...INTAKE_AGENCY_STATUS_OPTIONS]);
      assert.deepStrictEqual(SLOTS.showcasePermission.options?.map((option) => option.value), [...INTAKE_SHOWCASE_CHOICES]);
      assert.deepStrictEqual(SLOTS.categories.options?.map((option) => option.value), [...INTAKE_CATEGORIES]);
      assert.deepStrictEqual(SLOTS.timeline.options?.map((option) => option.value), INTAKE_TIMELINE_OPTIONS.map((option) => option.value));
    });
  });

  describe('§8.7 stored values are members of their set, byte for byte', () => {
    it('stores the agency strings with the straight apostrophe and the capitalised NOT', () => {
      assert.ok(INTAKE_AGENCY_STATUS_OPTIONS.includes("Yes and I'm interested in agency services"));
      assert.ok(INTAKE_AGENCY_STATUS_OPTIONS.includes("Yes and I'm NOT interested in agency services"));
      assert.ok(INTAKE_AGENCY_STATUS_OPTIONS.includes("No, I'm not an agency"));
      assert.equal(INTAKE_AGENCY_STATUS_OPTIONS.some((option) => option.includes('\u2019')), false);

      for (const value of INTAKE_AGENCY_STATUS_OPTIONS) {
        const stored = SLOTS.agencyStatus.validate(value, POD);
        assert.ok(stored.ok && stored.value === value);
        assert.equal(slotsToFields({ ...POD, agencyStatus: value }).agencyStatus, value);
      }
    });

    it('accepts every member of every closed set and rejects anything off the list', () => {
      const sets: Record<string, readonly string[]> = {
        language: INTAKE_LANGUAGES,
        industry: INTAKE_INDUSTRIES,
        referral: INTAKE_REFERRAL_SOURCES,
        agencyStatus: INTAKE_AGENCY_STATUS_OPTIONS,
        showcasePermission: INTAKE_SHOWCASE_CHOICES,
      };
      for (const [slot, values] of Object.entries(sets)) {
        const definition = SLOTS[slot as SlotId];
        for (const value of values) assert.ok(definition.validate(value, POD).ok, `${slot} rejected its own option ${value}`);
        assert.equal(definition.validate('technology', POD).ok, false, `${slot} accepted a value off its list`);
      }
    });

    it('keeps the compact chip label out of the payload', () => {
      const long = INTAKE_TIMELINE_OPTIONS[0];
      assert.notEqual(long.chipLabel, long.value);
      const fields = slotsToFields({ ...POD, timeline: long.value });
      assert.equal(fields.timeline, long.value);
      assert.equal(reviewRows({ ...POD, timeline: long.value }).find((row) => row.slot === 'timeline')?.value, long.value);
      const reviewValue = reviewRows({ ...POD, agencyStatus: INTAKE_AGENCY_STATUS_OPTIONS[2] }).find((row) => row.slot === 'agencyStatus')?.value;
      assert.equal(reviewValue, "No, I'm not an agency");
    });
  });

  describe('§8.8 the inspiration links round-trip', () => {
    it('survives array, joined string, and the wizard splitter', () => {
      const links = ['https://example.com/a', 'https://example.com/b', 'https://example.com/c'];
      const joined = slotsToFields({ ...POD, inspirationLinks: links }).inspirationLinks;
      assert.equal(joined, links.join(LINK_VALUE_SEPARATOR));
      assert.deepStrictEqual(splitLinks(joined), links);
      assert.deepStrictEqual(joined.split(LINK_VALUE_SEPARATOR), links);
    });

    it('passes the same string to the wizard repeater it would have parsed from itself', () => {
      const pod = buildPodPayload({ ...POD, inspirationLinks: ['https://example.com/a', 'https://example.com/b'] }, IDEMPOTENCY_KEY);
      const form = formPayload({ ...FORM, inspirationLinks: 'https://example.com/a\nhttps://example.com/b' });
      assert.equal(pod.brief_payload.inspirationLinks, form.brief_payload.inspirationLinks);
      assert.ok((pod.notes ?? '').includes('Inspiration References:'));
    });

    it('drops an empty list without leaving a stray section', () => {
      const pod = buildPodPayload({ ...POD, inspirationLinks: [] }, IDEMPOTENCY_KEY);
      assert.equal(pod.brief_payload.inspirationLinks, '');
      assert.equal((pod.notes ?? '').includes('Inspiration References:'), false);
    });
  });

  describe('the historic separator collision, held identical', () => {
    it('splits a service that contains a comma the same way on both surfaces', () => {
      // "Postcard, flyer or print" is a canonical 100over90 value and ", " is the wizard's own
      // accumulator separator, so the round trip is lossy for that one entry on *both* surfaces.
      // Parity means the pod must be exactly as lossy as the form, not smarter than it.
      const withComma = ['Postcard, flyer or print', 'Poster'];
      const pod = buildPodPayload({ ...POD, categories: ['Business & advertising'], services: withComma }, IDEMPOTENCY_KEY);
      const form = formPayload({
        ...FORM,
        category: 'Business & advertising',
        service: withComma.join(MULTI_VALUE_SEPARATOR),
      });
      assert.deepStrictEqual(withoutSource(pod), withoutSource(form));
      assert.deepStrictEqual(pod.brief_payload.services, ['Postcard', 'flyer or print', 'Poster']);
    });
  });

  describe('the slot to field rename', () => {
    it('emits one field per slot under the names the wizard uses', () => {
      const fields = slotsToFields(POD);
      assert.equal(Object.keys(fields).length, SLOT_ORDER.length);
      assert.equal('categories' in fields, false);
      assert.equal('services' in fields, false);
      assert.equal(fields.category, FORM.category);
      assert.equal(fields.service, FORM.service);
    });
  });
});
