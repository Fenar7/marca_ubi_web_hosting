"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./Header.module.scss";

const menuItems = [
  { label: "Work", href: "#works", hint: "Selected launches and digital experiences" },
  { label: "Services", href: "#services", hint: "Strategy, art direction, systems, and build" },
  { label: "About", href: "#about", hint: "How Marca Ubi thinks and operates" },
  { label: "Values", href: "#values", hint: "Principles shaping every engagement" },
  { label: "Contact", href: "#contact", hint: "Start a project conversation" },
] as const;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const hintRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const arrowRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const strokeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const burgerLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const menuTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const intro = introRef.current;
    const meta = metaRef.current;
    const footer = footerRef.current;
    const items = itemRefs.current.filter((item): item is HTMLAnchorElement => item !== null);
    const hints = hintRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const arrows = arrowRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const strokes = strokeRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const [lineTop, lineMid, lineBottom] = burgerLineRefs.current;

    if (!overlay || !panel || !intro || !meta || !footer || !lineTop || !lineMid || !lineBottom) {
      return;
    }

    const context = gsap.context(() => {
      const dispatchMenuEvent = (eventName: string) => {
        window.dispatchEvent(new Event(eventName));
      };

      gsap.set(overlay, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(panel, { y: -28, scale: 0.985, autoAlpha: 0 });
      gsap.set([intro, meta, footer], { autoAlpha: 0, y: 24, filter: "blur(10px)" });
      gsap.set(items, {
        autoAlpha: 0,
        yPercent: 110,
        rotateX: -18,
        transformPerspective: 1200,
        transformOrigin: "50% 100%",
        filter: "blur(10px)",
      });
      gsap.set(hints, { autoAlpha: 0, y: 12 });
      gsap.set(arrows, { autoAlpha: 0, x: -14, rotate: -18 });
      gsap.set(strokes, { scaleX: 0, transformOrigin: "left center" });

      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onStart: () => {
          document.body.classList.add("menu-open");
          document.documentElement.classList.add("menu-open");
          dispatchMenuEvent("menu:open");
          overlay.style.pointerEvents = "auto";
        },
        onReverseComplete: () => {
          document.body.classList.remove("menu-open");
          document.documentElement.classList.remove("menu-open");
          dispatchMenuEvent("menu:close");
          gsap.set(overlay, { pointerEvents: "none" });
        },
      });

      timeline
        .to(
          overlay,
          {
            autoAlpha: 1,
            duration: 0.2,
            ease: "power1.out",
          },
          0,
        )
        .to(
          panel,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.72,
            ease: "expo.out",
          },
          0,
        )
        .to(
          [intro, meta],
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.56,
            stagger: 0.08,
          },
          0.1,
        )
        .to(
          items,
          {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.82,
            stagger: 0.08,
            ease: "expo.out",
          },
          0.16,
        )
        .to(
          hints,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.05,
            ease: "power2.out",
          },
          0.28,
        )
        .to(
          arrows,
          {
            autoAlpha: 1,
            x: 0,
            rotate: 0,
            duration: 0.46,
            stagger: 0.05,
            ease: "expo.out",
          },
          0.3,
        )
        .to(
          strokes,
          {
            scaleX: 1,
            duration: 0.54,
            stagger: 0.05,
            ease: "expo.out",
          },
          0.28,
        )
        .to(
          footer,
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
          },
          0.42,
        )
        .to(
          lineTop,
          {
            y: 10,
            rotate: 45,
            duration: 0.34,
            ease: "power2.inOut",
          },
          0,
        )
        .to(
          lineMid,
          {
            autoAlpha: 0,
            scaleX: 0.2,
            duration: 0.22,
            ease: "power2.inOut",
          },
          0,
        )
        .to(
          lineBottom,
          {
            y: -10,
            rotate: -45,
            duration: 0.34,
            ease: "power2.inOut",
          },
          0,
        );

      menuTimelineRef.current = timeline;
    }, headerRef);

    return () => {
      menuTimelineRef.current?.kill();
      menuTimelineRef.current = null;
      document.body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
      window.dispatchEvent(new Event("menu:close"));
      context.revert();
    };
  }, []);

  useEffect(() => {
    const timeline = menuTimelineRef.current;

    if (!timeline) {
      return;
    }

    if (isMenuOpen) {
      timeline.play();
    } else {
      timeline.reverse();
    }
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
        duration: 0.48,
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
    const onEscapePress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onEscapePress);

    return () => {
      window.removeEventListener("keydown", onEscapePress);
    };
  }, []);

  useEffect(() => {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!supportsHover) {
      return;
    }

    const cleanups: Array<() => void> = [];

    itemRefs.current.forEach((item, index) => {
      const hint = hintRefs.current[index];
      const arrow = arrowRefs.current[index];
      const stroke = strokeRefs.current[index];

      if (!item || !hint || !arrow || !stroke) {
        return;
      }

      const onEnter = () => {
        gsap.to(item, { x: 14, duration: 0.38, ease: "expo.out" });
        gsap.to(hint, { x: 10, autoAlpha: 1, duration: 0.34, ease: "power2.out" });
        gsap.to(arrow, { x: 10, rotate: 8, duration: 0.36, ease: "expo.out" });
        gsap.to(stroke, { scaleX: 1, duration: 0.38, ease: "expo.out" });
      };

      const onLeave = () => {
        gsap.to(item, { x: 0, duration: 0.28, ease: "power2.out" });
        gsap.to(hint, { x: 0, duration: 0.24, ease: "power2.out" });
        gsap.to(arrow, { x: 0, rotate: 0, duration: 0.28, ease: "power2.out" });
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

  return (
    <header className={styles.headerContainerMain} ref={headerRef} data-node-id="484:900">
      <div className={`${styles.headerContainer} ${isMenuOpen ? styles.headerContainerHidden : ""}`}>
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

      <div className={styles.menuOverlay} id="site-menu" ref={overlayRef}>
        <button
          aria-label="Close navigation menu"
          className={styles.menuBackdrop}
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />

        <div className={styles.menuPanel} ref={panelRef}>
          <span aria-hidden="true" className={`${styles.menuGlow} ${styles.menuGlowPrimary}`} />
          <span aria-hidden="true" className={`${styles.menuGlow} ${styles.menuGlowSecondary}`} />

          <div className={styles.menuTopbar}>
            <button
              aria-label="Close navigation menu"
              className={styles.menuCloseButton}
              onClick={() => setIsMenuOpen(false)}
              type="button"
            >
              <span aria-hidden="true" className={styles.menuCloseIcon}>
                <span className={styles.menuCloseLine} />
                <span className={styles.menuCloseLine} />
              </span>
              <span className={styles.menuCloseLabel}>Close</span>
            </button>

            <Link className={styles.menuLogoLink} href="/" onClick={() => setIsMenuOpen(false)}>
              <img alt="Marca Ubi." className={styles.menuLogo} src="/hero/marca-ubi-logo.png" />
            </Link>
          </div>

          <div className={styles.menuGrid}>
            <div className={styles.menuMain}>
              <div className={styles.menuIntro} ref={introRef}>
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
                          itemRefs.current[index] = element;
                        }}
                      >
                        <span className={styles.menuIndex}>{`0${index + 1}`}</span>
                        <span className={styles.menuLabelWrap}>
                          <span className={styles.menuLabel}>{item.label}</span>
                          <span
                            className={styles.menuHint}
                            ref={(element) => {
                              hintRefs.current[index] = element;
                            }}
                          >
                            {item.hint}
                          </span>
                          <span
                            aria-hidden="true"
                            className={styles.menuStroke}
                            ref={(element) => {
                              strokeRefs.current[index] = element;
                            }}
                          />
                        </span>
                        <span
                          aria-hidden="true"
                          className={styles.menuArrow}
                          ref={(element) => {
                            arrowRefs.current[index] = element;
                          }}
                        >
                          ↗
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <aside className={styles.menuMeta} ref={metaRef}>
              <p className={styles.menuMetaLabel}>Collaborating globally</p>
              <p className={styles.menuMetaLocations}>
                Bangalore, Kochi, Trivandrum, Dubai, Saudi Arabia, Qatar, Bahrain, UK
              </p>
              <a className={styles.menuMetaLink} href="mailto:hello@marcaubi.com">
                hello@marcaubi.com
              </a>
            </aside>
          </div>

          <div className={styles.menuFooter} ref={footerRef}>
            <span className={styles.menuFooterLine} aria-hidden="true" />
            <p className={styles.menuFooterText}>Brand engineering, art, and digital experience working as one system.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
