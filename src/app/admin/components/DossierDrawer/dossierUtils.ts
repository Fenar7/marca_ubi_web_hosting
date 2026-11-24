/**
 * @file dossierUtils.ts
 * @description Pure utility and formatting functions for the Client 360° Dossier Drawer.
 *              Separated from React JSX/SCSS modules to enable high-speed Node.js test execution
 *              without CSS preprocessor bundling requirements.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

/**
 * Formats numeric INR values with full Indian digit grouping.
 * @param value Valuation amount
 */
export function formatDossierCurrency(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Strict RFC 3966 telephone coordinate sanitization.
 * @param phone Raw phone string
 */
export function sanitizeTelUri(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return cleaned.length >= 7 ? `tel:${cleaned}` : null;
}

/**
 * WhatsApp deep-link generation with prefilled reference text.
 * @param phone Raw phone string
 * @param leadId Human-readable deal ID token
 * @param name Client full name
 */
export function createWhatsAppUri(
  phone: string | null,
  leadId: string,
  name: string
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;
  const encodedText = encodeURIComponent(
    `Hello ${name}, this is regarding your inquiry with Marca Ubi (Ref: ${leadId}).`
  );
  return `https://wa.me/${digits}?text=${encodedText}`;
}

const BRIEF_LABEL_MAP: Record<string, string> = {
  projectDescription: 'Project Scope & Goals',
  projectName: 'Project / Brand Name',
  category: 'Service Category',
  service: 'Deliverable Focus',
  timeline: 'Target Launch Window',
  inspirationLinks: 'Inspiration References',
  extraNotes: 'Additional Client Notes',
  agencyStatus: 'Agency Experience',
  showcasePermission: 'Case Study Consent',
  client_message: 'Inbound Client Message',
  businessType: 'Business Classification',
  instagramId: 'Social Coordinate',
  language: 'Preferred Language',
  referral: 'Referral Source',
  website: 'Existing Website',
  industry: 'Market Sector',
};

/**
 * Formats snake_case or camelCase object keys into clean human titles.
 * @param key Raw key from brief questionnaire payload
 */
export function formatBriefLabel(key: string): string {
  if (BRIEF_LABEL_MAP[key]) {
    return BRIEF_LABEL_MAP[key];
  }
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toUpperCase();
}

/**
 * Formats heterogeneous values into readable string representations.
 * @param value Raw brief answer value
 */
export function formatBriefValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not Specified';
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

/**
 * Extracts uppercase 2-letter avatar initials from a team member name.
 * Defaults to 'UN' for unassigned or missing personnel.
 * @param name Full name string
 */
export function getDossierInitials(name: string | null | undefined): string {
  if (!name || name.trim() === '' || name === 'Unassigned') {
    return 'UN';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Filters out internal timestamps, technical keys, and non-informative empty keys from brief payloads.
 * @param payload Raw brief payload JSONB
 */
export function extractBriefEntries(
  payload: Record<string, unknown> | null
): [string, unknown][] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  const EXCLUDED_KEYS = [
    'submitted_at',
    '_timestamp',
    'created_at',
    'creator_id',
    'created_via',
    'creator_name',
    'creator_role',
    'phone_warning',
    'idempotencyKey',
    'idempotency_key',
    // Synthetic benchmark & test simulation metadata keys
    'synthetic_benchmark',
    'batch_id',
    'lead_index',
    'benchmark_run',
    'simulated',
    'simulated_at',
    'simulated_by',
    'submissionId',
    'source_channel',
    'estimated_budget',
    'service_interest',
  ];
  return Object.entries(payload).filter(
    ([key, val]) =>
      val !== null &&
      val !== undefined &&
      val !== '' &&
      !EXCLUDED_KEYS.includes(key)
  );
}

/**
 * Formats an ISO timestamp into a concise, human-readable relative duration.
 * @param isoString ISO date string
 * @param referenceDate Optional current reference date (defaults to Date.now())
 */
export function formatRelativeTime(
  isoString: string | null | undefined,
  referenceDate: Date = new Date()
): string {
  if (!isoString) return 'Pending';
  const target = new Date(isoString);
  if (isNaN(target.getTime())) return 'Invalid Date';

  const diffMs = referenceDate.getTime() - target.getTime();
  if (diffMs < 0) {
    const futureDiffMin = Math.round(Math.abs(diffMs) / 60000);
    if (futureDiffMin < 60) return `in ${futureDiffMin}m`;
    const futureDiffHours = Math.round(futureDiffMin / 60);
    if (futureDiffHours < 24) return `in ${futureDiffHours}h`;
    const futureDiffDays = Math.round(futureDiffHours / 24);
    return `in ${futureDiffDays}d`;
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: target.getFullYear() === referenceDate.getFullYear() ? undefined : 'numeric',
  });
}

/**
 * Formats a duration in seconds into a standard commercial telephony clock string (e.g. '4m 30s').
 * @param totalSeconds Duration in seconds
 */
export function formatCallDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

/**
 * Tokenizes interactive note text extracting @teammate mentions and #operational tags
 * without resorting to dangerous innerHTML injections.
 * Enforces boundary checks so email addresses (e.g. client@domain.com) are preserved as plain text.
 * @param text Unformatted raw text
 */
export function parseMentionsAndTags(
  text: string
): { type: 'text' | 'mention' | 'tag'; value: string }[] {
  if (!text) return [];
  const regex = /(^|\s)([@#][a-zA-Z0-9_-]+)/g;
  const parts: { type: 'text' | 'mention' | 'tag'; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const prefixWhitespace = match[1];
    const token = match[2];
    const tokenStartIndex = match.index + prefixWhitespace.length;

    if (tokenStartIndex > lastIndex) {
      parts.push({
        type: 'text',
        value: text.substring(lastIndex, tokenStartIndex),
      });
    }

    if (token.startsWith('@')) {
      parts.push({ type: 'mention', value: token });
    } else {
      parts.push({ type: 'tag', value: token });
    }

    lastIndex = tokenStartIndex + token.length;
    regex.lastIndex = lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      value: text.substring(lastIndex),
    });
  }

  return parts;
}

export interface AuditDeltaRecord {
  narrative: string;
  isSystemInternal: boolean;
  deltaPills: string[];
}

/**
 * Decodes database audit log change deltas into human-readable commercial narratives.
 * Parses JSONB payloads from trg_audit_lead_changes and eliminates repetitive
 * 'Automated system update' filler text.
 */
export function formatAuditDeltaNarrative(
  description: string,
  metadata?: {
    changes?: Record<string, { old: unknown; new: unknown }>;
    [key: string]: unknown;
  } | null,
  statusCatalog?: Array<{ id: string; name: string }>,
  assigneeCatalog?: Array<{ id: string; full_name: string }>
): AuditDeltaRecord {
  const changes = metadata?.changes;
  if (!changes || Object.keys(changes).length === 0) {
    if (description === 'Automated system update' || description === 'System telemetry cadence verified') {
      return { narrative: 'System telemetry cadence verified', isSystemInternal: true, deltaPills: [] };
    }
    return { narrative: description, isSystemInternal: false, deltaPills: [] };
  }

  const parts: string[] = [];
  const deltaPills: string[] = [];

  // 1. Stage transition
  if (changes.status_id || changes.status) {
    const rawNew = (changes.status_id?.new ?? changes.status?.new) as string;
    const matched = statusCatalog?.find((s) => s.id === rawNew);
    const statusName = matched ? matched.name : String(rawNew);
    parts.push(`Stage transitioned to ${statusName}`);
    deltaPills.push(`Stage: ${statusName}`);
  }

  // 2. Valuation delta
  if (changes.expected_value) {
    const newVal = Number(changes.expected_value.new);
    const formatted = formatDossierCurrency(newVal);
    parts.push(`Valuation adjusted to ${formatted}`);
    deltaPills.push(`Valuation: ${formatted}`);
  }

  // 3. Next follow-up commitment
  if (changes.next_follow_up || changes.follow_up_date) {
    const rawDate = (changes.next_follow_up?.new ?? changes.follow_up_date?.new) as string;
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      const formattedDate = isNaN(parsedDate.getTime())
        ? String(rawDate)
        : parsedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
      parts.push(`Follow-up committed for ${formattedDate}`);
      deltaPills.push(`Follow-up: ${formattedDate}`);
    }
  }

  // 4. Account reassignment
  if (changes.assigned_to) {
    const newAssigneeId = changes.assigned_to.new as string;
    const member = assigneeCatalog?.find((m) => m.id === newAssigneeId);
    const assigneeName = member ? member.full_name : 'team member';
    parts.push(`Account reassigned to ${assigneeName}`);
    deltaPills.push(`Assignee: ${assigneeName}`);
  }

  // 5. Commercial priority
  if (changes.priority) {
    const newPriority = String(changes.priority.new);
    parts.push(`Priority updated to ${newPriority}`);
    deltaPills.push(`Priority: ${newPriority}`);
  }

  // 6. Ingestion budget bracket
  if (changes.budget_bracket) {
    const newBracket = String(changes.budget_bracket.new);
    parts.push(`Budget tier updated to ${newBracket}`);
    deltaPills.push(`Budget: ${newBracket}`);
  }

  // 7. Service vertical
  if (changes.service_category) {
    const newCategory = String(changes.service_category.new);
    parts.push(`Service vertical set to ${newCategory}`);
    deltaPills.push(`Service: ${newCategory}`);
  }

  // 8. Executive deal notes
  if (changes.notes) {
    parts.push('Executive notes updated');
    deltaPills.push('Notes updated');
  }

  // 9. Contact coordinates
  const contactKeys = ['phone', 'email', 'company', 'company_website'].filter((k) => k in changes);
  if (contactKeys.length > 0) {
    parts.push(`Contact coordinates updated (${contactKeys.join(', ')})`);
    deltaPills.push('Coordinates updated');
  }

  if (parts.length > 0) {
    return {
      narrative: parts.join(' · '),
      isSystemInternal: false,
      deltaPills,
    };
  }

  if (description === 'Automated system update') {
    return { narrative: 'System telemetry cadence verified', isSystemInternal: true, deltaPills: [] };
  }

  return { narrative: description, isSystemInternal: false, deltaPills: [] };
}
