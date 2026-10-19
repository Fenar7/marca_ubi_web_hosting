/**
 * @file index.ts
 * @description Master barrel export for Marca Ubi Admin Modals.
 *              Exposes guarded stage transition dialogs, prospective creation modal,
 *              batch reassignment modal, and administrative team management surfaces.
 * @module app/admin/components/modals
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export * from './StageTransitionModal';
export * from './LostReasonModal';
export * from './ConvertedCelebrationModal';
export * from './NewLeadModal';
export * from './LeadDetailModal';
export * from './AddTeamMemberModal';
export * from './useModalAnimation';
export { BatchReassignModal, type BatchReassignModalProps } from './BatchReassignModal';
export * from './ConvertLeadToDealModal';

