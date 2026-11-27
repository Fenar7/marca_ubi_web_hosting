import React from 'react';
import Link from 'next/link';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './PracticeMatrix.module.scss';

/**
 * Aggregated pipeline metrics for a single agency service line.
 */
export interface PracticeCategoryItem {
  categoryName: string;
  activeDealsCount: number;
  activePipelineValue: number;
  convertedDealsCount: number;
  convertedRevenueValue: number;
  winRatePercentage: number;
  portfolioSharePercentage: number;
  colorCode: string;
}

/**
 * Props for the service-line pipeline breakdown card.
 */
export interface PracticeMatrixProps {
  categories: PracticeCategoryItem[];
  totalPipelineValue: number;
}

/**
 * Displays open pipeline value split by service line with a proportional share bar
 * and 10px rounded-square color swatches linking directly to filtered leads.
 */
export const PracticeMatrix: React.FC<PracticeMatrixProps> = ({
  categories,
}) => {
  return (
    <div className={styles.matrixContainer}>
      <div className={styles.matrixHeader}>
        <div>
          <h3 className={styles.matrixTitle}>Deals by Service</h3>
          <p className={styles.matrixSubtitle}>
            Open pipeline value split across services.
          </p>
        </div>
      </div>

      <div className={styles.segmentedBar} aria-label="Service pipeline share bar">
        {categories.map((cat) => (
          <div
            key={cat.categoryName}
            className={styles.segment}
            style={{
              width: `${Math.max(2, cat.portfolioSharePercentage)}%`,
              backgroundColor: cat.colorCode || '#111111',
            }}
            title={`${cat.categoryName}: ${cat.portfolioSharePercentage.toFixed(1)}%`}
          />
        ))}
      </div>

      <div className={styles.categoryList}>
        {categories.map((cat) => {
          const swatchColor = cat.colorCode && cat.colorCode !== '#ffffff' ? cat.colorCode : '#4338ca';

          return (
            <Link
              key={cat.categoryName}
              href={`/admin/leads?search=${encodeURIComponent(cat.categoryName)}`}
              className={styles.categoryRow}
            >
              <div className={styles.catLeft}>
                <span
                  className={styles.catSwatch}
                  style={{ backgroundColor: swatchColor }}
                  aria-hidden="true"
                />
                <span className={styles.catName}>{cat.categoryName}</span>
              </div>

              <div className={styles.catRight}>
                <span className={styles.catShare}>
                  {cat.portfolioSharePercentage.toFixed(1)}% · {cat.activeDealsCount} deals
                </span>
                <strong className={styles.catVal}>
                  {formatCrmCurrency(cat.activePipelineValue)}
                </strong>
                <svg
                  className={styles.chevron}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
