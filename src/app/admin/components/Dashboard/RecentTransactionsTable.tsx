import type { OverviewRecord } from "./OverviewWorkspace";
import { RecordDate, RecordName } from "./OverviewRecordDetails";
import styles from "./RecentTransactionsTable.module.scss";

export interface RecentTransactionsTableProps {
  records: OverviewRecord[];
  recordsReady: boolean;
}

/** Creation time is the only activity event represented by this query. */
export function RecentTransactionsTable({
  records,
  recordsReady,
}: RecentTransactionsTableProps) {
  return (
    <section aria-label="Recently added opportunities" className={styles.panel}>
      <h2>Recently added opportunities</h2>
      {!recordsReady ? (
        <p>Recent opportunities are unavailable.</p>
      ) : !records.length ? (
        <p>No open opportunities yet.</p>
      ) : (
        <ul className={styles.feed}>
          {records.slice(0, 4).map((record) => (
            <li key={record.id}>
              <RecordName record={record} />
              <span className={styles.date}>
                <RecordDate
                  value={record.createdAt}
                  missing="Date unavailable"
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
