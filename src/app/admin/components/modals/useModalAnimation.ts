'use client';

/**
 * @file useModalAnimation.ts
 * @description Coordinates mounting, enter/exit animation lifecycle, body scroll lock,
 *              and layout shift compensation for centered luxury modal surfaces.
 * @architecture Enforces an unmount delay state machine ensuring Apple HIG spring exit
 *               keyframes finish before DOM nodes are unmounted.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseModalAnimationOptions {
  isOpen: boolean;
  exitDurationMs?: number;
  onClose?: () => void;
}

export interface ModalAnimationState {
  shouldRender: boolean;
  isClosing: boolean;
  handleAnimationEnd: (e: React.AnimationEvent) => void;
}

export function useModalAnimation({
  isOpen,
  exitDurationMs = 180,
}: UseModalAnimationOptions): ModalAnimationState {
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setShouldRender(true);
      setIsClosing(false);

      // Lock body scroll and compensate for scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else if (shouldRender && !isClosing) {
      // Trigger exit animation phase
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, exitDurationMs);
    }
  }, [isOpen, shouldRender, isClosing, exitDurationMs]);

  // Clean up body scroll lock on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Listen to animationend as an additional guarantee for synchronized unmount
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (isClosing && e.target === e.currentTarget) {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setShouldRender(false);
        setIsClosing(false);
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    },
    [isClosing]
  );

  return { shouldRender, isClosing, handleAnimationEnd };
}
