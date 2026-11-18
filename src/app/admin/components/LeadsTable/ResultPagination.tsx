'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { getPageSummary } from '@/app/admin/lib/pagination';
import styles from './ResultPagination.module.scss';

interface ResultPaginationProps {
  page: number;
  pageSize: number;
  loadedCount: number;
  totalCount: number | null;
  scopeDescription?: string;
}

/** Pagination preserves active URL parameters; the page filter controls only loaded records. */
export function ResultPagination({ page, pageSize, loadedCount, totalCount, scopeDescription = 'Search covers name, company and reference. Overdue, tab counts and stage totals apply to this page.' }: ResultPaginationProps): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lastPage, firstRecord, lastRecord, hasPrevious, hasNext } = getPageSummary(page, pageSize, loadedCount, totalCount);

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
        <span>{totalCount === null
          ? `Showing ${firstRecord.toLocaleString('en-IN')} to ${lastRecord.toLocaleString('en-IN')}; total unavailable`
          : `Showing ${firstRecord.toLocaleString('en-IN')} to ${lastRecord.toLocaleString('en-IN')} of ${totalCount.toLocaleString('en-IN')} records`}</span>
        <span>{scopeDescription}</span>
      </div>
      <div className={styles.controls}>
        {lastPage !== null && page > lastPage && <Link href={pageHref(1)}>First page</Link>}
        {hasPrevious ? <Link href={pageHref(page - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
        <span aria-current="page">Page {page.toLocaleString('en-IN')}{lastPage === null ? '' : ` of ${lastPage.toLocaleString('en-IN')}`}</span>
        {hasNext ? <Link href={pageHref(page + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}
      </div>
    </nav>
  );
}
