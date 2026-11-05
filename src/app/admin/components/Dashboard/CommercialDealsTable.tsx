"use client";

/**
 * @file CommercialDealsTable.tsx
 * @description High-Density Commercial Deals Ledger for Executive Overview.
 *              Benchmarked against Screenshot 131005, MedTrackr, and Linear Fluid Cards.
 *              Integrates 38px search input with Ctrl+K shortcut, category filter pills,
 *              pastel service category badges, 6px radar status dots, and context actions.
 * @module admin/components/Dashboard/CommercialDealsTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./CommercialDealsTable.module.scss";

export interface ActiveDealItem {
  id: string;
  leadId: string;
  name: string;
  company?: string | null;
  serviceCategory: string;
  stageName: string;
  stageBucket: string;
  expectedValue: number;
  nextFollowUp?: string | null;
  isOverdue?: boolean;
  priority: string;
  owner?: string | null;
}

export interface CommercialDealsTableProps {
  /** Deals array passed from server component or telemetry store */
  deals?: ActiveDealItem[];
  dataStatus?: "ready" | "unavailable";
  /** Optional click handler for custom deal selection */
  onSelectDeal?: (dealId: string) => void;
}

/**
 * Calibrated realistic active deals reflecting boutique luxury agency engagements.
 */
const CATEGORY_PILLS = [
  "All Deals",
  "Branding",
  "Web & Digital",
  "Full-Suite Advisory",
];

function formatRupees(amount: number): string {
  if (!amount || amount <= 0) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const CommercialDealsTable: React.FC<CommercialDealsTableProps> = ({
  deals = [],
  dataStatus = "ready",
  onSelectDeal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Deals");
  const [activeMenuDealId, setActiveMenuDealId] = useState<string | null>(null);
  const [copiedDealId, setCopiedDealId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const rawDeals = deals;

  // Global keyboard shortcut for Ctrl+K / Ctrl+K search focus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dismiss context menu on click outside or Escape key press
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setActiveMenuDealId(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveMenuDealId(null);
      }
    }

    if (activeMenuDealId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeMenuDealId]);

  // Filter deals based on category and search query
  const filteredDeals = useMemo(() => {
    return rawDeals.filter((deal) => {
      // Category match
      if (selectedCategory !== "All Deals") {
        const matchesCat = deal.serviceCategory
          .toLowerCase()
          .includes(selectedCategory.toLowerCase());
        if (!matchesCat) return false;
      }

      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = deal.name.toLowerCase().includes(q);
      const compMatch = deal.company
        ? deal.company.toLowerCase().includes(q)
        : false;
      const ownerMatch = deal.owner
        ? deal.owner.toLowerCase().includes(q)
        : false;
      const idMatch = deal.leadId.toLowerCase().includes(q);

      return nameMatch || compMatch || ownerMatch || idMatch;
    });
  }, [rawDeals, selectedCategory, searchQuery]);

  const handleToggleMenu = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuDealId((prev) => (prev === dealId ? null : dealId));
  };

  const handleCopyDealId = async (
    e: React.MouseEvent,
    leadId: string,
    dealId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(leadId);
        setCopiedDealId(dealId);
        setTimeout(() => setCopiedDealId(null), 2000);
      }
    } catch {
      // Fallback if clipboard API permission is blocked in browser iframe
    }
  };

  const handleOpenDossier = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuDealId(null);
    if (onSelectDeal) {
      onSelectDeal(dealId);
    } else {
      window.location.href = `/admin/leads?id=${dealId}`;
    }
  };

  return (
    <div className={styles.tableCard} aria-label="Commercial Deals Ledger">
      {/* Header & Controls */}
      <div className={styles.tableHeader}>
        <div className={styles.topRow}>
          <div className={styles.titleCluster}>
            <h2 className={styles.title}>Commercial Deals Ledger</h2>
            <p className={styles.subtitle}>
              High-ticket opportunities under active engagement
            </p>
          </div>

          <div className={styles.searchAndFilterGroup}>
            {/* 38px Search Pill */}
            <div className={styles.searchPillWrapper}>
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
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search deals, clients, or reps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search deals, clients, or reps"
              />
              <span className={styles.shortcutBadge} aria-hidden="true">
                Ctrl+K
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          className={styles.categoryPillsRow}
          role="tablist"
          aria-label="Filter by service category"
        >
          {CATEGORY_PILLS.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={selectedCategory === category}
              className={`${styles.categoryPill} ${
                selectedCategory === category ? styles.active : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Table */}
      <div className={styles.tableResponsiveWrapper}>
        <table className={styles.dealsTable} aria-label="Commercial Deals">
          <thead>
            <tr>
              <th scope="col">Client & Engagement</th>
              <th scope="col">Category</th>
              <th scope="col">Valuation</th>
              <th scope="col">Stage</th>
              <th scope="col">SLA Health</th>
              <th scope="col">Deal Owner</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {dataStatus === "unavailable" ? (
              <tr>
                <td colSpan={7} className={styles.emptyState} role="status">
                  Deal data is unavailable because the source query did not
                  complete.
                </td>
              </tr>
            ) : filteredDeals.length > 0 ? (
              filteredDeals.map((deal, idx) => {
                const initials = getInitials(deal.company || deal.name);
                const squircleTheme =
                  idx % 4 === 0
                    ? "blue"
                    : idx % 4 === 1
                      ? "purple"
                      : idx % 4 === 2
                        ? "emerald"
                        : "amber";

                // Category badge style
                const catLower = deal.serviceCategory.toLowerCase();
                const categoryClass = catLower.includes("brand")
                  ? styles.branding
                  : catLower.includes("web") || catLower.includes("digital")
                    ? styles.webDigital
                    : catLower.includes("advisor")
                      ? styles.advisory
                      : styles.other;

                // Radar status dot
                const stageLower = deal.stageName.toLowerCase();
                const radarColor = stageLower.includes("negotiat")
                  ? styles.amber
                  : stageLower.includes("proposal")
                    ? styles.orange
                    : stageLower.includes("review") ||
                        stageLower.includes("contract")
                      ? styles.emerald
                      : styles.slate;

                // SLA Overdue check
                const followUpTime = deal.nextFollowUp
                  ? Date.parse(deal.nextFollowUp)
                  : null;
                const hasValidFollowUp =
                  followUpTime !== null && Number.isFinite(followUpTime);
                const isOverdue = hasValidFollowUp && Boolean(deal.isOverdue);
                const followUpLabel = !deal.nextFollowUp
                  ? "Not scheduled"
                  : !hasValidFollowUp
                    ? "Status unavailable"
                    : isOverdue
                      ? "Overdue"
                      : "Scheduled";

                const ownerDisplay = deal.owner?.trim() || "Unassigned";
                const ownerInitials = getInitials(ownerDisplay);

                return (
                  <tr key={deal.id}>
                    {/* Client & Engagement */}
                    <td>
                      <div className={styles.clientCluster}>
                        <div
                          className={`${styles.initialsSquircle} ${styles[squircleTheme]}`}
                        >
                          {initials}
                        </div>
                        <div className={styles.clientMeta}>
                          <Link
                            className={styles.dealName}
                            href={
                              "/admin/leads?id=" + encodeURIComponent(deal.id)
                            }
                            onClick={(event) => {
                              if (!onSelectDeal) return;
                              event.preventDefault();
                              onSelectDeal(deal.id);
                            }}
                          >
                            {deal.name}
                          </Link>
                          <span className={styles.companyName}>
                            {deal.company || "Company not provided"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Service Category */}
                    <td>
                      <span
                        className={`${styles.categoryBadge} ${categoryClass}`}
                      >
                        {deal.serviceCategory}
                      </span>
                    </td>

                    {/* Deal Value */}
                    <td>
                      <span className={styles.dealValuation}>
                        {formatRupees(deal.expectedValue)}
                      </span>
                    </td>

                    {/* Stage */}
                    <td>
                      <div className={styles.statusPill}>
                        <span className={`${styles.radarDot} ${radarColor}`} />
                        <span>{deal.stageName}</span>
                      </div>
                    </td>

                    {/* SLA Health */}
                    <td>
                      <div
                        className={`${styles.slaPill} ${
                          isOverdue
                            ? styles.overdue
                            : hasValidFollowUp
                              ? styles.onTrack
                              : styles.neutral
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{followUpLabel}</span>
                      </div>
                    </td>

                    {/* Owner */}
                    <td>
                      <div className={styles.ownerCluster}>
                        <div className={styles.ownerAvatar}>
                          {ownerInitials}
                        </div>
                        <span className={styles.ownerName}>{ownerDisplay}</span>
                      </div>
                    </td>

                    {/* Action Column with Functional Context Dropdown */}
                    <td>
                      <div
                        className={styles.actionCellContainer}
                        ref={
                          activeMenuDealId === deal.id ? menuContainerRef : null
                        }
                      >
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={(e) => handleToggleMenu(e, deal.id)}
                          aria-label={`Open context menu for ${deal.name}`}
                          aria-expanded={activeMenuDealId === deal.id}
                          aria-haspopup="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>

                        {activeMenuDealId === deal.id && (
                          <div
                            className={styles.contextMenuDropdown}
                            role="menu"
                            aria-label={`Context options for ${deal.name}`}
                          >
                            <button
                              type="button"
                              className={styles.contextMenuItem}
                              role="menuitem"
                              onClick={(e) => handleOpenDossier(e, deal.id)}
                            >
                              <div className={styles.contextMenuLeft}>
                                <svg
                                  className={styles.contextMenuIcon}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                                <span>View Client Dossier</span>
                              </div>
                              <span className={styles.contextMenuBadge}>
                                Enter
                              </span>
                            </button>

                            <button
                              type="button"
                              className={styles.contextMenuItem}
                              role="menuitem"
                              onClick={(e) =>
                                handleCopyDealId(e, deal.leadId, deal.id)
                              }
                            >
                              <div className={styles.contextMenuLeft}>
                                <svg
                                  className={styles.contextMenuIcon}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="9"
                                    y="9"
                                    width="13"
                                    height="13"
                                    rx="2"
                                    ry="2"
                                  />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>
                                  {copiedDealId === deal.id
                                    ? "Copied to Clipboard!"
                                    : "Copy Deal ID"}
                                </span>
                              </div>
                              <span className={styles.contextMenuBadge}>
                                {deal.leadId}
                              </span>
                            </button>

                            <div
                              className={styles.contextMenuDivider}
                              role="separator"
                            />

                            <button
                              type="button"
                              className={styles.contextMenuItem}
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDealId(null);
                                window.location.href = `/admin/leads?id=${deal.id}&action=reassign`;
                              }}
                            >
                              <div className={styles.contextMenuLeft}>
                                <svg
                                  className={styles.contextMenuIcon}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M19 8v6m3-3h-6" />
                                </svg>
                                <span>Reassign Deal Owner</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              className={styles.contextMenuItem}
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDealId(null);
                                window.location.href = `/admin/leads?id=${deal.id}&action=stage`;
                              }}
                            >
                              <div className={styles.contextMenuLeft}>
                                <svg
                                  className={styles.contextMenuIcon}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                <span>Update Pipeline Stage</span>
                              </div>
                            </button>

                            <div
                              className={styles.contextMenuDivider}
                              role="separator"
                            />

                            <button
                              type="button"
                              className={`${styles.contextMenuItem} ${styles.destructive}`}
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDealId(null);
                                window.location.href = `/admin/leads?id=${deal.id}&action=archive`;
                              }}
                            >
                              <div className={styles.contextMenuLeft}>
                                <svg
                                  className={styles.contextMenuIcon}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span>Archive Deal</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  {rawDeals.length === 0
                    ? "No active commercial deals are available for this view."
                    : "No active commercial deals match the selected filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
