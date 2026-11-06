'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './ResultPagination.module.scss';

interface ResultPaginationProps {
  page: number;
  pageSize: number;
  loadedCount: number;
  totalCount: number;
  scopeDescription?: string;
}

/** Pagination preserves active URL parameters; the page filter controls only loaded records. */
export function ResultPagination({ page, pageSize, loadedCount, totalCount, scopeDescription = 'Search covers name, company and reference. Overdue, tab counts and stage totals apply to this page.' }: ResultPaginationProps): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstRecord = loadedCount ? (page - 1) * pageSize + 1 : 0;
  const lastRecord = loadedCount ? firstRecord + loadedCount - 1 : 0;

  const pageHref = (target: number): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (target === 1) params.delete('page');
    else params.set('page', String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav className={styles.pagination} aria-label="Result pages">
      <div className={styles.description}>
        <span>Showing {firstRecord.toLocaleString('en-IN')} to {lastRecord.toLocaleString('en-IN')} of {totalCount.toLocaleString('en-IN')} records</span>
        <span>{scopeDescription}</span>
      </div>
      <div className={styles.controls}>
        {page > lastPage && <Link href={pageHref(1)}>First page</Link>}
        {page > 1 ? <Link href={pageHref(page - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
        <span aria-current="page">Page {page.toLocaleString('en-IN')} of {lastPage.toLocaleString('en-IN')}</span>
        {page < lastPage ? <Link href={pageHref(page + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}
      </div>
    </nav>
  );
}
