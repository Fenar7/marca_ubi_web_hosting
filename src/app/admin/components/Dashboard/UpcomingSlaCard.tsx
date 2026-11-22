import Link from "next/link";
import type { OverviewQueue } from "@/app/admin/lib/dashboardContracts";
import type { OverviewRecord } from "./OverviewWorkspace";
import {
  followUpTiming,
  RecordDate,
  RecordName,
} from "./OverviewRecordDetails";
import styles from "./UpcomingSlaCard.module.scss";

export interface UpcomingSlaCardProps {
  records: OverviewRecord[];
  recordsReady: boolean;
  generatedAt: string;
  canTasks: boolean;
  queueCounts: Record<OverviewQueue, number | null>;
}

/** Counts refer to the full authorized queue, even when the due-date preview is limited. */
export function UpcomingSlaCard({
  records,
  recordsReady,
  generatedAt,
  queueCounts,
  canTasks,
}: UpcomingSlaCardProps) {
  if (!canTasks) return null;
  return (
    <section className={styles.panel} aria-label="Follow-ups">
      <header>
        <h2>Follow-ups</h2>
        <Link href="/admin/tasks">
          Open queue <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <dl className={styles.totals}>
        {(
          [
            ["overdue", "Overdue"],
            ["today", "Due today"],
            ["unassigned", "Unassigned, unscheduled"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} data-urgency={key}>
            <dt>{label}</dt>
            <dd>{queueCounts[key] ?? "Unavailable"}</dd>
          </div>
        ))}
      </dl>
      <h3>
        Next follow-ups by due date <small>(UTC)</small>
      </h3>
      {!recordsReady ? (
        <p>Follow-up dates are unavailable.</p>
      ) : !records.length ? (
        <p>No follow-ups scheduled.</p>
      ) : (
        <ul className={styles.list}>
          {records.map((record) => {
            const timing = followUpTiming(record.due, generatedAt);
            return (
              <li key={record.id}>
                <RecordName record={record} />
                <div className={styles.when}>
                  <RecordDate value={record.due} missing="Unscheduled" />
                  {timing && <small data-timing={timing}>{timing}</small>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
