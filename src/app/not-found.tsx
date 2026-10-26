/**
 * @file not-found.tsx
 * @description Canonical Root 404 Not Found error surface for Marca Ubi Enterprise.
 *              Guarantees a resilient, high-contrast Dark Luxury boundary, preventing Next.js
 *              Turbopack internal fallback compilation traps when non-existent routes are requested.
 * @module app/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';

export default function RootNotFound(): React.ReactElement {
  return (
    <main
      role="alert"
      className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 select-none"
      style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff' }}
    >
      <div
        className="max-w-md w-full bg-[#111318] border border-[#232730] rounded-xl p-8 flex flex-col items-center text-center shadow-2xl"
        style={{ maxWidth: '28rem', backgroundColor: '#111318', border: '1px solid #232730', borderRadius: '0.75rem', padding: '2rem' }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-5 border border-[#ff6100]/30 text-[#ff6100] bg-[#ff6100]/10"
          style={{ fontFamily: 'var(--font-graphik), sans-serif' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6100]" />
          404 • Resource Not Found
        </span>

        <h1
          className="text-2xl font-bold tracking-tight text-white mb-3"
          style={{ fontFamily: 'var(--font-graphik), sans-serif' }}
        >
          Page Not Available
        </h1>

        <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
          The requested URL does not match any public studio experience or active workspace route.
          Verify the address or return to the main digital experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center h-11 px-5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#ff6100] text-black hover:bg-[#ff7a29] transition-colors"
            style={{ backgroundColor: '#ff6100', color: '#000000' }}
          >
            Studio Home
          </Link>

          <Link
            href="/admin"
            className="flex-1 inline-flex items-center justify-center h-11 px-5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#1a1e26] text-white border border-[#333a48] hover:bg-[#252b37] transition-colors"
            style={{ backgroundColor: '#1a1e26', color: '#ffffff', border: '1px solid #333a48' }}
          >
            Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
