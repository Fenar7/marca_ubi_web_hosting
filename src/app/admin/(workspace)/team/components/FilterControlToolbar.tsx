'use client';

/**
 * @file FilterControlToolbar.tsx
 * @description PrimeStay-inspired luxury search, filter, and view toggling toolbar.
 *              Coordinates instant client-side fuzzy searching with role and status filtering.
 * @module app/admin/team/components/FilterControlToolbar
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { CrmUserRole, ProfileAccountStatus } from '@/types/crm';
import styles from './FilterControlToolbar.module.scss';

export type ViewMode = 'grid' | 'table';

interface FilterControlToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: CrmUserRole | 'all';
  onRoleChange: (role: CrmUserRole | 'all') => void;
  selectedStatus: ProfileAccountStatus | 'all';
  onStatusChange: (status: ProfileAccountStatus | 'all') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function FilterControlToolbar({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
}: FilterControlToolbarProps): React.ReactElement {
  return (
    <div className={styles.toolbar} role="search" aria-label="Personnel filter toolbar">
      <div className={styles.leftControls}>
        {/* Search input with clear button */}
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search personnel by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search personnel by name or email"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Role Filter Selector */}
        <select
          className={styles.selectDropdown}
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value as CrmUserRole | 'all')}
          aria-label="Filter by organizational role"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="sales_executive">Sales Executives</option>
          <option value="sales_manager">Sales Managers</option>
          <option value="viewer">Viewers</option>
        </select>

        {/* Status Filter Selector */}
        <select
          className={styles.selectDropdown}
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as ProfileAccountStatus | 'all')}
          aria-label="Filter by account status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Members</option>
          <option value="suspended">Suspended Accounts</option>
        </select>
      </div>

      <div className={styles.rightControls}>
        {/* View Mode Toggle: Grid vs. Table */}
        <div className={styles.viewModeToggle} role="group" aria-label="View layout mode">
          <button
            type="button"
            className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.viewModeActive : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid card view"
            aria-pressed={viewMode === 'grid'}
            title="Card Grid View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.viewModeActive : ''}`}
            onClick={() => onViewModeChange('table')}
            aria-label="Compact table view"
            aria-pressed={viewMode === 'table'}
            title="Compact Table View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
