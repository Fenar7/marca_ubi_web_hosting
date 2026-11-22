import Link from "next/link";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./OverviewRecordDetails.module.scss";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** UTC calendar dates keep labels aligned with the server's follow-up queue windows. */
export function overviewDate(value: string | null) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

/** A missing due date is unscheduled. A missing snapshot time cannot establish urgency. */
export function followUpTiming(due: string | null, generatedAt: string) {
  const date = overviewDate(due);
  const snapshot = overviewDate(generatedAt);
  if (!date || !snapshot) return null;
  const day = date.toISOString().slice(0, 10);
  const today = snapshot.toISOString().slice(0, 10);
  if (day < today) return "Overdue";
  if (day === today) return "Due today";
  return "Upcoming";
}

/** Native links support keyboard navigation and opening an authorized dossier in a new tab. */
export function RecordName({ record }: { record: OverviewRecord }) {
  const title = record.company || record.name || record.leadId;
  const secondary =
    record.company && record.name !== title ? record.name : null;
  return (
    <div className={styles.identity}>
      {record.href ? (
        <Link href={record.href} className={styles.name}>
          {title}
        </Link>
      ) : (
        <span className={styles.name}>{title}</span>
      )}
      {secondary && <span className={styles.secondary}>{secondary}</span>}
    </div>
  );
}

/** The same date string is rendered during SSR and hydration regardless of the host timezone. */
export function RecordDate({
  value,
  missing,
}: {
  value: string | null;
  missing: string;
}) {
  const date = overviewDate(value);
  return date ? (
    <time dateTime={date.toISOString()}>{dateFormat.format(date)}</time>
  ) : (
    <span>{missing}</span>
  );
}
