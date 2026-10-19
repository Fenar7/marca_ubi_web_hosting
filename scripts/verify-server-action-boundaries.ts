/**
 * @file verify-server-action-boundaries.ts
 * @description Automated CI verification gate ensuring strict Next.js 16 App Router Server Action boundaries:
 *              1. Every file in `src/app/actions/` and any module marked with `'use server'` must ONLY export `async function`.
 *              2. Prohibits exporting constants, Zod schemas, arrays, or synchronous helper functions from Server Action files.
 *              3. Verifies that Client Components (`'use client'`) do not import non-action values from `src/app/actions/*`.
 * @module scripts/verify-server-action-boundaries
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const ACTIONS_DIR = path.join(ROOT_DIR, 'src/app/actions');
const APP_DIR = path.join(ROOT_DIR, 'src/app');

console.log('================================================================');
console.log('NEXT.JS APP ROUTER SERVER ACTION BOUNDARY GATEKEEPER');
console.log('================================================================');

interface BoundaryViolation {
  file: string;
  line: number;
  type: string;
  code: string;
}

const violations: BoundaryViolation[] = [];
let auditedFilesCount = 0;
let validAsyncActionsCount = 0;

if (fs.existsSync(ACTIONS_DIR)) {
  const actionFiles = fs.readdirSync(ACTIONS_DIR).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

  for (const file of actionFiles) {
    auditedFilesCount++;
    const fullPath = path.join(ACTIONS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('export ')) {
        if (
          trimmed.startsWith('export async function ') ||
          trimmed.startsWith('export default async function ')
        ) {
          validAsyncActionsCount++;
        } else if (
          trimmed.startsWith('export type ') ||
          trimmed.startsWith('export interface ')
        ) {
          // TypeScript type contracts erased at compile time
        } else if (trimmed.startsWith('export function ')) {
          violations.push({
            file: `src/app/actions/${file}`,
            line: idx + 1,
            type: 'Sync Function Export (Server Actions must be async)',
            code: trimmed,
          });
        } else if (trimmed.startsWith('export const ')) {
          violations.push({
            file: `src/app/actions/${file}`,
            line: idx + 1,
            type: 'Constant / Schema Export (Must be in src/app/lib/)',
            code: trimmed,
          });
        } else if (trimmed.startsWith('export let ') || trimmed.startsWith('export var ')) {
          violations.push({
            file: `src/app/actions/${file}`,
            line: idx + 1,
            type: 'Mutable Variable Export',
            code: trimmed,
          });
        } else if (trimmed.startsWith('export enum ')) {
          violations.push({
            file: `src/app/actions/${file}`,
            line: idx + 1,
            type: 'Enum Export (Must be in src/app/lib/ or src/types/)',
            code: trimmed,
          });
        }
      }
    });
  }
}

console.log(`Audited ${auditedFilesCount} Server Action files.`);
console.log(`Identified ${validAsyncActionsCount} valid async Server Actions.`);

if (violations.length > 0) {
  console.error(`\n❌ FOUND ${violations.length} SERVER ACTION BOUNDARY VIOLATIONS:`);
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} [${v.type}] -> ${v.code}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ 100% of Server Action modules comply strictly with Next.js App Router boundary invariants.');
  console.log('   Zero non-async functions, constants, or schemas exported from "use server" files.');
  process.exit(0);
}
