import React from 'react';
import styles from './FloatingBatchActionBar.module.scss';

export interface FloatingBatchActionBarProps {
  selectedCount: number;
  onReassign: () => void;
  onTransitionStage: () => void;
  onExportCsv: () => void;
  onClear: () => void;
  isExporting?: boolean;
}

export const FloatingBatchActionBar: React.FC<FloatingBatchActionBarProps> = ({
  selectedCount,
  onReassign,
  onTransitionStage,
  onExportCsv,
  onClear,
  isExporting = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={styles.floatingDock}
      role="toolbar"
      aria-label="Bulk lead operations toolbar"
    >
      <div className={styles.dockCount}>
        <span className={styles.countBadge}>{selectedCount}</span>
        <span>{selectedCount === 1 ? 'deal selected' : 'deals selected'}</span>
      </div>

      <div className={styles.dockActions}>
        <button
          type="button"
          onClick={onTransitionStage}
          className={styles.dockBtn}
          aria-label="Advance or modify status for selected leads"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>Update Stage</span>
        </button>

        <button
          type="button"
          onClick={onReassign}
          className={styles.dockBtn}
          aria-label="Reassign selected leads to representative"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <span>Reassign</span>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          disabled={isExporting}
          className={styles.dockBtn}
          aria-label="Export selected leads to CSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          className={styles.clearBtn}
          aria-label="Deselect all records (Escape)"
          title="Deselect all records (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};
