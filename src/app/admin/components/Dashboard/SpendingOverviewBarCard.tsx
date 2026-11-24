"use client";

/**
 * @file SpendingOverviewBarCard.tsx
 * @description Master Spending Overview Card modeled 1:1 after the Fundora benchmark archetype.
 *              Features Swiss Helvetica Neue 300 Light numerals, dynamic active deals badge,
 *              horizontal category legend, 38px continuous rounded gradient capsule bar
 *              with the Marca Ubi Editorial Luxury palette (zero generic blue),
 *              accessible timeframe dropdown, and zero vertical table lists.
 * @module admin/components/Dashboard/SpendingOverviewBarCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import {
  type CardTimeframe,
  CARD_TIMEFRAME_OPTIONS,
  type SpendingCategoryData,
  computeSpendingBreakdownForCadence,
} from "@/app/admin/lib/timeframeUtils";
import styles from "./SpendingOverviewBarCard.module.scss";

export interface SpendingOverviewBarCardProps {
  totalValue?: number | null;
  dealCount?: number | null;
  timeframeLabel?: string;
  categories?: { name: string; value: number; count: number }[];
  financials?: boolean;
  onTimeframeChange?: (timeframe: CardTimeframe) => void;
}

export const SpendingOverviewBarCard: React.FC<SpendingOverviewBarCardProps> = ({
  totalValue = 6540000,
  dealCount = 39,
  categories,
  financials = true,
  onTimeframeChange,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Decoupled interactive timeframe state
  const [selectedTimeframe, setSelectedTimeframe] = useState<CardTimeframe>("this_month");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Click outside and keyboard event handlers
  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSelectTimeframe = (slug: CardTimeframe) => {
    setSelectedTimeframe(slug);
    setIsDropdownOpen(false);
    triggerRef.current?.focus();
    if (onTimeframeChange) {
      onTimeframeChange(slug);
    }
  };

  // Dynamically compute spending allocations for the selected cadence
  const { activeTotal, activeDeals, resolvedList } = useMemo(() => {
    const rawTotal = typeof totalValue === "number" ? totalValue : 6540000;
    const rawDeals = typeof dealCount === "number" ? dealCount : 39;
    const computed = computeSpendingBreakdownForCadence(selectedTimeframe, rawTotal, rawDeals);

    // If custom non-empty categories were provided by props for default view, preserve their names
    if (categories && categories.length > 0 && selectedTimeframe === "this_month") {
      const topItems: SpendingCategoryData[] = categories.slice(0, 2).map((cat, idx) => ({
        name: cat.name,
        value: cat.value,
        color: idx === 0 ? "#111111" : "#71717a",
        gradient:
          idx === 0
            ? "linear-gradient(90deg, #111111 0%, #27272a 100%)"
            : "linear-gradient(90deg, #52525b 0%, #a1a1aa 100%)",
      }));
      const othersSum = categories.slice(2).reduce((sum, c) => sum + c.value, 0);
      const othersItem: SpendingCategoryData = {
        name: "Others",
        value: othersSum > 0 ? othersSum : Math.max(0, rawTotal - topItems.reduce((s, i) => s + i.value, 0)),
        color: "#d4d4d8",
        gradient: "linear-gradient(90deg, #e4e4e7 0%, #f4f4f5 100%)",
      };
      return {
        activeTotal: rawTotal,
        activeDeals: rawDeals,
        resolvedList: [...topItems, othersItem],
      };
    }

    return {
      activeTotal: computed.totalValue,
      activeDeals: computed.dealCount,
      resolvedList: computed.categories,
    };
  }, [selectedTimeframe, totalValue, dealCount, categories]);

  const displayTotal =
    financials && activeTotal !== null ? formatCrmCurrency(activeTotal) : "Confidential";

  const totalSum = resolvedList.reduce((acc, curr) => acc + curr.value, 0) || 1;

  const currentOption =
    CARD_TIMEFRAME_OPTIONS.find((opt) => opt.slug === selectedTimeframe) ||
    CARD_TIMEFRAME_OPTIONS[1];

  return (
    <article
      className={styles.cardContainer}
      aria-label="Spending Overview Continuous Gradient Breakdown Card"
    >
      {/* Header: Title and Timeframe dropdown */}
      <header className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Spending Overview</h2>
          <span
            className={styles.infoIcon}
            title="Categorical allocation and spending distribution across active advisory accounts"
            aria-label="Information regarding spending overview"
          >
            ⓘ
          </span>
        </div>

        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button
            ref={triggerRef}
            type="button"
            id="spending-timeframe-trigger"
            className={`${styles.dropdownButton} ${isDropdownOpen ? styles.dropdownButtonActive : ""}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            aria-controls="spending-timeframe-menu"
            aria-label={`Timeframe filter, currently set to ${currentOption.label}`}
          >
            <span>{currentOption.label}</span>
            <span
              className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.dropdownArrowOpen : ""}`}
              aria-hidden="true"
            >
              ⌄
            </span>
          </button>

          {isDropdownOpen && (
            <ul
              id="spending-timeframe-menu"
              className={styles.dropdownMenu}
              role="listbox"
              aria-labelledby="spending-timeframe-trigger"
            >
              {CARD_TIMEFRAME_OPTIONS.map((opt) => (
                <li key={opt.slug} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedTimeframe === opt.slug}
                    className={`${styles.dropdownItem} ${
                      selectedTimeframe === opt.slug ? styles.dropdownItemActive : ""
                    }`}
                    onClick={() => handleSelectTimeframe(opt.slug)}
                  >
                    <div>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      <span className={styles.optionSubtext}>{opt.subLabel}</span>
                    </div>
                    {selectedTimeframe === opt.slug && (
                      <span className={styles.activeCheck} aria-hidden="true">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* Hero Metric & Dynamic Deal Count Badge */}
      <div className={styles.heroRow}>
        <span className={styles.heroValuation}>{displayTotal}</span>
        <span className={styles.trendPill} aria-label={`${activeDeals} active deals`}>
          {activeDeals} Active Deals
        </span>
      </div>

      {/* Breakdown Section: Horizontal Legend + Continuous Capsule Bar */}
      <div className={styles.breakdownSection}>
        <h3 className={styles.breakdownTitle}>Spending Breakdown</h3>

        {/* Horizontal Legend */}
        <div className={styles.legendRow}>
          {resolvedList.map((item) => (
            <div key={item.name} className={styles.legendItem}>
              <div className={styles.legendHeader}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className={styles.legendLabel}>{item.name}</span>
              </div>
              <span className={styles.legendAmount}>
                {financials ? formatCrmCurrency(item.value) : "Confidential"}
              </span>
            </div>
          ))}
        </div>

        {/* 38px Continuous Rounded Gradient Pill Bar (Marca Ubi Editorial Palette) */}
        <div
          className={styles.gradientPillTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
          aria-label="Spending breakdown proportions"
        >
          {resolvedList.map((item) => {
            const pct = Math.max(8, (item.value / totalSum) * 100);
            return (
              <div
                key={item.name}
                className={styles.gradientSegment}
                style={{
                  width: `${pct}%`,
                  background: item.gradient,
                }}
              >
                <div className={styles.segmentTooltip}>
                  {item.name}: {financials ? formatCrmCurrency(item.value) : "Confidential"} ({Math.round((item.value / totalSum) * 100)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};
