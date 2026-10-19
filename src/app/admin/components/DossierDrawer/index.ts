/**
 * @file index.ts
 * @description Public exports for Client 360° Dossier Drawer components.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export { ClientDossierDrawer } from './ClientDossierDrawer';
export type { ClientDossierDrawerProps, LeadDossierData } from './ClientDossierDrawer';
export { OrganizationDossier, formatDossierCurrency, sanitizeTelUri, createWhatsAppUri, getDossierInitials } from './OrganizationDossier';
export { RawBriefAccordion } from './RawBriefAccordion';
export type { RawBriefAccordionProps } from './RawBriefAccordion';
export { ActivityTimeline } from './ActivityTimeline';
export type { ActivityTimelineProps } from './ActivityTimeline';
export { QuickActionComposer } from './QuickActionComposer';
export type { QuickActionComposerProps, ComposerTab } from './QuickActionComposer';
export {
  formatRelativeTime,
  formatCallDuration,
  parseMentionsAndTags,
} from './dossierUtils';
