import styles from './ingestion.module.scss';

/** Route loading keeps the inbox layout footprint while auth and authorized data resolve. */
export default function LoadingInquiries() {
  return (
    <div
      className={styles.loading}
      role="status"
      aria-label="Loading inquiries"
    >
      <h1>Inquiries</h1>
      <p>Loading the inbox…</p>
      <div className={styles.summaryPlaceholder} aria-hidden="true" />
      <div className={styles.queuePlaceholder} aria-hidden="true" />
    </div>
  );
}
