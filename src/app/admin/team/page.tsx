/**
 * @file page.tsx
 * @description Team Management Governance Foundation Page (/admin/team).
 *              Protected by Next.js 16 Edge Middleware role gating (admin and sales_manager only).
 * @module app/admin/team/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Team Management & Governance | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminTeamPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fteam');
  }

  const role =
    (user.app_metadata?.role as string | undefined) ||
    (user.user_metadata?.role as string | undefined) ||
    'authenticated';

  if (role !== 'admin' && role !== 'sales_manager') {
    redirect('/admin?error=unauthorized_role_access');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0b0b0b',
        color: '#ffffff',
        padding: '2.5rem 2rem',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ff6100',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            Governance & Access Control
          </span>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Team Administration
          </h1>
        </div>

        <Link
          href="/admin"
          style={{
            fontSize: '0.85rem',
            color: '#888888',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Command Center</span>
        </Link>
      </header>

      <section
        style={{
          background: '#111111',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '800px',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          Role Authorization Verified
        </h2>
        <p style={{ color: '#888888', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
          You have reached the high-security governance zone with verified role: <strong>{role}</strong>.
          This route is restricted to administrative directorate and sales leadership.
        </p>
      </section>
    </main>
  );
}
