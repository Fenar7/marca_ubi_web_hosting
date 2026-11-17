
import React from 'react';
import styles from './ConyestVirtualCard.module.scss';

export const ConyestVirtualCard: React.FC = () => {
  return (
    <div className={styles.card}>
      {/* Background SVG watermarks */}
      <div className={styles.header}>
        <span className={styles.userName}>MARCA UBI DESK</span>
        <div className={styles.toggle}> {/* Toggle switch implementation */} </div>
      </div>
      <div className={styles.body}>
        <span className={styles.label}>Active Commercial Balance</span>
        <span className={styles.amount}>$432,568</span>
      </div>
      <div className={styles.footer}>
        <span>EXP 11/29</span>
        <span>CVV 232</span>
      </div>
    </div>
  );
};
