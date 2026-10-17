/**
 * @file notifications.ts
 * @description Studio Alert Dispatch Bridge for the Marca Ubi Sales Funnel CRM.
 * @architecture Implements Master PRD Section 15.12 Package 5.2.4:
 *               Asynchronous notification dispatcher firing alerts upon successful
 *               lead ingestion, duplicate re-engagement, or account reactivation.
 *               Enforces a strict 3,000ms network timeout and error boundaries to guarantee
 *               client form response times remain well under the 600ms latency budget.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type StudioAlertAction =
  | 'NEW_LEAD'
  | 'MERGE_INQUIRY'
  | 'REACTIVATE_LEAD'
  | 'CREATE_NEW_REENGAGEMENT';

export interface StudioLeadAlertPayload {
  leadId: string;
  action: StudioAlertAction;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source: string;
  serviceCategory?: string;
  expectedValue?: number;
  priority?: string;
  isDuplicate?: boolean;
  notes?: string | null;
  timestamp?: string;
}

export interface DispatchAlertResult {
  success: boolean;
  delivered: boolean;
  error?: string;
  mode: 'webhook' | 'console_audit';
}

/**
 * Formats monetary amounts into clean Indian Lakhs/Crores or USD for alert summaries.
 */
function formatAlertValue(amount?: number): string {
  if (!amount || amount === 0) return 'Undisclosed';
  if (amount >= 10000000) {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹ ${(amount / 100000).toFixed(2)} L`;
  }
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

/**
 * Asynchronously dispatches a lead notification alert to the configured internal studio webhook.
 * Non-blocking by design with isolated error boundaries.
 *
 * @param payload - Ingested lead summary metadata
 * @returns DispatchAlertResult detailing delivery status
 */
export async function dispatchStudioLeadAlert(
  payload: StudioLeadAlertPayload
): Promise<DispatchAlertResult> {
  const timestamp = payload.timestamp || new Date().toISOString();
  const webhookUrl = process.env.INTERNAL_ALERT_WEBHOOK_URL;

  const alertBody = {
    title: `[MARCA UBI CRM] Inbound Lead Event: ${payload.action}`,
    lead_id: payload.leadId,
    action: payload.action,
    client_name: payload.name,
    company: payload.company || 'Not Specified',
    email: payload.email || 'N/A',
    phone: payload.phone || 'N/A',
    lead_source: payload.source,
    service_category: payload.serviceCategory || 'General Inquiry',
    estimated_valuation: formatAlertValue(payload.expectedValue),
    priority: payload.priority || 'Medium',
    is_duplicate: Boolean(payload.isDuplicate),
    notes_preview: payload.notes ? payload.notes.substring(0, 200) : 'None provided',
    timestamp,
  };

  if (!webhookUrl) {
    // Structured console audit dispatch when webhook URL is not configured
    console.log('[STUDIO_ALERT_DISPATCH]', JSON.stringify(alertBody, null, 2));
    return {
      success: true,
      delivered: false,
      mode: 'console_audit',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MarcaUbi-CRM-AlertDispatcher/1.0',
      },
      body: JSON.stringify(alertBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[STUDIO_ALERT_WARNING] Webhook returned HTTP ${response.status}`);
      return {
        success: false,
        delivered: false,
        error: `HTTP ${response.status}`,
        mode: 'webhook',
      };
    }

    return {
      success: true,
      delivered: true,
      mode: 'webhook',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[STUDIO_ALERT_FAILED] Could not deliver webhook alert:', message);
    return {
      success: false,
      delivered: false,
      error: message,
      mode: 'webhook',
    };
  }
}
