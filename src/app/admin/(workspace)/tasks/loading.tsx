/**
 * @file loading.tsx
 * @description Zero Cumulative Layout Shift (CLS < 0.01) Suspense fallback for Follow-up Queue.
 *              Mirrors the balanced 4-queue switcher, executive KPI strip, and workstation rows.
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
          <p className={styles.eyebrow}>Commercial Desk / Client relationships</p>
          <h1 className={styles.pageTitle}>Follow-up queue</h1>
          <p id="tasks-loading-status" className={styles.pageSubtitle}>
            Loading active pipeline touchpoints and commercial schedule…
          </p>
        </div>
      </header>

      <section className={styles.queueOverview} aria-label="Loading follow-up telemetry">
        <div className={styles.queueTabs} aria-hidden="true">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={styles.loadingTab} />
          ))}
        </div>
        <div className={styles.kpiStrip} aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className={styles.loadingKpi} />
          ))}
        </div>
      </section>

      <section className={styles.workSection} aria-label="Loading tasks list">
        <div className={styles.loadingRows} aria-hidden="true">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className={styles.loadingRow} />
          ))}
        </div>
      </section>
    </main>
  );
}
