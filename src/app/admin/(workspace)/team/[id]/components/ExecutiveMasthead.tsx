'use client';

/**
 * @file ExecutiveMasthead.tsx
 * @description PrimeStay executive masthead component featuring circular 72px avatar,
 *              camera modal trigger, online indicator, Raycast monospace role token,
 *              and direct phone/WhatsApp/email contact CTAs.
 * @module app/admin/team/[id]/components/ExecutiveMasthead
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import Image from 'next/image';
import type { Profile } from '@/types/crm';
import { getInitials } from '@/app/lib/team-utils';
import styles from './ExecutiveMasthead.module.scss';

interface ExecutiveMastheadProps {
  profile: Profile;
  invitedByName: string | null;
  canEditAvatar: boolean;
  onOpenAvatarModal: () => void;
}

export function ExecutiveMasthead({
  profile,
  invitedByName,
  canEditAvatar,
  onOpenAvatarModal,
}: ExecutiveMastheadProps): React.ReactElement {
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  const cleanPhone = profile.phone ? profile.phone.replace(/[^\d+]/g, '') : null;
  const whatsAppNumber = cleanPhone ? cleanPhone.replace(/^\+/, '') : null;

  const handleCopyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'admin':
        return styles.roleAdmin;
      case 'sales_manager':
        return styles.roleManager;
      case 'sales_executive':
        return styles.roleRep;
      default:
        return '';
    }
  };

  const formatRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'sales_manager':
        return 'Sales Manager';
      case 'sales_executive':
        return 'Sales Representative';
      case 'viewer':
        return 'Read-Only Viewer';
      default:
        return role.replace(/_/g, ' ');
    }
  };

  return (
    <div className={styles.mastheadCard}>
      <div className={styles.topRow}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatarWrapper}>
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                fill
                sizes="72px"
                className={styles.avatarImage}
                priority
              />
            ) : (
              <span className={styles.avatarInitials} aria-hidden="true">
                {getInitials(profile.full_name)}
              </span>
            )}
          </div>

          {canEditAvatar && (
            <button
              type="button"
              className={styles.cameraTriggerOverlay}
              onClick={onOpenAvatarModal}
              title="Update profile photograph"
              aria-label="Update profile photograph"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          )}

          <div
            className={`${styles.onlineStatusDot} ${profile.status === 'active' ? styles.active : styles.suspended}`}
            title={`Status: ${profile.status === 'active' ? 'Active' : 'Suspended'}`}
            aria-hidden="true"
          />
        </div>

        <div className={styles.identityMeta}>
          <div className={styles.nameRow}>
            <h1 className={styles.fullName}>{profile.full_name}</h1>
            <span className={`${styles.roleBadge} ${getRoleBadgeClass(profile.role)}`}>
              {formatRoleLabel(profile.role)}
            </span>
          </div>

          <p className={styles.jobTitle}>{profile.job_title || 'Commercial Personnel'}</p>

          {invitedByName && (
            <p className={styles.inviterNote}>
              Onboarded by <strong>{invitedByName}</strong> • Member since{' '}
              {new Date(profile.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.coordinatesGrid}>
        <a href={`mailto:${profile.email}`} className={styles.coordinateCta} title={`Send email to ${profile.email}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span>{profile.email}</span>
        </a>

        <button
          type="button"
          onClick={handleCopyEmail}
          className={styles.coordinateCta}
          title="Copy email address"
          aria-label="Copy email address"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {copiedEmail ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </>
            )}
          </svg>
          <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
        </button>

        {profile.phone && cleanPhone && (
          <>
            <a href={`tel:${cleanPhone}`} className={styles.coordinateCta} title={`Direct call to ${profile.phone}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{profile.phone}</span>
            </a>

            <a
              href={`https://wa.me/${whatsAppNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsAppCta}
              title="Open WhatsApp chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
