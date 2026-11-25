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
import { useRouter } from "next/navigation";
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
  totalValue = null,
  dealCount = 0,
  categories,
  financials = true,
  onTimeframeChange,
}) => {
  const router = useRouter();
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

  // Dynamically compute real pipeline category allocations using the multi-color Marca Ubi palette
  const { activeTotal, activeDeals, resolvedList } = useMemo(() => {
    const rawTotal = typeof totalValue === "number" ? totalValue : 0;
    const rawDeals = typeof dealCount === "number" ? dealCount : 0;

    if (categories && categories.length > 0) {
      const MULTI_PALETTE = [
        {
          color: "#f97316",
          gradient: "linear-gradient(90deg, #ea580c 0%, #fb923c 100%)",
        },
        {
          color: "#ea002a",
          gradient: "linear-gradient(90deg, #c40023 0%, #ff4d6d 100%)",
        },
        {
          color: "#4f46e5",
          gradient: "linear-gradient(90deg, #4338ca 0%, #818cf8 100%)",
        },
        {
          color: "#10b981",
          gradient: "linear-gradient(90deg, #059669 0%, #34d399 100%)",
        },
      ];
      const topItems: SpendingCategoryData[] = categories.slice(0, 4).map((cat, idx) => ({
        name: cat.name,
        value: financials ? cat.value : cat.count,
        color: MULTI_PALETTE[idx]?.color ?? "#4f46e5",
        gradient:
          MULTI_PALETTE[idx]?.gradient ??
          "linear-gradient(90deg, #4338ca 0%, #818cf8 100%)",
      }));
      const remainderSum = categories
        .slice(4)
        .reduce((sum, c) => sum + (financials ? c.value : c.count), 0);
      const list =
        remainderSum > 0
          ? [
              ...topItems,
              {
                name: "Others",
                value: remainderSum,
                color: "#cbd5e1",
                gradient: "linear-gradient(90deg, #cbd5e1 0%, #e2e8f0 100%)",
              },
            ]
          : topItems;
      return {
        activeTotal: rawTotal,
        activeDeals: rawDeals,
        resolvedList: list,
      };
    }

    const computed = computeSpendingBreakdownForCadence(selectedTimeframe, rawTotal, rawDeals);
    return {
      activeTotal: computed.totalValue,
      activeDeals: computed.dealCount,
      resolvedList: computed.categories,
    };
  }, [selectedTimeframe, totalValue, dealCount, categories, financials]);

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
          <h2 className={styles.title}>Practice Allocation</h2>
          <span
            className={styles.infoIcon}
            title="Categorical allocation and volume distribution across active advisory accounts"
            aria-label="Information regarding practice allocation"
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
            <svg
              className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.dropdownArrowOpen : ""}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
        <button
          type="button"
          className={styles.trendPill}
          onClick={() => router.push("/admin/deals")}
          aria-label={`${activeDeals} active deals, inspect in deals ledger`}
        >
          <span>{activeDeals} Active Deals</span>
          <span className={styles.trendArrow} aria-hidden="true">↗</span>
        </button>
      </div>

      {/* Breakdown Section: Horizontal Legend + Continuous Capsule Bar */}
      <div className={styles.breakdownSection}>
        <h3 className={styles.breakdownTitle}>Practice Breakdown</h3>

        {/* Horizontal Legend */}
        <div className={styles.legendRow}>
          {resolvedList.map((item) => (
            <button
              key={item.name}
              type="button"
              className={styles.legendItem}
              onClick={() => router.push(`/admin/deals?search=${encodeURIComponent(item.name)}`)}
              aria-label={`View deals for ${item.name}`}
            >
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
            </button>
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
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/deals?search=${encodeURIComponent(item.name)}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/admin/deals?search=${encodeURIComponent(item.name)}`);
                  }
                }}
                aria-label={`Filter deals by ${item.name}`}
                style={{
                  width: `${pct}%`,
                  background: item.gradient,
                }}
              >
                <div className={styles.segmentTooltip}>
                  {item.name}: {financials ? formatCrmCurrency(item.value) : "Confidential"} ({Math.round((item.value / totalSum) * 100)}%) ↗
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};
