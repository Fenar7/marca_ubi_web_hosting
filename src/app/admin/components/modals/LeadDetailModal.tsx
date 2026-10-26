'use client';

/**
 * @file LeadDetailModal.tsx
 * @description Backward compatibility adapter delegating to the unified ClientDossierDrawer.
 *              Maintains component signature and exports while eliminating 900+ lines of duplicated code.
 * @module app/admin/components/modals/LeadDetailModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import { ClientDossierDrawer } from '@/app/admin/components/DossierDrawer';
import type { CurrentUserSession } from '@/app/admin/components/layout/UserProfileDropdown';

export interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: CurrentUserSession;
  onLeadUpdated?: () => void;
}

/**
 * Backward compatibility component adapter rendering the canonical Client 360° Dossier Drawer.
 */
export function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadDetailModalProps): React.ReactElement | null {
  return (
    <ClientDossierDrawer
      leadId={leadId}
      isOpen={isOpen}
      onClose={onClose}
      onLeadUpdated={onLeadUpdated}
    />
  );
}

export { ClientDossierDrawer as LeadDetailDrawer };
