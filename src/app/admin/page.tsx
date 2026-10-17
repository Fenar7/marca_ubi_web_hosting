/**
 * @file page.tsx
 * @description Administrative Command Center Foundation Page (/admin).
 *              Renders the authenticated workspace shell, verifies current session user and role,
 *              and provides administrative session logout capabilities.
 * @module app/admin/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { logoutAction } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: 'Workspace Command Center | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin');
  }

  const role =
    (user.app_metadata?.role as string | undefined) ||
    (user.user_metadata?.role as string | undefined) ||
    'authenticated';

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
          <img
            src="/hero/marca-ubi-logo.png"
            alt="Marca Ubi."
            style={{
              display: 'block',
              width: '160px',
              height: 'auto',
              marginBottom: '0.75rem',
            }}
          />
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
            Marca Ubi CRM
          </span>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Agency Command Center
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              {user.email}
            </span>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255, 97, 0, 0.15)',
                color: '#ff6100',
                border: '1px solid rgba(255, 97, 0, 0.3)',
              }}
            >
              {role}
            </span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                height: '40px',
                padding: '0 1rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#cccccc',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
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
        <h2
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
          }}
        >
          Session Authenticated
        </h2>
        <p
          style={{
            color: '#888888',
            fontSize: '0.88rem',
            lineHeight: 1.6,
            margin: '0 0 1.5rem 0',
          }}
        >
          Your administrative identity has been cryptographically validated via `@supabase/ssr` HttpOnly cookies and
          guarded by Next.js 16 Edge Middleware.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              background: '#141418',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#888888', textTransform: 'uppercase' }}>
              User ID
            </span>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#ffffff',
                margin: '0.35rem 0 0 0',
                wordBreak: 'break-all',
              }}
            >
              {user.id}
            </p>
          </div>

          <div
            style={{
              padding: '1rem',
              background: '#141418',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#888888', textTransform: 'uppercase' }}>
              Active Role
            </span>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ff6100',
                margin: '0.35rem 0 0 0',
              }}
            >
              {role}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
