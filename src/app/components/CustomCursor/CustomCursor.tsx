"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import styles from "./CustomCursor.module.scss";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, label, summary, [data-cursor-hover]";
const LIQUID_CARD_SELECTOR = "[data-liquid-card]";

export default function CustomCursor() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const orbRef = useRef<HTMLSpanElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    const orb = orbRef.current;

    if (!root || !orb) {
      return;
    }

    // Sanity Studio gets the normal system cursor
    if (pathname?.startsWith("/studio")) {
      return;
    }

    const supportsCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!supportsCursor) {
      return;
    }

    document.documentElement.classList.add("custom-cursor-enabled");
    document.body.classList.add("custom-cursor-enabled");

    let lastX = window.innerWidth * 0.5;
    let lastY = window.innerHeight * 0.5;
    let visible = false;
    let settleTween: gsap.core.Tween | null = null;
    let activeLiquidCard: HTMLElement | null = null;
    let activeLiquidBlob: HTMLElement | null = null;
    let liquidXTo: ((value: number) => gsap.core.Tween) | null = null;
    let liquidYTo: ((value: number) => gsap.core.Tween) | null = null;

    gsap.set(root, {
      autoAlpha: 0,
      x: lastX,
      y: lastY,
      xPercent: -50,
      yPercent: -50,
      force3D: true,
    });

    gsap.set(orb, {
      scale: 0.65,
      scaleX: 1,
      scaleY: 1,
      rotate: 0,
      force3D: true,
      transformOrigin: "50% 50%",
    });

    const moveX = gsap.quickTo(root, "x", { duration: 0.28, ease: "power3.out" });
    const moveY = gsap.quickTo(root, "y", { duration: 0.28, ease: "power3.out" });
    const orbScale = gsap.quickTo(orb, "scale", { duration: 0.22, ease: "power3.out" });
    const orbScaleX = gsap.quickTo(orb, "scaleX", { duration: 0.18, ease: "power3.out" });
    const orbScaleY = gsap.quickTo(orb, "scaleY", { duration: 0.18, ease: "power3.out" });
    const orbRotate = gsap.quickTo(orb, "rotate", { duration: 0.2, ease: "power2.out" });

    const reveal = () => {
      if (visible) {
        return;
      }
      visible = true;
      gsap.to(root, { autoAlpha: 1, duration: 0.18, ease: "power2.out" });
      orbScale(1);
    };

    const settleShape = () => {
      settleTween?.kill();
      settleTween = gsap.to(orb, {
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        duration: 0.36,
        ease: "expo.out",
      });
    };

    const deactivateLiquidCard = () => {
      root.classList.remove(styles.liquidHover);

      if (activeLiquidBlob) {
        gsap.to(activeLiquidBlob, {
          autoAlpha: 0,
          scale: 0.54,
          duration: 0.34,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      if (activeLiquidCard) {
        activeLiquidCard.classList.remove("is-cursor-liquid");
      }

      activeLiquidCard = null;
      activeLiquidBlob = null;
      liquidXTo = null;
      liquidYTo = null;
      orbScale(1);
    };

    const activateLiquidCard = (card: HTMLElement, event?: PointerEvent) => {
      if (activeLiquidCard === card && activeLiquidBlob) {
        return;
      }

      deactivateLiquidCard();

      const blob = card.querySelector<HTMLElement>(".step-card-liquid-blob");

      if (!blob) {
        return;
      }

      const bounds = card.getBoundingClientRect();
      const startX = event ? Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)) : bounds.width * 0.5;
      const startY = event ? Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)) : bounds.height * 0.5;

      activeLiquidCard = card;
      activeLiquidBlob = blob;
      activeLiquidCard.classList.add("is-cursor-liquid");
      root.classList.add(styles.liquidHover);

      gsap.set(blob, {
        autoAlpha: 0,
        scale: 0.54,
        x: startX,
        y: startY,
        force3D: true,
      });

      liquidXTo = gsap.quickTo(blob, "x", { duration: 0.24, ease: "power3.out" });
      liquidYTo = gsap.quickTo(blob, "y", { duration: 0.24, ease: "power3.out" });

      gsap.to(blob, {
        autoAlpha: 0.96,
        scale: 1,
        duration: 0.46,
        ease: "expo.out",
        overwrite: "auto",
      });

      orbScale(0.82);
    };

    const handlePointerMove = (event: PointerEvent) => {
      reveal();

      const nextX = event.clientX;
      const nextY = event.clientY;
      const deltaX = nextX - lastX;
      const deltaY = nextY - lastY;
      const speed = Math.hypot(deltaX, deltaY);
      const stretch = Math.min(speed / 42, 0.28);
      const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

      moveX(nextX);
      moveY(nextY);
      orbScaleX(1 + stretch);
      orbScaleY(1 - stretch * 0.58);
      orbRotate(angle);

      lastX = nextX;
      lastY = nextY;

      settleShape();

      if (activeLiquidCard && liquidXTo && liquidYTo) {
        const bounds = activeLiquidCard.getBoundingClientRect();
        const nextLocalX = Math.max(0, Math.min(bounds.width, nextX - bounds.left));
        const nextLocalY = Math.max(0, Math.min(bounds.height, nextY - bounds.top));
        liquidXTo(nextLocalX);
        liquidYTo(nextLocalY);
      }
    };

    const handlePointerDown = () => {
      reveal();
      orbScale(0.86);
    };

    const handlePointerUp = () => {
      orbScale(1);
    };

    const handlePointerLeaveWindow = () => {
      visible = false;
      gsap.to(root, { autoAlpha: 0, duration: 0.2, ease: "power2.out" });
      settleShape();
      deactivateLiquidCard();
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(INTERACTIVE_SELECTOR)) {
        orbScale(1.28);
      }

      const liquidCard = target.closest<HTMLElement>(LIQUID_CARD_SELECTOR);

      if (liquidCard) {
        activateLiquidCard(liquidCard, event);
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(INTERACTIVE_SELECTOR)) {
        orbScale(1);
      }

      const fromLiquidCard = target.closest<HTMLElement>(LIQUID_CARD_SELECTOR);

      if (fromLiquidCard) {
        const related = event.relatedTarget;
        const stillInsideCard = related instanceof Element && fromLiquidCard.contains(related);

        if (!stillInsideCard) {
          deactivateLiquidCard();
          orbScale(1);
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("blur", handlePointerLeaveWindow);
    document.addEventListener("mouseleave", handlePointerLeaveWindow);
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });

    return () => {
      settleTween?.kill();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("blur", handlePointerLeaveWindow);
      document.removeEventListener("mouseleave", handlePointerLeaveWindow);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      deactivateLiquidCard();
      document.documentElement.classList.remove("custom-cursor-enabled");
      document.body.classList.remove("custom-cursor-enabled");
    };
  }, [pathname]);

  // No cursor element in Sanity Studio
  if (pathname?.startsWith("/studio")) return null;

  return (
    <div className={styles.cursorRoot} ref={rootRef} aria-hidden="true">
      <span className={styles.orb} ref={orbRef} />
    </div>
  );
}
