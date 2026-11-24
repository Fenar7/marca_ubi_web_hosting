import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { allowedMoveDestinations, canMoveDeal, dealIdentity, followUpPresentation, ownerIdentity } from '../../src/app/admin/(workspace)/deals/dealPresentation';
import type { FunnelStatusItem, HydratedDealItem } from '../../src/app/admin/(workspace)/deals/DealsWorkspaceClient';

const deal: HydratedDealItem = { id: 'one', lead_id: 'LD-1', name: 'Contact Person', company: 'Actual Company', phone: null, email: null, expected_value: 100, priority: 'High', next_follow_up: '2026-11-01T12:00:00Z', created_at: '', updated_at: '', assigned_to: null, status_id: 'new', lead_source_id: '', assigned_to_name: 'Unassigned', status_name: 'New', status_bucket: 'open', status_color: '#111111', source_name: 'Website' };
const stage = (id: string, name: string, bucket = 'open', is_active = true): FunnelStatusItem => ({ id, name, bucket, is_active, sort_order: 1, color_code: '#111111' });

describe('Deal card identity and movement invariants', () => {
  it('uses company-first identity and preserves contact fallback', () => {
    assert.deepEqual(dealIdentity(deal), { title: 'Actual Company', contact: 'Contact Person' });
    assert.deepEqual(dealIdentity({ ...deal, company: null }), { title: 'Contact Person', contact: null });
  });
  it('never invents initials for unresolved owners', () => {
    assert.equal(ownerIdentity(deal).initials, null);
    assert.equal(ownerIdentity({ ...deal, assigned_to: 'owner', assigned_to_name: 'Owner unavailable' }).initials, null);
    assert.equal(ownerIdentity({ ...deal, assigned_to: 'owner', assigned_to_name: 'Sophia Sterling' }).initials, 'SS');
  });
  it('suppresses terminal and future-revisit urgency while retaining invalid schedule distinctions', () => {
    const now = Date.parse('2026-11-23T12:00:00Z');
    assert.equal(followUpPresentation(deal, now).overdue, true);
    assert.equal(followUpPresentation({ ...deal, status_bucket: 'converted' }, now).overdue, false);
    assert.match(followUpPresentation({ ...deal, status_name: 'On Hold', revisit_date: '2026-12-01' }, now).label, /^Revisit/);
    assert.equal(followUpPresentation({ ...deal, next_follow_up: 'invalid' }, now).label, 'Schedule unavailable');
    assert.equal(followUpPresentation({ ...deal, next_follow_up: null }, now).label, 'Not scheduled');
  });
  it('fails closed for ambiguous guarded destinations and inactive stages', () => {
    const stages = [stage('new','New'), stage('hold1','On Hold'), stage('hold2','On Hold'), stage('old','Retired','open',false), stage('won','Converted','converted')];
    assert.deepEqual(allowedMoveDestinations(stages).map(item => item.id), ['new','won']);
    assert.equal(canMoveDeal(deal, 'viewer'), false);
    assert.equal(canMoveDeal({ ...deal, status_bucket: 'converted' }, 'sales_manager'), false);
    assert.equal(canMoveDeal({ ...deal, status_bucket: 'converted' }, 'admin'), true);
  });
});
