"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { shouldUseMobileMotion } from "@/app/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const valueItems = [
  {
    title: "Purpose",
    text: "Build brands and experiences that stay consistent everywhere.",
  },
  {
    title: "Where We\u2019re Going",
    text: "Set a higher standard for how modern brands are built and shipped.",
  },
  {
    title: "Values",
    text: "Clarity over noise. Craft over shortcuts. Consistency over trends.",
  },
  {
    title: "Operating Philosophy",
    text: "Communicate early. Systemize. Execute with control.",
  },
];

const titleLines = ["What We Stand For"];

const OurValuesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const tagIconRef = useRef<HTMLImageElement>(null);
  const tagTextRef = useRef<HTMLSpanElement>(null);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const tagIcon = tagIconRef.current;
      const tagText = tagTextRef.current;
      const titleLineNodes = titleLineRefs.current.filter(
        (el): el is HTMLSpanElement => el !== null,
      );
      const description = descriptionRef.current;
      const bgImage = bgImageRef.current;
      const cardsContainer = cardsContainerRef.current;

      if (
        !section ||
        !tagIcon ||
        !tagText ||
        titleLineNodes.length === 0 ||
        !description ||
        !bgImage ||
        !cardsContainer
      )
        return;

      const mobileMotion = shouldUseMobileMotion();

      const setFinalValues = () => {
        gsap.set(tagIcon, { autoAlpha: 1, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" });
        gsap.set(tagText, { autoAlpha: 1, x: 0, y: 0, filter: "blur(0px)" });
        gsap.set(titleLineNodes, {
          autoAlpha: 1,
          yPercent: 0,
          xPercent: 0,
          rotateY: 0,
          rotateX: 0,
          skewY: 0,
          letterSpacing: "-0.01em",
          filter: "blur(0px)",
        });
        gsap.set(description, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          filter: "blur(0px)",
        });
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setFinalValues();
        return;
      }

      // ─── Initial states ─────────────────────────────────────────────────────
      gsap.set(tagIcon, {
        autoAlpha: 0,
        y: 14,
        rotate: -170,
        scale: 0.28,
        transformOrigin: "50% 50%",
        filter: "blur(5px)",
      });
      gsap.set(tagText, { autoAlpha: 0, y: 16, x: 12, filter: "blur(5px)" });
      gsap.set(titleLineNodes, {
        autoAlpha: 0,
        yPercent: 112,
        xPercent: -8,
        rotateY: -24,
        rotateX: 10,
        skewY: 3,
        letterSpacing: "0.015em",
        transformPerspective: 1200,
        transformOrigin: "0% 100%",
        filter: "blur(9px)",
      });
      gsap.set(description, {
        autoAlpha: 0,
        x: 34,
        y: 16,
        clipPath: "inset(0% 100% 0% 0%)",
        filter: "blur(7px)",
      });

      // ─── Tag animation (icon spin + text slide) ─────────────────────────────
      const tagTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      tagTimeline
        .to(
          tagIcon,
          {
            autoAlpha: 1,
            y: 0,
            rotate: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.78,
            ease: "expo.out",
          },
          0,
        )
        .to(
          tagText,
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
            duration: 0.72,
            ease: "power3.out",
          },
          0.14,
        );

      // ─── Title + description scrub ──────────────────────────────────────────
      const titleTimeline = gsap.timeline({
        scrollTrigger: mobileMotion
          ? {
              trigger: section,
              start: "top 86%",
              toggleActions: "play none none reverse",
            }
          : {
              trigger: section,
              start: "top 88%",
              end: "top 30%",
              scrub: 1,
              invalidateOnRefresh: true,
            },
      });

      titleTimeline
        .to(
          titleLineNodes,
          {
            autoAlpha: 1,
            yPercent: 0,
            xPercent: 0,
            rotateY: 0,
            rotateX: 0,
            skewY: 0,
            letterSpacing: "-0.01em",
            filter: "blur(0px)",
            duration: mobileMotion ? 0.82 : 1.06,
            stagger: 0.14,
            ease: mobileMotion ? "expo.out" : "none",
          },
          0,
        )
        .to(
          description,
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            filter: "blur(0px)",
            duration: mobileMotion ? 0.68 : 0.92,
            ease: mobileMotion ? "power3.out" : "none",
          },
          mobileMotion ? 0.12 : 0.22,
        );

      // ─── Ambient rotating icon ──────────────────────────────────────────────
      const iconAmbient = gsap.to(tagIcon, {
        y: -2,
        rotate: 8,
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 85%",
        onEnter: () => iconAmbient.play(),
        onEnterBack: () => iconAmbient.play(),
        onLeaveBack: () => iconAmbient.pause(0),
      });

      // ─── Background parallax ────────────────────────────────────────────────
      if (!mobileMotion) {
        gsap.fromTo(
          bgImage,
          { yPercent: -8, scale: 1.15 },
          {
            yPercent: 8,
            scale: 1.05,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      } else {
        gsap.set(bgImage, { yPercent: 0, scale: 1.04 });
      }

      // ─── Feature cards: stagger entrance ────────────────────────────────────
      const cards = gsap.utils.toArray<HTMLElement>(".values-feature-item");

      cards.forEach((card, index) => {
        const line = card.querySelector<HTMLElement>(".values-item-line");
        const heading = card.querySelector<HTMLElement>("h6");
        const body = card.querySelector<HTMLElement>("p");

        gsap.fromTo(
          card,
          {
            autoAlpha: 0,
            y: mobileMotion ? 24 : 60,
            scale: mobileMotion ? 0.98 : 0.92,
            filter: mobileMotion ? "none" : "blur(6px)",
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: mobileMotion ? 0.64 : 0.9,
            delay: index * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cardsContainer,
              start: mobileMotion ? "top 88%" : "top 95%",
              toggleActions: "play none none reverse",
            },
          },
        );

        // Line grows from left
        if (line) {
          gsap.fromTo(
            line,
            { scaleX: 0, transformOrigin: "left center" },
            {
              scaleX: 1,
              duration: mobileMotion ? 0.52 : 0.7,
              delay: 0.3 + index * 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: cardsContainer,
                start: mobileMotion ? "top 88%" : "top 95%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        // Heading slides up
        if (heading) {
          gsap.fromTo(
            heading,
            { y: 20, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: mobileMotion ? 0.48 : 0.6,
              delay: 0.4 + index * 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: cardsContainer,
                start: mobileMotion ? "top 88%" : "top 95%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        // Body text fades in
        if (body) {
          gsap.fromTo(
            body,
            { y: 14, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: mobileMotion ? 0.42 : 0.55,
              delay: 0.52 + index * 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: cardsContainer,
                start: mobileMotion ? "top 88%" : "top 95%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      className="our-values-section-container"
      data-node-id="553:1162"
      ref={sectionRef}
    >
      {/* Parallax background layer */}
      <div className="our-values-bg-layer" ref={bgImageRef} aria-hidden="true">
        <img
          className="our-values-bg-image"
          src="/images/what-we-stand-for.png"
          alt=""
          aria-hidden="true"
        />
      </div>
      <div className="our-values-bg-overlay" aria-hidden="true" />

      <div className="our-values-section container">
        <div className="our-values-title-container">
          <div className="title-left-section">
            <div className="our-values-tag">
              <img
                className="our-values-tag-icon"
                ref={tagIconRef}
                src="/images/asterisk.png"
                alt=""
                aria-hidden="true"
              />
              <p>
                <span className="our-values-tag-text" ref={tagTextRef}>
                  Our Values
                </span>
              </p>
            </div>
            <h2>
              <span className="our-values-title-inner">
                {titleLines.map((line, index) => (
                  <span className="our-values-title-line-mask" key={line}>
                    <span
                      className="our-values-title-line"
                      ref={(el) => {
                        titleLineRefs.current[index] = el;
                      }}
                    >
                      {line}
                    </span>
                  </span>
                ))}
              </span>
            </h2>
          </div>

          <p className="title-description">
            <span className="title-description-inner" ref={descriptionRef}>
              Marca Ubi is built on a simple belief: strong brands are
              engineered, not improvised. These principles guide how we
              communicate, design, build, and deliver work that stays consistent
              long after launch.
            </span>
          </p>
        </div>

        <div
          className="bottom-feature-cards-container"
          ref={cardsContainerRef}
        >
          {valueItems.map((item) => (
            <article className="values-feature-item" key={item.title}>
              <span className="values-item-line" aria-hidden="true" />
              <h6>{item.title}</h6>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurValuesSection;
