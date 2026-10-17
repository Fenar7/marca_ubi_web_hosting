'use client';

/**
 * @file LeadDetailDrawer.tsx
 * @description Backward compatibility adapter re-exporting LeadDetailModal as LeadDetailDrawer.
 *              Ensures existing imports across workspaces continue to function seamlessly after
 *              the centered luxury modal migration.
 * @module app/admin/components/drawers/LeadDetailDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import {
  LeadDetailModal,
  type LeadDetailModalProps,
} from '@/app/admin/components/modals/LeadDetailModal';

export type LeadDetailDrawerProps = LeadDetailModalProps;
export const LeadDetailDrawer = LeadDetailModal;
export default LeadDetailModal;
