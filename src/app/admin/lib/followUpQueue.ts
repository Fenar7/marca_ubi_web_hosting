export type FollowUpQueue = 'overdue' | 'today' | 'upcoming' | 'unassigned';

export interface UtcDayWindow {
  start: string;
  end: string;
  date: string;
}

/** UTC boundaries keep server-side queue tabs consistent across user time zones. */
export function getUtcDayWindow(now: Date): UtcDayWindow {
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endDate = new Date(startDate.getTime() + 86_400_000 - 1);
  return { start: startDate.toISOString(), end: endDate.toISOString(), date: startDate.toISOString().slice(0, 10) };
}

export function parseFollowUpQueue(value: string | undefined): FollowUpQueue {
  return value === 'today' || value === 'upcoming' || value === 'unassigned' ? value : 'overdue';
}

export function parseFollowUpPage(value: string | undefined, maxPage = 100_000): number {
  const parsed = Number(value ?? '1');
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maxPage ? parsed : 1;
}

/** Classifies timestamps at UTC day boundaries; null dates belong only to the unassigned queue. */
export function isFollowUpInQueue(
  queue: FollowUpQueue,
  timestamp: string | null,
  window: UtcDayWindow,
  unassigned = false
): boolean {
  if (queue === 'unassigned') return unassigned && timestamp === null;
  if (!timestamp) return false;
  const value = Date.parse(timestamp);
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  if (![value, start, end].every(Number.isFinite)) return false;
  if (queue === 'overdue') return value < start;
  if (queue === 'today') return value >= start && value <= end;
  return value > end;
}
