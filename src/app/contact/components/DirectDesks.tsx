'use client';

/**
 * @file DirectDesks.tsx
 * @description Direct desks navigation strip for `/contact`.
 *              Provides direct communication channels for prospective clients, press,
 *              and general enterprise communications without requiring form submission.
 * @module contact/components/DirectDesks
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import styles from '../Contact.module.scss';

const DIRECT_DESKS = [
  {
    role: 'New Business & Commissions',
    coordinate: 'newbusiness@marcaubi.com',
    type: 'mailto:newbusiness@marcaubi.com',
    subtext: 'Direct review by executive creative & engineering leadership.',
  },
  {
    role: 'Press, Speaking & Media',
    coordinate: 'press@marcaubi.com',
    type: 'mailto:press@marcaubi.com',
    subtext: 'Press assets, design journalism dispatches & keynote speaking inquiries.',
  },
  {
    role: 'Direct Studio Telephone',
    coordinate: '+91 7012 052 472',
    type: 'tel:+917012052472',
    subtext: 'Direct desk routing across Kerala headquarters and regional liaisons.',
  },
  {
    role: 'General Inquiries',
    coordinate: 'hello@marcaubi.com',
    type: 'mailto:hello@marcaubi.com',
    subtext: 'General correspondence and studio introductions.',
  },
] as const;

export default function DirectDesks() {
  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Direct Studio Desks</h2>
        <span className={styles.sectionTag}>[FAST TRACK]</span>
      </div>

      <div className={styles.desksList}>
        {DIRECT_DESKS.map((desk) => (
          <div key={desk.coordinate} className={styles.deskCard}>
            <span className={styles.deskRole}>{desk.role}</span>
            <a href={desk.type} className={styles.deskCoordinate}>
              {desk.coordinate}
            </a>
            <p className={styles.deskSubtext}>{desk.subtext}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
