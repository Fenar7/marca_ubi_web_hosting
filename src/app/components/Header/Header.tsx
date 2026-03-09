"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./Header.module.scss";

const menuItems = ["Work", "Services", "About", "Insights", "Contact"];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const burgerLineRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useLayoutEffect(() => {
    const panel = menuPanelRef.current;
    const items = menuItemRefs.current.filter((item): item is HTMLAnchorElement => item !== null);

    if (!panel) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(panel, {
        autoAlpha: 0,
        y: -20,
        clipPath: "inset(0 100% 100% 0 round 18px)",
        pointerEvents: "none",
      });
      gsap.set(items, { autoAlpha: 0, y: 24 });
    }, headerRef);

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    const [lineTop, lineMid, lineBottom] = burgerLineRefs.current;
    const panel = menuPanelRef.current;
    const items = menuItemRefs.current.filter((item): item is HTMLAnchorElement => item !== null);

    if (!lineTop || !lineMid || !lineBottom || !panel) {
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
            y: 0,
            clipPath: "inset(0 0% 0% 0 round 18px)",
            pointerEvents: "auto",
            duration: 0.62,
            ease: "power4.out",
          },
          0,
        )
        .to(
          items,
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.07,
            duration: 0.48,
            ease: "power3.out",
          },
          0.15,
        )
        .to(
          lineTop,
          {
            y: 12,
            rotate: 37,
            duration: 0.48,
          },
          0,
        )
        .to(
          lineMid,
          {
            scaleX: 0.2,
            autoAlpha: 0,
            duration: 0.34,
          },
          0,
        )
        .to(
          lineBottom,
          {
            y: -12,
            rotate: -37,
            duration: 0.48,
          },
          0,
        );
      document.body.classList.add("menu-open");
    } else {
      timeline
        .to(
          items,
          {
            autoAlpha: 0,
            y: 16,
            stagger: { each: 0.05, from: "end" },
            duration: 0.24,
            ease: "power2.in",
          },
          0,
        )
        .to(
          panel,
          {
            autoAlpha: 0,
            y: -14,
            clipPath: "inset(0 100% 100% 0 round 18px)",
            pointerEvents: "none",
            duration: 0.42,
            ease: "power3.inOut",
          },
          0.06,
        )
        .to(
          lineTop,
          {
            y: 0,
            rotate: 0,
            duration: 0.4,
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
          0.02,
        )
        .to(
          lineBottom,
          {
            y: 0,
            rotate: 0,
            duration: 0.4,
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

      <div className={styles.menuPanel} ref={menuPanelRef}>
        <nav aria-label="Primary">
          <ul className={styles.menuList}>
            {menuItems.map((itemLabel, index) => (
              <li key={itemLabel}>
                <a
                  className={styles.menuLink}
                  href="#"
                  onClick={() => setIsMenuOpen(false)}
                  ref={(element) => {
                    menuItemRefs.current[index] = element;
                  }}
                >
                  {itemLabel}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
