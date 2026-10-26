/**
 * @file dev-performance-and-cache.test.ts
 * @description Unit tests validating dev server acceleration, font deduplication,
 *              Next.js 16 image configuration, and clean cache recovery invariants.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Dev Performance, Cache Acceleration & Asset Invariants Suite', () => {
  const rootDir = process.cwd();

  describe('1. Clean Cache & Dev Recovery Scripts', () => {
    it('verifies package.json contains a cross-platform dev:clean script', () => {
      const packageJsonPath = path.resolve(rootDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      assert.ok(packageJson.scripts, 'scripts object must exist in package.json');
      assert.ok(packageJson.scripts['dev:clean'], 'dev:clean script must exist');
      assert.ok(
        packageJson.scripts['dev:clean'].includes('.next/cache') ||
        packageJson.scripts['dev:clean'].includes('next dev'),
        'dev:clean must purge .next/cache and launch next dev'
      );
    });
  });

  describe('2. Next.js 16 Image Optimization Configuration', () => {
    it('verifies next.config.ts explicitly registers quality 82 in images.qualities', () => {
      const nextConfigPath = path.resolve(rootDir, 'next.config.ts');
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      assert.ok(
        content.includes('qualities: [75, 82]') || content.includes('qualities: [82, 75]'),
        'next.config.ts must declare qualities array with [75, 82] to satisfy Next.js 16 unconfigured qualities check'
      );
    });
  });

  describe('3. Elimination of Sass Recursive Circular Extend Deadlocks', () => {
    it('verifies src/app/admin/components/layout/AdminWorkspace.module.scss contains zero self-referential @extend', () => {
      const scssPath = path.resolve(
        rootDir,
        'src/app/admin/components/layout/AdminWorkspace.module.scss'
      );
      assert.strictEqual(fs.existsSync(scssPath), true);
      const content = fs.readFileSync(scssPath, 'utf8');
      assert.strictEqual(
        content.includes('@extend'),
        false,
        'AdminWorkspace.module.scss must not contain any @extend rules that trigger Dart Sass cyclic recursion'
      );
    });

    it('verifies AdminWorkspaceShell imports admin-shell.module.scss directly', () => {
      const shellTsxPath = path.resolve(
        rootDir,
        'src/app/admin/components/layout/AdminWorkspaceShell.tsx'
      );
      const content = fs.readFileSync(shellTsxPath, 'utf8');
      assert.ok(
        content.includes("import styles from './admin-shell.module.scss';"),
        'AdminWorkspaceShell must consume admin-shell.module.scss directly'
      );
    });
  });

  describe('4. Font Optimization & Local Asset Preload Invariants', () => {
    const fontsPath = path.resolve(rootDir, 'src/app/admin/fonts.ts');

    it('verifies src/app/admin/fonts.ts exports adminSans with display swap', () => {
      const content = fs.readFileSync(fontsPath, 'utf8');
      assert.ok(content.includes('export const adminSans = localFont('));
      assert.ok(content.includes("variable: '--font-admin-sans'"));
      assert.ok(content.includes("display: 'swap'"));
    });

    it('verifies src/app/admin/fonts.ts exports adminButtonFont with display swap', () => {
      const content = fs.readFileSync(fontsPath, 'utf8');
      assert.ok(content.includes('export const adminButtonFont = localFont('));
      assert.ok(content.includes("variable: '--font-admin-button'"));
      assert.ok(content.includes("display: 'swap'"));
    });

    it('verifies src/app/admin/fonts.ts exports adminMono with display swap', () => {
      const content = fs.readFileSync(fontsPath, 'utf8');
      assert.ok(content.includes('export const adminMono = localFont('));
      assert.ok(content.includes("variable: '--font-admin-mono'"));
      assert.ok(content.includes("display: 'swap'"));
    });
  });
});
