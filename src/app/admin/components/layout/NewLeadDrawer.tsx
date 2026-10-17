'use client';

/**
 * @file NewLeadDrawer.tsx
 * @description Backward compatibility adapter re-exporting NewLeadModal as NewLeadDrawer.
 *              Ensures existing imports across layout components continue to function
 *              seamlessly after the centered modal redesign.
 * @module app/admin/components/layout/NewLeadDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import {
  NewLeadModal,
  type NewLeadModalProps,
} from '@/app/admin/components/modals/NewLeadModal';

export type NewLeadDrawerProps = NewLeadModalProps;
export const NewLeadDrawer = NewLeadModal;
export default NewLeadModal;
