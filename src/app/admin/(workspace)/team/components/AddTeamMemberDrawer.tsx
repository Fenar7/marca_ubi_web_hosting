'use client';

/**
 * @file AddTeamMemberDrawer.tsx
 * @description Backward compatibility adapter re-exporting AddTeamMemberModal as AddTeamMemberDrawer.
 *              Ensures existing imports across workspaces continue to function seamlessly after
 *              the centered luxury modal migration.
 * @module app/admin/team/components/AddTeamMemberDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import {
  AddTeamMemberModal,
  type AddTeamMemberModalProps,
} from '@/app/admin/components/modals/AddTeamMemberModal';

export type AddTeamMemberDrawerProps = AddTeamMemberModalProps;
export const AddTeamMemberDrawer = AddTeamMemberModal;
export default AddTeamMemberModal;
