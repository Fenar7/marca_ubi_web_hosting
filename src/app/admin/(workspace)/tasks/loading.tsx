import React from 'react';
import styles from './tasks.module.scss';

export default function TasksLoading(): React.ReactElement {
  return (
    <main className={styles.container} aria-busy="true" aria-describedby="tasks-loading-status">
      <p id="tasks-loading-status" role="status" className={styles.eyebrow}>Loading follow-up queue</p>
      <div className={styles.queueTabs} aria-hidden="true">
        {[1, 2, 3, 4].map((item) => <div key={item} className={styles.loadingTab} />)}
      </div>
      <div className={styles.loadingRows} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((item) => <div key={item} className={styles.loadingRow} />)}
      </div>
    </main>
  );
}
