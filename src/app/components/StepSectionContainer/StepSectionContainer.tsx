"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldUseMobileMotion } from "@/app/lib/motion";
import SectionTitleBlock from "../ui/SectionTitleBlock/SectionTitleBlock";

const steps = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We begin by understanding the business, the audience, the market context, and the outcomes the work needs to achieve. This stage gives us the clarity required to make better strategic and creative decisions from the start.",
  },
  {
    number: "02",
    title: "Strategy and System",
    description:
      "We turn insight into structure by defining positioning, messaging, visual direction, and the systems that will keep the brand consistent across content, design, and digital experience.",
  },
  {
    number: "03",
    title: "Design and Build",
    description:
      "We shape the brand through identity, interfaces, content, and development, moving through focused execution cycles where craft, usability, and precision are reviewed before anything moves forward.",
  },
  {
    number: "04",
    title: "Deliver and Launch",
    description:
      "We prepare the work for real-world use with clean delivery, practical handoff, and launch-ready assets, so the brand is not just presented well, but built to hold up over time.",
  },
] as const;
const titleLines = [
  "How We Build, From",
  "Strategic Clarity to",
  "Real-World Rollout",
];

const renderTitleLine = (line: string) => {
  const segments = line.split("-");

  if (segments.length === 1) {
    return line;
  }

  return segments.flatMap((segment, index) => {
    if (index === segments.length - 1) {
      return [segment];
    }

    return [
      segment,
      <span className="tag-separator" key={`title-hyphen-${line}-${index}`}>
        -
      </span>,
    ];
  });
};

export default function StepSectionContainer() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const tagIconRef = useRef<HTMLImageElement | null>(null);
  const tagTextRef = useRef<HTMLSpanElement | null>(null);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const descriptionRef = useRef<HTMLSpanElement | null>(null);
  const stepsListRef = useRef<HTMLDivElement | null>(null);
  const monogramRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const tagIcon = tagIconRef.current;
    const tagText = tagTextRef.current;
    const titleLineNodes = titleLineRefs.current.filter((line): line is HTMLSpanElement => line !== null);
    const description = descriptionRef.current;

    if (!section || !tagIcon || !tagText || titleLineNodes.length === 0 || !description) {
      return;
    }

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

    const context = gsap.context(() => {
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

      const tagTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
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

      const titleTimeline = gsap.timeline({
        scrollTrigger: mobileMotion
          ? {
            trigger: section,
            start: "top 82%",
            toggleActions: "play none none reverse",
          }
          : {
            trigger: section,
            start: "top 78%",
            end: "top 24%",
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
            duration: mobileMotion ? 0.86 : 1.06,
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
            duration: mobileMotion ? 0.72 : 0.92,
            ease: mobileMotion ? "power3.out" : "none",
          },
          mobileMotion ? 0.12 : 0.22,
        );

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
        start: "top 74%",
        onEnter: () => iconAmbient.play(),
        onEnterBack: () => iconAmbient.play(),
        onLeaveBack: () => iconAmbient.pause(0),
      });
    }, section);

    return () => {
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stepsList = stepsListRef.current;
    const monogram = monogramRef.current;

    if (!section || !stepsList || !monogram) {
      return;
    }

    const mobileMotion = shouldUseMobileMotion();

    const getProfile = () => {
      const width = window.innerWidth;
      const h = stepsList.offsetHeight;

      if (width <= 899) {
        return {
          startScale: 0.5,
          midScale: 2.55,
          endScale: 6.8,
          startY: 0,
          midY: h * 0.42,
          endY: h * 0.92,
        };
      }

      if (width <= 1280) {
        return {
          startScale: 0.45,
          midScale: 1.9,
          endScale: 4.9,
          startY: 0,
          midY: h * 0.36,
          endY: h * 0.82,
        };
      }

      return {
        startScale: 0.48,
        midScale: 2.3,
        endScale: 6,
        startY: 0,
        midY: h * 0.38,
        endY: h * 0.86,
      };
    };

    const setInitialValues = () => {
      const profile = getProfile();
      gsap.set(monogram, {
        autoAlpha: 0.9,
        y: profile.startY,
        scale: profile.startScale,
        rotation: 0,
        transformOrigin: "50% 50%",
      });
    };

    const setFinalValues = () => {
      const profile = getProfile();
      gsap.set(monogram, {
        autoAlpha: 0,
        y: profile.endY,
        scale: profile.endScale,
        rotation: 0,
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFinalValues();
      return;
    }

    const getTriggerRange = () => {
      if (mobileMotion) {
        return {
          start: "top bottom",
          end: "bottom top",
          scrub: 0.95,
        };
      }

      return {
        start: "top 92%",
        end: "bottom 2%",
        scrub: 1.05,
      };
    };

    const context = gsap.context(() => {
      setInitialValues();
      const triggerRange = getTriggerRange();

      const monogramTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: stepsList,
          start: triggerRange.start,
          endTrigger: stepsList,
          end: triggerRange.end,
          scrub: triggerRange.scrub,
          invalidateOnRefresh: true,
          onRefresh: setInitialValues,
        },
      });

      monogramTimeline
        .to(
          monogram,
          {
            autoAlpha: 0.94,
            y: () => getProfile().midY,
            scale: () => getProfile().midScale,
            rotation: 0,
            duration: 0.42,
            ease: "none",
          },
          0,
        )
        .to(
          monogram,
          {
            autoAlpha: 0,
            y: () => getProfile().endY,
            scale: () => getProfile().endScale,
            rotation: 0,
            duration: 0.58,
            ease: "none",
          },
          0.42,
        );
    }, section);

    const refreshFrameId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    const refreshTimerId = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 450);

    return () => {
      window.cancelAnimationFrame(refreshFrameId);
      window.clearTimeout(refreshTimerId);
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!supportsFinePointer) {
      return;
    }

    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-liquid-card]"));
    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const blob = card.querySelector<HTMLElement>(".step-card-liquid-blob");

      if (!blob) {
        return;
      }

      const centerBlob = () => {
        const bounds = card.getBoundingClientRect();
        gsap.set(blob, {
          x: bounds.width * 0.5,
          y: bounds.height * 0.5,
        });
      };

      centerBlob();
      gsap.set(blob, { autoAlpha: 0, scale: 0.54, force3D: true });

      const blobX = gsap.quickTo(blob, "x", { duration: 0.22, ease: "power3.out" });
      const blobY = gsap.quickTo(blob, "y", { duration: 0.22, ease: "power3.out" });

      const toLocalPoint = (event: PointerEvent) => {
        const bounds = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
        const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
        return { x, y };
      };

      const onEnter = (event: PointerEvent) => {
        const point = toLocalPoint(event);
        card.classList.add("is-cursor-liquid");
        blobX(point.x);
        blobY(point.y);
        gsap.to(blob, {
          autoAlpha: 0.96,
          scale: 1,
          duration: 0.44,
          ease: "expo.out",
          overwrite: "auto",
        });
      };

      const onMove = (event: PointerEvent) => {
        const point = toLocalPoint(event);
        blobX(point.x);
        blobY(point.y);
      };

      const onLeave = () => {
        card.classList.remove("is-cursor-liquid");
        gsap.to(blob, {
          autoAlpha: 0,
          scale: 0.56,
          duration: 0.34,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      const onWindowResize = () => {
        centerBlob();
      };

      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      window.addEventListener("resize", onWindowResize, { passive: true });

      cleanups.push(() => {
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("resize", onWindowResize);
        card.classList.remove("is-cursor-liquid");
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <section className="step-section-container-main" data-node-id="484:1028" ref={sectionRef}>
      <div className="step-section-container container">
        <SectionTitleBlock
          className="step-title-section"
          descriptionClassName="step-title-description"
          description={
            <span className="step-title-description-inner" ref={descriptionRef}>
              From first conversation to final delivery, Marca Ubi follows a structured process that
              keeps thinking sharp, execution aligned, and every touchpoint true to the brand.
            </span>
          }
          leftColumnClassName="step-title-left-column"
          tagClassName="step-title-tag"
          tagIcon={<img className="step-title-tag-icon" ref={tagIconRef} src="/images/asterisk.png" alt="" aria-hidden="true" />}
          tagTextClassName="step-title-tag-text"
          label={
            <span className="step-title-tag-text-inner" ref={tagTextRef}>
              Step<span className="tag-separator">-</span>by<span className="tag-separator">-</span>Step
            </span>
          }
          rightColumnClassName="step-title-right-column"
          titleClassName="step-title"
          title={
            <span className="step-title-inner">
              {titleLines.map((line, index) => (
                <span className="step-title-line-mask" key={line}>
                  <span
                    className="step-title-line"
                    ref={(element) => {
                      titleLineRefs.current[index] = element;
                    }}
                  >
                    {renderTitleLine(line)}
                  </span>
                </span>
              ))}
            </span>
          }
        />

        <div className="steps-list" ref={stepsListRef}>
          <div className="steps-bg-monogram-layer" aria-hidden="true">
            <img
              className="steps-bg-monogram"
              ref={monogramRef}
              src="/images/m-logo.png"
              alt=""
              aria-hidden="true"
            />
          </div>

          {steps.map((step) => (
            <article className="step-item-container" data-liquid-card key={step.number}>
              <span className="step-card-liquid-blob" aria-hidden="true" />

              <div className="left-section">
                <span className="step-line" aria-hidden="true" />
                <div className="count-container">
                  <p>{step.number}</p>
                  <h5>{step.title}</h5>
                </div>
              </div>

              <div className="right-section">
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
