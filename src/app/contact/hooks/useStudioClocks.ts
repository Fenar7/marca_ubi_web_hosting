'use client';

/**
 * @file useStudioClocks.ts
 * @description Hydration-safe React hook providing live local clocks for Marca Ubi studio corridors
 *              (Calicut, Trivandrum, London, Dubai, New York) using Intl.DateTimeFormat.
 *              Guarantees zero hydration mismatch by initializing with static server-safe defaults
 *              and updating on a monotonic 1-second interval after client mount.
 * @module contact/hooks/useStudioClocks
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { useState, useEffect } from 'react';

export interface StudioClock {
  city: string;
  country: string;
  timezone: string;
  timeString: string;
  isOpen: boolean;
  statusLabel: string;
}

const STUDIOS_CONFIG = [
  {
    city: 'Calicut',
    country: 'India',
    timezone: 'Asia/Kolkata',
    role: 'Global Headquarters & Strategy',
    address: 'Level 4, HiLITE Business Park, Poovangal, Kozhikode 673014',
    openHour: 9,
    closeHour: 18,
  },
  {
    city: 'Trivandrum',
    country: 'India',
    timezone: 'Asia/Kolkata',
    role: 'Creative Tech & Digital Platform Studio',
    address: 'Technopark Phase III, Kulathoor, Trivandrum 695583',
    openHour: 9,
    closeHour: 18,
  },
  {
    city: 'Dubai',
    country: 'UAE',
    timezone: 'Asia/Dubai',
    role: 'MENA Client Desk',
    address: 'Downtown Dubai Business Corridor',
    openHour: 9,
    closeHour: 18,
  },
  {
    city: 'London',
    country: 'UK',
    timezone: 'Europe/London',
    role: 'European Commercial Liaison',
    address: 'City Road Financial Corridor, EC1V',
    openHour: 9,
    closeHour: 17,
  },
  {
    city: 'New York',
    country: 'US',
    timezone: 'America/New_York',
    role: 'Americas Partner Desk',
    address: 'Manhattan Commercial District, NY 10010',
    openHour: 9,
    closeHour: 17,
  },
] as const;

function formatStudioTime(timeZone: string, date: Date): { timeString: string; hour: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    const timeString = formatter.format(date);
    const day = date.getDay(); // Approximate weekday check
    return { timeString, hour, day };
  } catch {
    return { timeString: '--:--:--', hour: 12, day: 1 };
  }
}

export function useStudioClocks() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return STUDIOS_CONFIG.map((studio) => {
    if (!mounted) {
      return {
        ...studio,
        timeString: '12:00:00',
        isOpen: true,
        statusLabel: 'Active Desk',
      };
    }

    const { timeString, hour, day } = formatStudioTime(studio.timezone, now);
    const isWeekday = day >= 1 && day <= 5;
    const isOpen = isWeekday && hour >= studio.openHour && hour < studio.closeHour;
    const statusLabel = isOpen ? 'Desk Active' : 'Offline (Resumes 09:00)';

    return {
      ...studio,
      timeString,
      isOpen,
      statusLabel,
    };
  });
}
