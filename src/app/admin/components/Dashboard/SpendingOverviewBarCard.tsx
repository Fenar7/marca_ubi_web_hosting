import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./SpendingOverviewBarCard.module.scss";

export interface SpendingOverviewBarCardProps {
  totalValue: number | null;
  dealCount: number | null;
  categories: { name: string; value: number; count: number }[];
  financials: boolean;
}

/** Show the current pipeline snapshot while keeping amounts out of restricted views. */
export function SpendingOverviewBarCard({
  totalValue,
  dealCount,
  categories,
  financials,
}: SpendingOverviewBarCardProps) {
  return (
    <article className={styles.cardContainer} aria-label="Pipeline by service">
      <header className={styles.cardHeader}>
        <h2 className={styles.title}>Pipeline by service</h2>
        <span className={styles.scope}>Current pipeline</span>
      </header>
      <div className={styles.heroRow}>
        <span className={styles.heroValuation}>
          {!financials ? "Confidential" : totalValue === null ? "Unavailable" : formatCrmCurrency(totalValue)}
        </span>
        {dealCount !== null && <span>{dealCount} active {dealCount === 1 ? "deal" : "deals"}</span>}
      </div>

      {categories.length > 0 ? (
        <ul className={styles.serviceList}>
          {categories.map(({ name, value, count }) => (
            <li key={name}>
              <span className={styles.serviceName}>{name}</span>
              <span>{financials ? formatCrmCurrency(value) : `${count} ${count === 1 ? "deal" : "deals"}`}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyState}>No service breakdown available.</p>
      )}
    </article>
  );
}
