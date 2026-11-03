'use client';

/**
 * @file StudioCorridors.tsx
 * @description Physical studio locations and live operational timezones for `/contact`.
 *              Displays verified addresses for Calicut HQ (HiLITE Business Park)
 *              and Trivandrum Studio (Technopark Phase III) with real-time monotonic clocks,
 *              plus international liaison desks (London, Dubai, New York).
 * @module contact/components/StudioCorridors
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { useStudioClocks } from '../hooks/useStudioClocks';
import styles from '../Contact.module.scss';

export default function StudioCorridors() {
  const clocks = useStudioClocks();

  const primaryHubs = clocks.filter((c) => c.city === 'Calicut' || c.city === 'Trivandrum');
  const internationalDesks = clocks.filter((c) => c.city !== 'Calicut' && c.city !== 'Trivandrum');

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Studio Corridors</h2>
        <span className={styles.sectionTag}>[LIVE STATUS]</span>
      </div>

      <div className={styles.corridorsGrid}>
        {primaryHubs.map((hub) => (
          <div key={hub.city} className={styles.studioCard}>
            <div className={styles.studioTop}>
              <div>
                <h3 className={styles.studioName}>{hub.city} Studio</h3>
                <span className={styles.studioRole}>{hub.role}</span>
              </div>
              <div className={styles.studioClock}>
                <span className={styles.clockDigits}>{hub.timeString}</span>
                <span className={styles.statusBeacon}>
                  <span className={`${styles.beaconDot} ${hub.isOpen ? styles.open : styles.closed}`} />
                  <span className={styles.beaconLabel}>{hub.statusLabel}</span>
                </span>
              </div>
            </div>
            <address className={styles.studioAddress}>{hub.address}</address>
          </div>
        ))}

        <div className={styles.internationalRow}>
          {internationalDesks.map((desk) => (
            <div key={desk.city} className={styles.cityNode}>
              <span className={styles.cityName}>{desk.city}</span>
              <span className={styles.cityTime}>{desk.timeString.slice(0, 5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
