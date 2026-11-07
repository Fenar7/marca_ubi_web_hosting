export interface PageSummary {
  firstRecord: number;
  lastRecord: number;
  lastPage: number | null;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Keeps usable range navigation when the database returns rows but cannot provide an exact count. */
export function getPageSummary(page: number, pageSize: number, loadedCount: number, totalCount: number | null): PageSummary {
  const firstRecord = loadedCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const lastRecord = loadedCount > 0 ? firstRecord + loadedCount - 1 : 0;
  const lastPage = totalCount === null ? null : Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    firstRecord,
    lastRecord,
    lastPage,
    hasPrevious: page > 1,
    hasNext: lastPage === null ? loadedCount === pageSize : page < lastPage,
  };
}
