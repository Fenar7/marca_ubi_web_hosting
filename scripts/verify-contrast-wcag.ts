/**
 * @file verify-contrast-wcag.ts
 * @description Standalone WCAG 2.1 AA & AAA Contrast Ratio Verification Engine.
 *              Evaluates the mathematical luminance and contrast ratios of all Marca Ubi
 *              Dark Luxury design tokens to ensure absolute accessibility compliance
 *              without relying on a running browser daemon (PRD §4.3 Work Package 1).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

interface ColorTokenPair {
  name: string;
  fg: string;
  bg: string;
  targetLevel: 'AA' | 'AAA' | 'AA Large / Component';
  minRatio: number;
}

/**
 * Calculates relative luminance for an sRGB hexadecimal color according to WCAG 2.1 specifications.
 * @param hex - Hexadecimal color code (e.g. #0A0A0B or #FFFFFF)
 * @returns Relative luminance between 0.0 (pure black) and 1.0 (pure white)
 */
export function getRelativeLuminance(hex: string): number {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;

  const transformChannel = (channel: number): number => {
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * transformChannel(r) +
    0.7152 * transformChannel(g) +
    0.0722 * transformChannel(b)
  );
}

/**
 * Calculates the exact contrast ratio between two colors according to (L1 + 0.05) / (L2 + 0.05).
 * @param foregroundHex - Foreground color hex
 * @param backgroundHex - Background color hex
 * @returns Contrast ratio multiplier (e.g. 18.2 for 18.2:1)
 */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = getRelativeLuminance(foregroundHex);
  const lum2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function runContrastAudit(): { passed: boolean; report: string[] } {
  const tokenPairs: ColorTokenPair[] = [
    {
      name: 'Primary Body Text (#FFFFFF on #0A0A0B canvas)',
      fg: '#FFFFFF',
      bg: '#0A0A0B',
      targetLevel: 'AAA',
      minRatio: 7.0,
    },
    {
      name: 'Primary Headings (#FFFFFF on #000000 obsidian)',
      fg: '#FFFFFF',
      bg: '#000000',
      targetLevel: 'AAA',
      minRatio: 7.0,
    },
    {
      name: 'Muted Secondary Label (#A1A1AA on #121216 card)',
      fg: '#A1A1AA',
      bg: '#121216',
      targetLevel: 'AAA',
      minRatio: 7.0,
    },
    {
      name: 'Brand Accent Orange (#FF6100 on #0A0A0B canvas)',
      fg: '#FF6100',
      bg: '#0A0A0B',
      targetLevel: 'AA',
      minRatio: 4.5,
    },
    {
      name: 'Tier 1 Warning Badge (#F59E0B on #0A0A0B canvas)',
      fg: '#F59E0B',
      bg: '#0A0A0B',
      targetLevel: 'AAA',
      minRatio: 7.0,
    },
    {
      name: 'Tier 3 Critical Alert (#EF4444 on #0A0A0B canvas)',
      fg: '#EF4444',
      bg: '#0A0A0B',
      targetLevel: 'AA Large / Component',
      minRatio: 3.0,
    },
    {
      name: 'Success Pipeline Pill (#10B981 on #0A0A0B canvas)',
      fg: '#10B981',
      bg: '#0A0A0B',
      targetLevel: 'AAA',
      minRatio: 7.0,
    },
    {
      name: 'Card Elevated Text (#FFFFFF on #18181B zinc-900)',
      fg: '#FFFFFF',
      bg: '#18181B',
      targetLevel: 'AAA',
      minRatio: 7.0,
    },
  ];

  const report: string[] = [];
  let allPassed = true;

  report.push('================================================================');
  report.push(' MARCA UBI LUXURY DESIGN SYSTEM: WCAG 2.1 CONTRAST AUDITOR');
  report.push('================================================================');

  for (const pair of tokenPairs) {
    const ratio = getContrastRatio(pair.fg, pair.bg);
    const passed = ratio >= pair.minRatio;
    if (!passed) allPassed = false;

    const formattedRatio = `${ratio.toFixed(2)}:1`;
    const statusMark = passed ? 'PASS' : 'FAIL';
    report.push(
      `[${statusMark}] ${pair.name.padEnd(52)} | Ratio: ${formattedRatio.padEnd(8)} | Target: >= ${pair.minRatio}:1 (${pair.targetLevel})`
    );
  }

  report.push('================================================================');
  report.push(`OVERALL STATUS: ${allPassed ? 'ALL TOKENS PASS WCAG 2.1 AA/AAA' : 'CONTRAST DEFICIT DETECTED'}`);
  report.push('================================================================');

  return { passed: allPassed, report };
}

// Execute standalone when run directly via tsx
if (require.main === module) {
  const result = runContrastAudit();
  console.log(result.report.join('\n'));
  if (!result.passed) {
    process.exit(1);
  }
}
