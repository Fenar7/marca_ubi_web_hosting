import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './AdminAuthShell.module.scss';

export interface AdminAuthShellProps {
  eyebrow: string;
  headline: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Shared branded frame keeps credential and recovery flows visually connected while
 * leaving the auth forms in server-action-aware page components.
 */
export function AdminAuthShell({ eyebrow, headline, description, children }: AdminAuthShellProps): React.ReactElement {
  return (
    <main className={styles.canvas}>
      <div className={styles.frame}>
        <aside className={styles.brandPanel} aria-label="Marca Ubi workspace">
          <Link className={styles.brandLink} href="/" aria-label="Marca Ubi home">
            <Image src="/images/marca-ubi-dark.svg" alt="Marca Ubi." width={160} height={36} priority />
          </Link>
          <div className={styles.brandMessage}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1 className={styles.headline}>{headline}</h1>
            <p className={styles.description}>{description}</p>
          </div>
          <div className={styles.brandFooter}>
            <span className={styles.footerRule} aria-hidden="true" />
            <span>Commercial Desk</span>
            <span className={styles.footerSeparator} aria-hidden="true">/</span>
            <span>Staff access</span>
          </div>
        </aside>
        <section className={styles.formPanel} aria-label="Account access">
          {children}
          <p className={styles.copyright}>© {new Date().getFullYear()} Marca Ubi</p>
        </section>
      </div>
    </main>
  );
}
