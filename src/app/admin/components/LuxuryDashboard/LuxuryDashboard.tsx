
import React from 'react';
import styles from './LuxuryDashboardShell.module.scss';

interface LuxuryDashboardProps {
  children?: React.ReactNode;
}

export const LuxuryDashboard: React.FC<LuxuryDashboardProps> = ({ children }) => {
  return (
    <div className={styles['luxury-dashboard-shell']} data-admin-dashboard-conyest="true">
      <header className={styles['dashboard-header']}>
        <h1>Dashboard</h1>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};
