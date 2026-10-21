import localFont from 'next/font/local';

/**
 * @file src/app/admin/fonts.ts
 * @description Dedicated local font bindings for the Marca Ubi CRM Admin Workspace.
 *              Strictly scoped to the CRM workspace layout; completely isolated from
 *              the public website's Graphik and Movatif typography stacks.
 *              Direct top-level module scope assignment per Next.js Turbopack compiler invariants.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export const adminSans = localFont({
  src: [
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-Book.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-Regular.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-admin-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const adminButtonFont = localFont({
  src: [
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-Book.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSans/MessinaSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-admin-button',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

export const adminMono = localFont({
  src: [
    {
      path: '../../../public/fonts/MessinaSansBook/MessinaSansMono-Book.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSansBook/MessinaSansMono-Regular.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSansBook/MessinaSansMono-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/MessinaSansBook/MessinaSansMono-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-admin-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
});

export const adminNumeric = localFont({
  src: [
    {
      path: '../../../public/fonts/PlusJakartaSans/PlusJakartaSans-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/PlusJakartaSans/PlusJakartaSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/PlusJakartaSans/PlusJakartaSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-admin-numeric',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'SF Pro Display', 'sans-serif'],
});
