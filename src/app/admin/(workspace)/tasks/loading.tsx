/**
 * @file loading.tsx
 * @description Zero Cumulative Layout Shift (CLS < 0.01) Suspense fallback for Follow-ups.
 *              Mirrors the 4-card queue switcher and follow-up table skeleton.
 * @module admin/tasks/loading
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import styles from './tasks.module.scss';

export default function TasksLoading(): React.ReactElement {
  return (
    <main className={styles.container} aria-busy="true" aria-describedby="tasks-loading-status">
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <h1 className={styles.pageTitle}>Follow-ups</h1>
          <p id="tasks-loading-status" className={styles.pageSubtitle}>
            Loading your overdue, today&apos;s, and upcoming client calls...
          </p>
        </div>
        <div className={styles.loadingHeaderAction} aria-hidden="true" />
      </header>

      <section className={styles.queueOverview} aria-label="Loading follow-up queues">
        <div className={styles.queueTabs} aria-hidden="true">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={styles.loadingTab}>
              <div className={styles.loadingTabBody}>
                <span className={styles.loadingLineShort} />
                <span className={styles.loadingLineNum} />
                <span className={styles.loadingLineHint} />
              </div>
              <span className={styles.loadingIconBox} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.workSection} aria-label="Loading follow-ups table">
        <div className={styles.loadingWorkHeader} aria-hidden="true">
          <div className={styles.loadingLineMedium} />
          <div className={styles.loadingLineShort} />
        </div>
        <div className={styles.loadingTableHead} aria-hidden="true" />
        <div className={styles.loadingRows} aria-hidden="true">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className={styles.loadingRow} />
          ))}
        </div>
      </section>
    </main>
  );
}
