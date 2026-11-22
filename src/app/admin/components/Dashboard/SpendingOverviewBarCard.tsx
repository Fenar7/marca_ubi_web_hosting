import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./SpendingOverviewBarCard.module.scss";

export interface SpendingOverviewBarCardProps {
  totalValue: number | null;
  dealCount: number | null;
  categories: { name: string; value: number; count: number }[];
  financials: boolean;
}

/** Every segment and label uses the same denominator, including services grouped into Other. */
export function SpendingOverviewBarCard({ totalValue, dealCount, categories, financials }: SpendingOverviewBarCardProps) {
  const total = financials ? totalValue : dealCount;
  const ordered = categories.map(c => ({ name: c.name, amount: financials ? c.value : c.count }))
    .sort((a,b) => b.amount - a.amount || a.name.localeCompare(b.name));
  const items = ordered.length <= 5 ? ordered : [...ordered.slice(0,4), {name: "Other services", amount: ordered.slice(4).reduce((sum,c) => sum + c.amount,0)}];
  const format = (amount: number) => financials ? formatCrmCurrency(amount) : amount.toLocaleString("en-IN");
  return <section className={styles.panel} aria-label="Pipeline by service">
    <h2>Pipeline by service</h2><p>{financials ? "Open opportunity value" : "Open opportunity count"} · current snapshot</p>
    {total === null ? <p className={styles.empty}>Service breakdown unavailable.</p> : dealCount === 0 ? <p className={styles.empty}>No open opportunities.</p> : <>
      {total > 0 && <div aria-hidden="true" className={styles.distribution}>{items.map((item,i) => <span key={i} data-color={i} style={{width: (100 * item.amount / total) + "%"}} />)}</div>}
      <ul>{items.map((item,i) => <li key={i}><span className={styles.marker} data-color={i} aria-hidden="true"/><span>{item.name}</span><strong>{format(item.amount)}</strong></li>)}</ul>
    </>}
  </section>;
}
