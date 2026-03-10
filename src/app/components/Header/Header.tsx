"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./Header.module.scss";

const menuItems = [
  { label: "Work", href: "#works", hint: "Selected brand and digital launches" },
  { label: "Services", href: "#services", hint: "How strategy, art, and systems connect" },
  { label: "About", href: "#about", hint: "What Marca Ubi builds and how it thinks" },
  { label: "Insights", href: "#values", hint: "Principles shaping every engagement" },
  { label: "Contact", href: "#contact", hint: "Start a project conversation" },
] as const;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuShellRef = useRef<HTMLDivElement | null>(null);
  const menuGlowRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const menuItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const menuHintRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const menuArrowRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const menuStrokeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const burgerLineRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useLayoutEffect(() => {
    const panel = menuPanelRef.current;
    const shell = menuShellRef.current;
    const footer = footerRef.current;
    const glows = menuGlowRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const items = menuItemRefs.current.filter((item): item is HTMLAnchorElement => item !== null);
    const hints = menuHintRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const arrows = menuArrowRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const strokes = menuStrokeRefs.current.filter((item): item is HTMLSpanElement => item !== null);

    if (!panel || !shell) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(panel, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(shell, {
        autoAlpha: 0,
        clipPath: "inset(0 0 100% 0 round 0 0 2rem 2rem)",
        yPercent: -6,
      });
      gsap.set(items, {
        autoAlpha: 0,
        yPercent: 118,
        rotateX: -26,
        transformPerspective: 1200,
        transformOrigin: "50% 100%",
        filter: "blur(10px)",
      });
      gsap.set(hints, { autoAlpha: 0, y: 12 });
      gsap.set(arrows, { autoAlpha: 0, x: -16, rotate: -24 });
      gsap.set(strokes, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(glows, { autoAlpha: 0, scale: 0.84 });
      if (footer) {
        gsap.set(footer, { autoAlpha: 0, y: 24, filter: "blur(8px)" });
      }
    }, headerRef);

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    const [lineTop, lineMid, lineBottom] = burgerLineRefs.current;
    const panel = menuPanelRef.current;
    const shell = menuShellRef.current;
    const footer = footerRef.current;
    const glows = menuGlowRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const items = menuItemRefs.current.filter((item): item is HTMLAnchorElement => item !== null);
    const hints = menuHintRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const arrows = menuArrowRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const strokes = menuStrokeRefs.current.filter((item): item is HTMLSpanElement => item !== null);

    if (!lineTop || !lineMid || !lineBottom || !panel || !shell) {
      return;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
    });

    if (isMenuOpen) {
      timeline
        .to(
          panel,
          {
            autoAlpha: 1,
            pointerEvents: "auto",
            duration: 0.16,
          },
          0,
        )
        .to(
          shell,
          {
            autoAlpha: 1,
            yPercent: 0,
            clipPath: "inset(0 0 0% 0 round 0 0 2rem 2rem)",
            duration: 0.88,
            ease: "expo.inOut",
          },
          0,
        )
        .to(
          glows,
          {
            autoAlpha: 1,
            scale: 1,
            duration: 1.1,
            stagger: 0.08,
            ease: "expo.out",
          },
          0.08,
        )
        .to(
          items,
          {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 1,
            stagger: 0.09,
            ease: "expo.out",
          },
          0.18,
        )
        .to(
          hints,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.54,
            stagger: 0.06,
            ease: "power2.out",
          },
          0.38,
        )
        .to(
          arrows,
          {
            autoAlpha: 1,
            x: 0,
            rotate: 0,
            duration: 0.56,
            stagger: 0.06,
            ease: "expo.out",
          },
          0.36,
        )
        .to(
          strokes,
          {
            scaleX: 1,
            duration: 0.72,
            stagger: 0.07,
            ease: "expo.out",
          },
          0.34,
        )
        .to(
          footer,
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.62,
            ease: "power3.out",
          },
          0.48,
        )
        .to(
          lineTop,
          {
            y: 10,
            rotate: 42,
            duration: 0.46,
          },
          0,
        )
        .to(
          lineMid,
          {
            scaleX: 0.16,
            autoAlpha: 0,
            duration: 0.3,
          },
          0,
        )
        .to(
          lineBottom,
          {
            y: -10,
            rotate: -42,
            duration: 0.46,
          },
          0,
        );
      document.body.classList.add("menu-open");
    } else {
      timeline
        .to(
          footer,
          {
            autoAlpha: 0,
            y: 18,
            filter: "blur(8px)",
            duration: 0.22,
            ease: "power2.in",
          },
          0,
        )
        .to(
          [...hints, ...arrows],
          {
            autoAlpha: 0,
            y: 8,
            x: 0,
            duration: 0.2,
            stagger: { each: 0.02, from: "end" },
            ease: "power2.in",
          },
          0,
        )
        .to(
          strokes,
          {
            scaleX: 0,
            duration: 0.24,
            stagger: { each: 0.03, from: "end" },
            ease: "power2.in",
          },
          0.02,
        )
        .to(
          items,
          {
            autoAlpha: 0,
            yPercent: 108,
            rotateX: -18,
            filter: "blur(8px)",
            duration: 0.42,
            stagger: { each: 0.05, from: "end" },
            ease: "power3.in",
          },
          0.04,
        )
        .to(
          glows,
          {
            autoAlpha: 0,
            scale: 0.88,
            duration: 0.22,
            stagger: { each: 0.04, from: "end" },
            ease: "power2.in",
          },
          0.04,
        )
        .to(
          shell,
          {
            autoAlpha: 0,
            yPercent: -6,
            clipPath: "inset(0 0 100% 0 round 0 0 2rem 2rem)",
            duration: 0.54,
            ease: "expo.inOut",
          },
          0.12,
        )
        .to(
          panel,
          {
            autoAlpha: 0,
            pointerEvents: "none",
            duration: 0.16,
          },
          0.54,
        )
        .to(
          lineTop,
          {
            y: 0,
            rotate: 0,
            duration: 0.38,
          },
          0,
        )
        .to(
          lineMid,
          {
            scaleX: 1,
            autoAlpha: 1,
            duration: 0.26,
          },
          0.04,
        )
        .to(
          lineBottom,
          {
            y: 0,
            rotate: 0,
            duration: 0.38,
          },
          0,
        );
      document.body.classList.remove("menu-open");
    }

    return () => {
      timeline.kill();
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const header = headerRef.current;

    if (!header) {
      return;
    }

    let previousScrolledState: boolean | null = null;

    const syncHeader = () => {
      const isScrolled = window.scrollY > 24;
      if (isScrolled === previousScrolledState) {
        return;
      }
      previousScrolledState = isScrolled;

      header.classList.toggle(styles.isPinned, isScrolled);
      header.classList.toggle(styles.isScrolled, isScrolled);
      gsap.to(header, {
        y: isScrolled ? 0 : -2,
        backgroundColor: isScrolled ? "rgba(8, 9, 12, 0.62)" : "rgba(8, 9, 12, 0)",
        borderColor: isScrolled ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0)",
        backdropFilter: isScrolled ? "blur(26px)" : "blur(0px)",
        duration: 0.62,
        ease: "power3.out",
      });
    };

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncHeader);
    };
  }, []);

  useEffect(() => {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!supportsHover) {
      return;
    }

    const cleanups: Array<() => void> = [];

    menuItemRefs.current.forEach((item, index) => {
      const hint = menuHintRefs.current[index];
      const arrow = menuArrowRefs.current[index];
      const stroke = menuStrokeRefs.current[index];

      if (!item || !hint || !arrow || !stroke) {
        return;
      }

      const onEnter = () => {
        gsap.to(item, { x: 16, duration: 0.42, ease: "expo.out" });
        gsap.to(hint, { x: 10, autoAlpha: 1, duration: 0.4, ease: "power2.out" });
        gsap.to(arrow, { x: 10, rotate: 8, duration: 0.42, ease: "expo.out" });
        gsap.to(stroke, { scaleX: 1, transformOrigin: "left center", duration: 0.42, ease: "expo.out" });
      };

      const onLeave = () => {
        gsap.to(item, { x: 0, duration: 0.34, ease: "power3.out" });
        gsap.to(hint, { x: 0, duration: 0.28, ease: "power2.out" });
        gsap.to(arrow, { x: 0, rotate: 0, duration: 0.34, ease: "power3.out" });
      };

      item.addEventListener("pointerenter", onEnter);
      item.addEventListener("pointerleave", onLeave);

      cleanups.push(() => {
        item.removeEventListener("pointerenter", onEnter);
        item.removeEventListener("pointerleave", onLeave);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    const onEscapePress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onEscapePress);

    return () => {
      window.removeEventListener("keydown", onEscapePress);
      document.body.classList.remove("menu-open");
    };
  }, []);

  return (
    <header className={styles.headerContainerMain} ref={headerRef} data-node-id="484:900">
      <div className={styles.headerContainer}>
        <button
          aria-controls="site-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className={styles.hamburgerButton}
          onClick={() => setIsMenuOpen((prevValue) => !prevValue)}
          type="button"
          data-node-id="484:902"
        >
          {[0, 1, 2].map((index) => (
            <span
              className={styles.burgerLine}
              key={index}
              ref={(element) => {
                burgerLineRefs.current[index] = element;
              }}
            />
          ))}
        </button>

        <Link className={styles.logoSection} href="/" data-node-id="484:901">
          <img alt="Marca Ubi." className={styles.logoImage} src="/hero/marca-ubi-logo.png" />
        </Link>
      </div>

      <div className={styles.menuPanel} id="site-menu" ref={menuPanelRef}>
        <button
          aria-label="Close navigation menu"
          className={styles.menuBackdrop}
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />

        <div className={styles.menuShell} ref={menuShellRef}>
          <span
            aria-hidden="true"
            className={`${styles.menuGlow} ${styles.menuGlowPrimary}`}
            ref={(element) => {
              menuGlowRefs.current[0] = element;
            }}
          />
          <span
            aria-hidden="true"
            className={`${styles.menuGlow} ${styles.menuGlowSecondary}`}
            ref={(element) => {
              menuGlowRefs.current[1] = element;
            }}
          />

          <div className={styles.menuIntro}>
            <p className={styles.menuEyebrow}>Navigate the studio</p>
            <p className={styles.menuLead}>
              Strategy, art direction, identity systems, and digital experiences shaped into one
              coherent brand language.
            </p>
          </div>

          <nav aria-label="Primary">
            <ul className={styles.menuList}>
              {menuItems.map((item, index) => (
                <li className={styles.menuItem} key={item.label}>
                  <a
                    className={styles.menuLink}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    ref={(element) => {
                      menuItemRefs.current[index] = element;
                    }}
                  >
                    <span className={styles.menuIndex}>{`0${index + 1}`}</span>
                    <span className={styles.menuLabelWrap}>
                      <span className={styles.menuLabel}>{item.label}</span>
                      <span
                        className={styles.menuHint}
                        ref={(element) => {
                          menuHintRefs.current[index] = element;
                        }}
                      >
                        {item.hint}
                      </span>
                      <span
                        aria-hidden="true"
                        className={styles.menuStroke}
                        ref={(element) => {
                          menuStrokeRefs.current[index] = element;
                        }}
                      />
                    </span>
                    <span
                      aria-hidden="true"
                      className={styles.menuArrow}
                      ref={(element) => {
                        menuArrowRefs.current[index] = element;
                      }}
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.menuFooter} ref={footerRef}>
            <p className={styles.menuFooterKicker}>Collaborating globally</p>
            <p className={styles.menuFooterBody}>Dubai, Qatar, Bahrain, India</p>
            <a className={styles.menuFooterLink} href="mailto:hello@marcaubi.com">
              hello@marcaubi.com
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
