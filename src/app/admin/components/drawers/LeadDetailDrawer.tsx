'use client';

/**
 * @file LeadDetailDrawer.tsx
 * @description Backward compatibility adapter exporting ClientDossierDrawer as LeadDetailDrawer.
 *              Ensures existing imports across workspaces continue to function seamlessly after
 *              the Sprint 8.1 Client 360 sliding drawer release.
 * @module app/admin/components/drawers/LeadDetailDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import {
  ClientDossierDrawer,
  type ClientDossierDrawerProps,
} from '@/app/admin/components/DossierDrawer';

export type LeadDetailDrawerProps = ClientDossierDrawerProps;
export const LeadDetailDrawer = ClientDossierDrawer;
export default ClientDossierDrawer;
