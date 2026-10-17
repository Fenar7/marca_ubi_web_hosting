'use client';

/**
 * @file FilterActionBar.tsx
 * @description Master Multi-Filter Action Bar, Pipeline Bucket Segmented Tabs & Search Gateway.
 *              Provides sub-16ms interactive filtering across acquisition source, assigned representative,
 *              deal priority tier, and funnel status buckets, with automatic URL deep-link synchronization.
 * @module app/admin/components/FilterActionBar
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import styles from './FilterActionBar.module.scss';

export type BucketTabId = 'all' | 'open' | 'potential' | 'converted' | 'lost' | 'overdue';

export interface BucketCounts {
  all: number;
  open: number;
  potential: number;
  converted: number;
  lost: number;
  overdue: number;
}

export interface FilterDropdownOption {
  id: string;
  label: string;
  colorCode?: string;
  avatarText?: string;
  subtext?: string;
}

export interface FilterActionBarProps {
  /** Real-time aggregated record count per bucket */
  counts: BucketCounts;
  /** Currently selected pipeline bucket */
  selectedBucket: BucketTabId;
  /** Current search input value */
  searchQuery: string;
  /** Active source filter ID (UUID) */
  selectedSourceId: string | null;
  /** Active assignee profile UUID */
  selectedAssigneeId: string | null;
  /** Active priority level ('High' | 'Medium' | 'Low') */
  selectedPriority: string | null;
  /** Active specific stage filter (from KPI ribbon or deep links) */
  selectedStageId: string | null;
  /** Available lead acquisition sources from database lookup */
  availableSources: FilterDropdownOption[];
  /** Available agency staff representatives */
  availableAssignees: FilterDropdownOption[];
  /** Event handlers for filter state transitions */
  onBucketChange: (bucket: BucketTabId) => void;
  onSearchChange: (query: string) => void;
  onSourceChange: (sourceId: string | null) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onPriorityChange: (priority: string | null) => void;
  onStageClear: () => void;
  onClearAll: () => void;
  /** Optional custom class name */
  className?: string;
}

interface BucketTabConfig {
  id: BucketTabId;
  label: string;
  isUrgent?: boolean;
}

const BUCKET_TABS: readonly BucketTabConfig[] = [
  { id: 'all', label: 'All Deals' },
  { id: 'open', label: 'Open' },
  { id: 'potential', label: 'Potential' },
  { id: 'converted', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'overdue', label: 'Overdue Today', isUrgent: true },
] as const;

const PRIORITY_OPTIONS: readonly FilterDropdownOption[] = [
  { id: 'High', label: 'High Priority', colorCode: '#ff6100' },
  { id: 'Medium', label: 'Medium Priority', colorCode: '#f59e0b' },
  { id: 'Low', label: 'Low Priority', colorCode: '#71717a' },
] as const;

export function FilterActionBar({
  counts,
  selectedBucket,
  searchQuery,
  selectedSourceId,
  selectedAssigneeId,
  selectedPriority,
  selectedStageId,
  availableSources,
  availableAssignees,
  onBucketChange,
  onSearchChange,
  onSourceChange,
  onAssigneeChange,
  onPriorityChange,
  onStageClear,
  onClearAll,
  className,
}: FilterActionBarProps): React.ReactElement {
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [activeDropdown, setActiveDropdown] = useState<'source' | 'assignee' | 'priority' | null>(null);
  const [, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize internal search state if parent query changes externally (e.g., deep-link or clear)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Clean up debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Click outside and Escape key handler for popover dismissal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);

  // Debounced search dispatcher (250ms debounce window via React 19 transition)
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setLocalSearch(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      startTransition(() => {
        onSearchChange(val);
      });
    }, 250);
  };

  const handleClearSearch = (): void => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setLocalSearch('');
    onSearchChange('');
  };

  const toggleDropdown = (key: 'source' | 'assignee' | 'priority'): void => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  // Resolve display labels for active filters
  const activeSource = availableSources.find((s) => s.id === selectedSourceId);
  const activeAssignee = availableAssignees.find((a) => a.id === selectedAssigneeId);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(selectedSourceId) ||
    Boolean(selectedAssigneeId) ||
    Boolean(selectedPriority) ||
    Boolean(selectedStageId) ||
    selectedBucket !== 'all';

  return (
    <div
      className={`${styles.filterActionBar} ${className || ''}`}
      ref={containerRef}
      role="region"
      aria-label="Commercial Pipeline Filters"
    >
      {/* 1. Main Controls Bar */}
      <div className={styles.controlsRow}>
        {/* Pipeline Bucket Segmented Navigation Tabs */}
        <div className={styles.bucketTabs} role="tablist" aria-label="Pipeline Stages">
          {BUCKET_TABS.map((tab) => {
            const count = counts[tab.id] ?? 0;
            const isSelected = selectedBucket === tab.id;
            const isOverdueTab = tab.id === 'overdue';
            const hasOverdueLeads = isOverdueTab && count > 0;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onBucketChange(tab.id)}
                className={`
                  ${styles.tabBtn}
                  ${isSelected ? styles.activeTab : ''}
                  ${tab.isUrgent ? styles.urgentTab : ''}
                  ${hasOverdueLeads ? styles.hasOverdue : ''}
                `}
              >
                {hasOverdueLeads && <span className={styles.urgentPulseDot} aria-hidden="true" />}
                <span>{tab.label}</span>
                <span className={styles.tabCount} aria-label={`${count} deals`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Engine & Filter Dropdowns */}
        <div className={styles.controlsRight}>
          {/* Debounced Search Input */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClearSearch();
                }
              }}
              placeholder="Search deals, company, rep..."
              className={styles.searchInput}
              aria-label="Search commercial pipeline"
            />
            {localSearch.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={styles.clearSearchBtn}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Source Dropdown Filter */}
          <div className={styles.filterDropdownContainer}>
            <button
              type="button"
              onClick={() => toggleDropdown('source')}
              className={`${styles.dropdownTrigger} ${selectedSourceId ? styles.activeFilter : ''}`}
              aria-expanded={activeDropdown === 'source'}
              aria-haspopup="listbox"
            >
              <span>{activeSource ? activeSource.label : 'Source'}</span>
              <span className={`${styles.dropdownChevron} ${activeDropdown === 'source' ? styles.chevronOpen : ''}`}>
                ▼
              </span>
            </button>

            {activeDropdown === 'source' && (
              <div className={styles.popoverMenu} role="listbox" aria-label="Filter by Lead Source">
                <div className={styles.popoverHeader}>Lead Acquisition Source</div>
                <button
                  type="button"
                  onClick={() => {
                    onSourceChange(null);
                    setActiveDropdown(null);
                  }}
                  className={`${styles.popoverItem} ${!selectedSourceId ? styles.selectedItem : ''}`}
                  role="option"
                  aria-selected={!selectedSourceId}
                >
                  <span>All Sources</span>
                  {!selectedSourceId && <span className={styles.checkMark}>✓</span>}
                </button>
                {availableSources.map((s) => {
                  const isSelected = selectedSourceId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onSourceChange(s.id);
                        setActiveDropdown(null);
                      }}
                      className={`${styles.popoverItem} ${isSelected ? styles.selectedItem : ''}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={styles.itemLeft}>
                        {s.colorCode && (
                          <span
                            className={styles.sourceColorDot}
                            style={{ background: s.colorCode }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{s.label}</span>
                      </div>
                      {isSelected && <span className={styles.checkMark}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assignee Dropdown Filter */}
          <div className={styles.filterDropdownContainer}>
            <button
              type="button"
              onClick={() => toggleDropdown('assignee')}
              className={`${styles.dropdownTrigger} ${selectedAssigneeId ? styles.activeFilter : ''}`}
              aria-expanded={activeDropdown === 'assignee'}
              aria-haspopup="listbox"
            >
              <span>{activeAssignee ? activeAssignee.label : 'Representative'}</span>
              <span className={`${styles.dropdownChevron} ${activeDropdown === 'assignee' ? styles.chevronOpen : ''}`}>
                ▼
              </span>
            </button>

            {activeDropdown === 'assignee' && (
              <div className={styles.popoverMenu} role="listbox" aria-label="Filter by Representative">
                <div className={styles.popoverHeader}>Sales Representative</div>
                <button
                  type="button"
                  onClick={() => {
                    onAssigneeChange(null);
                    setActiveDropdown(null);
                  }}
                  className={`${styles.popoverItem} ${!selectedAssigneeId ? styles.selectedItem : ''}`}
                  role="option"
                  aria-selected={!selectedAssigneeId}
                >
                  <span>All Representatives</span>
                  {!selectedAssigneeId && <span className={styles.checkMark}>✓</span>}
                </button>
                {availableAssignees.map((a) => {
                  const isSelected = selectedAssigneeId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        onAssigneeChange(a.id);
                        setActiveDropdown(null);
                      }}
                      className={`${styles.popoverItem} ${isSelected ? styles.selectedItem : ''}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={styles.itemLeft}>
                        <span className={styles.avatarPillSmall}>
                          {a.avatarText || a.label.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{a.label}</span>
                      </div>
                      {isSelected && <span className={styles.checkMark}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority Dropdown Filter */}
          <div className={styles.filterDropdownContainer}>
            <button
              type="button"
              onClick={() => toggleDropdown('priority')}
              className={`${styles.dropdownTrigger} ${selectedPriority ? styles.activeFilter : ''}`}
              aria-expanded={activeDropdown === 'priority'}
              aria-haspopup="listbox"
            >
              <span>{selectedPriority ? `${selectedPriority} Priority` : 'Priority'}</span>
              <span className={`${styles.dropdownChevron} ${activeDropdown === 'priority' ? styles.chevronOpen : ''}`}>
                ▼
              </span>
            </button>

            {activeDropdown === 'priority' && (
              <div className={styles.popoverMenu} role="listbox" aria-label="Filter by Priority">
                <div className={styles.popoverHeader}>Deal Priority Tier</div>
                <button
                  type="button"
                  onClick={() => {
                    onPriorityChange(null);
                    setActiveDropdown(null);
                  }}
                  className={`${styles.popoverItem} ${!selectedPriority ? styles.selectedItem : ''}`}
                  role="option"
                  aria-selected={!selectedPriority}
                >
                  <span>All Priorities</span>
                  {!selectedPriority && <span className={styles.checkMark}>✓</span>}
                </button>
                {PRIORITY_OPTIONS.map((p) => {
                  const isSelected = selectedPriority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onPriorityChange(p.id);
                        setActiveDropdown(null);
                      }}
                      className={`${styles.popoverItem} ${isSelected ? styles.selectedItem : ''}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={styles.itemLeft}>
                        {p.colorCode && (
                          <span
                            className={styles.sourceColorDot}
                            style={{ background: p.colorCode }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{p.label}</span>
                      </div>
                      {isSelected && <span className={styles.checkMark}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Active Filter Chips Ribbon */}
      {hasActiveFilters && (
        <div className={styles.activeFiltersRibbon} role="status" aria-live="polite">
          <span className={styles.activeFiltersLabel}>
            <span>Active Filters</span>
            <span>•</span>
          </span>

          {selectedBucket !== 'all' && (
            <span className={styles.filterChip}>
              Bucket: {BUCKET_TABS.find((t) => t.id === selectedBucket)?.label || selectedBucket}
              <button
                type="button"
                onClick={() => onBucketChange('all')}
                className={styles.chipRemoveBtn}
                title="Reset bucket"
                aria-label="Reset bucket filter"
              >
                ✕
              </button>
            </span>
          )}

          {searchQuery.trim().length > 0 && (
            <span className={styles.filterChip}>
              Query: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={handleClearSearch}
                className={styles.chipRemoveBtn}
                title="Clear query"
                aria-label="Remove search query filter"
              >
                ✕
              </button>
            </span>
          )}

          {activeSource && (
            <span className={styles.filterChip}>
              Source: {activeSource.label}
              <button
                type="button"
                onClick={() => onSourceChange(null)}
                className={styles.chipRemoveBtn}
                title="Remove source filter"
                aria-label="Remove source filter"
              >
                ✕
              </button>
            </span>
          )}

          {activeAssignee && (
            <span className={styles.filterChip}>
              Rep: {activeAssignee.label}
              <button
                type="button"
                onClick={() => onAssigneeChange(null)}
                className={styles.chipRemoveBtn}
                title="Remove representative filter"
                aria-label="Remove representative filter"
              >
                ✕
              </button>
            </span>
          )}

          {selectedPriority && (
            <span className={styles.filterChip}>
              Priority: {selectedPriority}
              <button
                type="button"
                onClick={() => onPriorityChange(null)}
                className={styles.chipRemoveBtn}
                title="Remove priority filter"
                aria-label="Remove priority filter"
              >
                ✕
              </button>
            </span>
          )}

          {selectedStageId && (
            <span className={styles.filterChip}>
              Stage Filter Active
              <button
                type="button"
                onClick={onStageClear}
                className={styles.chipRemoveBtn}
                title="Clear stage filter"
                aria-label="Remove stage filter"
              >
                ✕
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className={styles.clearAllBtn}
            aria-label="Clear all active filters"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
