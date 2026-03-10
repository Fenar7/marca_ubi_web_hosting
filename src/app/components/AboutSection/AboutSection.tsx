"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldUseMobileMotion } from "@/app/lib/motion";
import PillButton from "../ui/PillButton/PillButton";
import styles from "./AboutSection.module.scss";

const services = [
  { number: "01", title: "Brand Engineering" },
  { number: "02", title: "Identity & Art Systems" },
  { number: "03", title: "Digital Experience Design" },
  { number: "04", title: "Communication & Growth" },
];

const metrics = [
  {
    value: 100,
    suffix: "+",
    title: "Brands & Businesses Served",
    description:
      "Across strategy, identity, digital platforms, and communication systems.",
  },
  {
    value: 12,
    suffix: "+",
    title: "Brand Engineering Services",
    description:
      "From positioning and messaging to identity systems and market direction.",
  },
  {
    value: 3,
    suffix: "",
    title: "Integrated Disciplines",
    description:
      "Brand engineering, art, and experience design working as one system.",
  },
  {
    value: 360,
    suffix: "\u00b0",
    title: "Brand Application Scope",
    description:
      "Built across strategy, visuals, digital platforms, and communication touchpoints.",
  },
];

const getMetricCountStops = (value: number) => {
  if (value <= 0) {
    return [0];
  }

  if (value <= 12) {
    return Array.from({ length: value + 1 }, (_, index) => index);
  }

  const segmentCount = 10;
  const step = value / segmentCount;
  const stops = Array.from({ length: segmentCount + 1 }, (_, index) => Math.round(index * step));

  stops[0] = 0;
  stops[stops.length - 1] = value;

  return [...new Set(stops)];
};

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const aboutStarRef = useRef<HTMLImageElement | null>(null);
  const aboutTagTextRef = useRef<HTMLParagraphElement | null>(null);
  const [titleLines, setTitleLines] = useState<string[]>([]);
  const titleWordsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const servicesContainerRef = useRef<HTMLDivElement | null>(null);
  const serviceItemRefs = useRef<Array<HTMLElement | null>>([]);
  const serviceIconRefs = useRef<Array<HTMLImageElement | null>>([]);
  const serviceNumberRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const serviceTitleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const textAndMetricsRef = useRef<HTMLDivElement | null>(null);
  const aboutDescriptionRef = useRef<HTMLParagraphElement | null>(null);
  const aboutLineRef = useRef<HTMLSpanElement | null>(null);
  const aboutButtonRef = useRef<HTMLDivElement | null>(null);
  const metricsCardsRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const metricTopRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const metricTitleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const metricDescriptionRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const countTrackRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const countSuffixRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const aboutStar = aboutStarRef.current;
    const aboutTagText = aboutTagTextRef.current;
    const servicesContainer = servicesContainerRef.current;
    const serviceItems = serviceItemRefs.current.filter((item): item is HTMLElement => item !== null);
    const serviceIcons = serviceIconRefs.current.filter((item): item is HTMLImageElement => item !== null);
    const serviceNumbers = serviceNumberRefs.current.filter((item): item is HTMLSpanElement => item !== null);
    const serviceTitles = serviceTitleRefs.current.filter((item): item is HTMLHeadingElement => item !== null);
    const textAndMetrics = textAndMetricsRef.current;
    const aboutDescription = aboutDescriptionRef.current;
    const aboutLine = aboutLineRef.current;
    const aboutButton = aboutButtonRef.current;
    const metricsCards = metricsCardsRef.current;
    const metricCards = cardRefs.current.filter((element): element is HTMLElement => element !== null);
    const metricTopRows = metricTopRowRefs.current.filter((element): element is HTMLDivElement => element !== null);
    const metricTitles = metricTitleRefs.current.filter((element): element is HTMLHeadingElement => element !== null);
    const metricDescriptions = metricDescriptionRefs.current.filter((element): element is HTMLParagraphElement => element !== null);
    const countTracks = countTrackRefs.current.filter((element): element is HTMLSpanElement => element !== null);
    const countSuffixes = countSuffixRefs.current.filter(
      (element): element is HTMLSpanElement => element !== null,
    );

    if (!section) {
      return;
    }

    const mobileMotion = shouldUseMobileMotion();

    const setFinalValues = () => {
      countTracks.forEach((track) => {
        const steps = Number(track.dataset.steps ?? "1");
        gsap.set(track, { yPercent: -100 * Math.max(steps - 1, 0) });
      });
      gsap.set(metricCards, {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        rotateZ: 0,
        scale: 1,
        filter: "blur(0px)",
        boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      });
      gsap.set(metricTopRows, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(metricTitles, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      gsap.set(metricDescriptions, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      gsap.set(countSuffixes, { autoAlpha: 1, y: 0, scale: 1 });
      if (aboutDescription) {
        gsap.set(aboutDescription, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      }
      if (aboutLine) {
        gsap.set(aboutLine, { scaleY: 1, autoAlpha: 1, transformOrigin: "50% 0%" });
      }
      if (aboutButton) {
        gsap.set(aboutButton, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          skewY: 0,
          filter: "blur(0px)",
        });
      }
      gsap.set(serviceItems, { autoAlpha: 1, y: 0, rotateX: 0, filter: "blur(0px)" });
      gsap.set(serviceIcons, { autoAlpha: 1, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" });
      gsap.set(serviceNumbers, { autoAlpha: 1, x: 0 });
      gsap.set(serviceTitles, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" });
      if (aboutStar) {
        gsap.set(aboutStar, { autoAlpha: 1, scale: 1, rotate: 0, y: 0, filter: "blur(0px)" });
      }
      if (aboutTagText) {
        gsap.set(aboutTagText, { autoAlpha: 1, x: 0, y: 0, filter: "blur(0px)" });
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFinalValues();
      return;
    }

    const context = gsap.context(() => {
      if (aboutStar) {
        gsap.set(aboutStar, {
          autoAlpha: 0,
          y: 14,
          rotate: -170,
          scale: 0.28,
          transformOrigin: "50% 50%",
          filter: "blur(5px)",
        });
      }
      if (aboutTagText) {
        gsap.set(aboutTagText, { autoAlpha: 0, y: 16, x: 12, filter: "blur(5px)" });
      }

      const tagTimeline = gsap.timeline({
        scrollTrigger: mobileMotion
          ? {
            trigger: section,
            start: "top 74%",
            toggleActions: "play none none reverse",
          }
          : {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
      });

      let starAmbient: gsap.core.Tween | null = null;

      if (aboutStar) {
        tagTimeline.to(
          aboutStar,
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
        );
      }

      if (aboutTagText) {
        tagTimeline.to(
          aboutTagText,
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
      }

      if (aboutStar) {
        starAmbient = gsap.to(aboutStar, {
          y: -2,
          rotate: 10,
          duration: 1.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });
      }

      if (starAmbient) {
        tagTimeline.eventCallback("onComplete", () => {
          starAmbient?.play();
        });
        tagTimeline.eventCallback("onReverseComplete", () => {
          starAmbient?.pause(0);
        });
      }

      if (servicesContainer && serviceItems.length > 0) {
        gsap.set(serviceItems, {
          autoAlpha: mobileMotion ? 0 : 0.14,
          y: mobileMotion ? 30 : 54,
          rotateX: mobileMotion ? 0 : 24,
          rotateZ: mobileMotion ? 0 : -1.2,
          scale: mobileMotion ? 0.98 : 0.968,
          transformPerspective: 900,
          transformOrigin: "50% 100%",
          filter: mobileMotion ? "none" : "blur(9px)",
        });
        gsap.set(serviceIcons, {
          autoAlpha: 0,
          y: mobileMotion ? 12 : 16,
          rotate: mobileMotion ? -24 : -160,
          scale: mobileMotion ? 0.82 : 0.3,
          transformOrigin: "50% 50%",
          filter: mobileMotion ? "none" : "blur(4px)",
        });
        gsap.set(serviceNumbers, { autoAlpha: mobileMotion ? 0 : 0.22, x: mobileMotion ? -10 : -18, y: mobileMotion ? 0 : 10 });
        gsap.set(serviceTitles, {
          autoAlpha: mobileMotion ? 0 : 0.2,
          y: mobileMotion ? 18 : 30,
          clipPath: "inset(0% 0% 100% 0%)",
          filter: mobileMotion ? "none" : "blur(4px)",
        });

        const servicesTimeline = gsap.timeline({
          scrollTrigger: mobileMotion
            ? {
              trigger: servicesContainer,
              start: "top 74%",
              toggleActions: "play none none reverse",
            }
            : {
              trigger: servicesContainer,
              start: "top 92%",
              end: "top 28%",
              scrub: 0.95,
              invalidateOnRefresh: true,
            },
        });

        servicesTimeline
          .to(
            serviceItems,
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              rotateZ: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.68 : 1.18,
              stagger: 0.12,
              ease: mobileMotion ? "power3.out" : "none",
            },
            0,
          )
          .to(
            serviceIcons,
            {
              autoAlpha: 1,
              y: 0,
              rotate: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.58 : 1.04,
              stagger: 0.12,
              ease: mobileMotion ? "back.out(1.8)" : "none",
            },
            mobileMotion ? 0.08 : 0.1,
          )
          .to(
            serviceNumbers,
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration: mobileMotion ? 0.52 : 0.88,
              stagger: 0.12,
              ease: mobileMotion ? "power2.out" : "none",
            },
            mobileMotion ? 0.14 : 0.3,
          )
          .to(
            serviceTitles,
            {
              autoAlpha: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              filter: "blur(0px)",
              duration: mobileMotion ? 0.62 : 0.96,
              stagger: 0.12,
              ease: mobileMotion ? "power3.out" : "none",
            },
            mobileMotion ? 0.16 : 0.38,
          );
      }

      if (aboutDescription || aboutLine || aboutButton) {
        if (aboutDescription) {
          gsap.set(aboutDescription, {
            autoAlpha: 0,
            y: mobileMotion ? 18 : 30,
            filter: mobileMotion ? "none" : "blur(7px)",
          });
        }
        if (aboutLine) {
          gsap.set(aboutLine, {
            scaleY: 0,
            autoAlpha: 0.38,
            transformOrigin: "50% 0%",
          });
        }
        if (aboutButton) {
          gsap.set(aboutButton, {
            autoAlpha: 0,
            y: mobileMotion ? 28 : 92,
            scale: mobileMotion ? 0.94 : 0.68,
            rotateX: mobileMotion ? 0 : 24,
            skewY: mobileMotion ? 0 : 4.2,
            transformOrigin: "50% 100%",
            filter: mobileMotion ? "none" : "blur(14px)",
            force3D: true,
          });
        }

        const aboutContentTimeline = gsap.timeline({
          scrollTrigger: mobileMotion
            ? {
              trigger: textAndMetrics ?? section,
              start: "top 76%",
              toggleActions: "play none none reverse",
            }
            : {
              trigger: textAndMetrics ?? section,
              start: "top 92%",
              end: "top 28%",
              scrub: 0.95,
              invalidateOnRefresh: true,
            },
        });

        if (aboutDescription) {
          aboutContentTimeline.to(
            aboutDescription,
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.6 : 1,
              ease: mobileMotion ? "power3.out" : "none",
            },
            0,
          );
        }

        if (aboutLine) {
          aboutContentTimeline.to(
            aboutLine,
            {
              scaleY: 1,
              autoAlpha: 1,
              duration: mobileMotion ? 0.62 : 1.26,
              ease: mobileMotion ? "power2.out" : "none",
            },
            0.02,
          );
        }

        if (aboutButton) {
          if (mobileMotion) {
            aboutContentTimeline.to(
              aboutButton,
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
                skewY: 0,
                filter: "blur(0px)",
                duration: 0.62,
                ease: "back.out(1.4)",
                clearProps: "force3D",
              },
              0.12,
            );
          } else {
            const buttonTimeline = gsap
              .timeline({ paused: true })
              .to(aboutButton, {
                autoAlpha: 1,
                y: 0,
                scale: 1.1,
                rotateX: 0,
                skewY: 0,
                filter: "blur(0px)",
                duration: 1,
                ease: "power4.out",
              })
              .to(
                aboutButton,
                {
                  scale: 1,
                  duration: 0.44,
                  ease: "expo.out",
                  clearProps: "force3D",
                },
                ">-0.03",
              );

            let hasPlayed = false;
            aboutContentTimeline.eventCallback("onUpdate", () => {
              const progress = aboutContentTimeline.progress();

              if (progress >= 0.84 && !hasPlayed) {
                hasPlayed = true;
                buttonTimeline.restart();
              } else if (progress <= 0.72 && hasPlayed) {
                hasPlayed = false;
                buttonTimeline.reverse();
              }
            });
          }
        }
      }

      if (metricsCards && metricCards.length > 0) {
        gsap.set(metricCards, {
          autoAlpha: mobileMotion ? 0 : 0.14,
          y: mobileMotion ? 28 : 68,
          rotateX: mobileMotion ? 0 : 16,
          rotateZ: mobileMotion ? 0 : -1.1,
          scale: mobileMotion ? 0.98 : 0.94,
          transformPerspective: 1500,
          transformOrigin: "50% 100%",
          filter: mobileMotion ? "none" : "blur(10px)",
          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        });
        gsap.set(metricTopRows, {
          autoAlpha: 0,
          y: mobileMotion ? 14 : 26,
          clipPath: "inset(0% 0% 100% 0%)",
          filter: mobileMotion ? "none" : "blur(3px)",
        });
        gsap.set(metricTitles, {
          autoAlpha: mobileMotion ? 0 : 0.3,
          y: mobileMotion ? 10 : 16,
          filter: mobileMotion ? "none" : "blur(5px)",
        });
        gsap.set(metricDescriptions, {
          autoAlpha: 0,
          y: mobileMotion ? 14 : 24,
          filter: mobileMotion ? "none" : "blur(6px)",
        });
        gsap.set(countTracks, { yPercent: 0 });
        gsap.set(countSuffixes, {
          autoAlpha: mobileMotion ? 0 : 0.28,
          y: mobileMotion ? 4 : 9,
          scale: mobileMotion ? 0.96 : 0.82,
        });

        const metricsTimeline = gsap.timeline({
          scrollTrigger: mobileMotion
            ? {
              trigger: metricsCards,
              start: "top 78%",
              toggleActions: "play none none reverse",
            }
            : {
              trigger: metricsCards,
              start: "top 86%",
              end: "top 18%",
              scrub: 0.92,
              invalidateOnRefresh: true,
            },
        });

        metricsTimeline
          .to(
            metricCards,
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              rotateZ: 0,
              scale: 1,
              filter: "blur(0px)",
              boxShadow: "0 2.2rem 5rem rgba(0, 0, 0, 0.34)",
              duration: mobileMotion ? 0.72 : 1,
              stagger: 0.1,
              ease: mobileMotion ? "power3.out" : "expo.out",
            },
            0,
          )
          .to(
            metricTopRows,
            {
              autoAlpha: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              filter: "blur(0px)",
              duration: mobileMotion ? 0.54 : 0.8,
              stagger: 0.1,
              ease: "power3.out",
            },
            mobileMotion ? 0.14 : 0.28,
          )
          .to(
            metricTitles,
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.48 : 0.74,
              stagger: 0.1,
              ease: "power2.out",
            },
            mobileMotion ? 0.2 : 0.36,
          )
          .to(
            metricDescriptions,
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.5 : 0.72,
              stagger: 0.1,
              ease: "power2.out",
            },
            mobileMotion ? 0.26 : 0.54,
          )
          .to(
            countTracks,
            {
              yPercent: (_index, element) => {
                const steps = Number((element as HTMLElement).dataset.steps ?? "1");
                return -100 * Math.max(steps - 1, 0);
              },
              duration: mobileMotion ? 0.82 : 1.18,
              stagger: 0.08,
              ease: mobileMotion ? "power2.out" : "expo.inOut",
            },
            mobileMotion ? 0.34 : 1.04,
          )
          .to(
            countSuffixes,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: mobileMotion ? 0.4 : 0.68,
              stagger: 0.08,
              ease: "back.out(2.6)",
            },
            mobileMotion ? 0.42 : 1.2,
          );
      }
    }, section);

    return () => {
      context.revert();
    };
  }, []);

  const titleText =
    "We build brands that are clear in strategy, distinct in expression, and consistent in experience.";

  useEffect(() => {
    const calculateLines = () => {
      if (titleWordsRef.current.length === 0) return;
      const calculatedLines: string[] = [];
      let currentLine: string[] = [];
      let currentY = -1;

      titleWordsRef.current.forEach((wordSpan) => {
        if (!wordSpan) return;
        const top = wordSpan.offsetTop;
        if (currentY !== -1 && Math.abs(top - currentY) > 5) {
          calculatedLines.push(currentLine.join(" "));
          currentLine = [];
        }
        currentY = top;
        currentLine.push(wordSpan.innerText.trim());
      });
      if (currentLine.length > 0) {
        calculatedLines.push(currentLine.join(" "));
      }

      setTitleLines((prev: string[]) => {
        if (prev.join("|") === calculatedLines.join("|")) return prev;
        return calculatedLines;
      });
    };

    calculateLines();
    window.addEventListener("resize", calculateLines);
    return () => window.removeEventListener("resize", calculateLines);
  }, []);

  useEffect(() => {
    if (titleLines.length === 0 || titleLineRefs.current.length === 0) return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(titleLineRefs.current, { "--line-fill": "100%" });
      return;
    }

    const mobileMotion = shouldUseMobileMotion();

    const context = gsap.context(() => {
      const activeLines = titleLineRefs.current.filter((el): el is HTMLSpanElement => el !== null);
      gsap.set(activeLines, {
        "--line-fill": "0%",
        autoAlpha: mobileMotion ? 0 : 1,
        yPercent: mobileMotion ? 26 : 0,
      });

      if (mobileMotion) {
        const titleTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current ?? activeLines[0],
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
        });

        titleTimeline.to(
          activeLines,
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 0.62,
            stagger: 0.12,
            ease: "power3.out",
          },
          0,
        );

        titleTimeline.to(
          activeLines,
          {
            "--line-fill": "100%",
            duration: 0.72,
            stagger: 0.14,
            ease: "power2.out",
          },
          0.08,
        );

        return;
      }

      const titleFillTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: activeLines[0],
          start: "top 86%",
          end: "top 35%",
          scrub: 0.75,
        },
      });

      activeLines.forEach((line, i) => {
        titleFillTimeline.to(
          line,
          {
            "--line-fill": "100%",
            ease: "none",
            duration: 1,
          },
          i,
        );
      });
    }, sectionRef.current ?? undefined);

    return () => context.revert();
  }, [titleLines]);

  return (
    <section className={styles.aboutSectionContainerMain} ref={sectionRef} data-node-id="496:920">
      <div className={styles.aboutSectionContainer}>
        <div className={styles.titleContainer}>
          <div className={styles.aboutTag}>
            <img className={styles.aboutStar} src="/images/asterisk.png" alt="" aria-hidden="true" ref={aboutStarRef} />
            <p className={styles.aboutTagText} ref={aboutTagTextRef}>
              About <span className="tag-separator">/</span> Marca Ubi
            </p>
          </div>
          <h2 className={styles.mainTitle} style={{ position: "relative" }}>
            <div
              className={styles.mainTitleLine}
              style={{
                position: titleLines.length > 0 ? "absolute" : "relative",
                visibility: titleLines.length > 0 ? "hidden" : "visible",
                pointerEvents: "none",
                width: "100%",
              }}
              aria-hidden="true"
            >
              {titleText.split(" ").map((word, index) => (
                <span
                  key={index}
                  ref={(el) => {
                    titleWordsRef.current[index] = el;
                  }}
                  style={{ display: "inline-block" }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </div>

            {titleLines.length > 0 && (
              <div className={styles.animatedTitleWrapper}>
                {titleLines.map((line: string, index: number) => (
                  <span
                    key={index}
                    className={styles.mainTitleLine}
                    ref={(el) => {
                      titleLineRefs.current[index] = el;
                    }}
                    style={{ display: "block", width: "fit-content" }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            )}
          </h2>
        </div>

        <div className={styles.servicesContainer} ref={servicesContainerRef}>
          {services.map((service, index) => (
            <article
              className={styles.serviceItem}
              key={service.number}
              data-node-id={`service-${index}`}
              ref={(element) => {
                serviceItemRefs.current[index] = element;
              }}
            >
              <div className={styles.serviceTopRow}>
                <img
                  className={styles.serviceHashIcon}
                  src="/images/hashtag.png"
                  alt=""
                  aria-hidden="true"
                  ref={(element) => {
                    serviceIconRefs.current[index] = element;
                  }}
                />
                <span
                  className={styles.serviceNumber}
                  ref={(element) => {
                    serviceNumberRefs.current[index] = element;
                  }}
                >
                  {service.number}
                </span>
              </div>
              <h3
                className={styles.serviceTitle}
                ref={(element) => {
                  serviceTitleRefs.current[index] = element;
                }}
              >
                {service.title}
              </h3>
            </article>
          ))}
        </div>

        <div className={styles.textAndMetricsSection} ref={textAndMetricsRef}>
          <div className={styles.leftSection}>
            <p className={styles.aboutDescription} ref={aboutDescriptionRef}>
              Marca Ubi brings together brand engineering, artistic direction, and experience design
              to build brands as complete systems rather than disconnected outputs. We define the
              strategic core, shape the visual and emotional language, and translate it into digital
              environments people can understand, engage with, and remember.
              <br />
              <br />
              Every layer is designed to work with the next, so the brand is not only well designed,
              but well built.
            </p>
            <span className={styles.verticalLine} aria-hidden="true" ref={aboutLineRef} />
            <div ref={aboutButtonRef} className={styles.aboutButtonWrap}>
              <PillButton
                className={styles.aboutButton}
                href="#contact"
                label="Start a Project"
                variant="brand"
                icon={<img className={styles.buttonIcon} src="/hero/primary-arrow.png" alt="" />}
              />
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.metricsCards} ref={metricsCardsRef}>
              {metrics.map((metric, index) => {
                const countStops = getMetricCountStops(metric.value);

                return (
                  <article
                    className={styles.metricItemCard}
                    key={`${metric.title}-${index}`}
                    ref={(element) => {
                      cardRefs.current[index] = element;
                    }}
                  >
                    <div
                      className={styles.metricTopRow}
                      ref={(element) => {
                        metricTopRowRefs.current[index] = element;
                      }}
                    >
                      <p className={styles.metricCountWrap}>
                        <span className={styles.metricCountViewport} aria-hidden="true">
                          <span
                            className={styles.metricCountTrack}
                            data-steps={countStops.length}
                            ref={(element) => {
                              countTrackRefs.current[index] = element;
                            }}
                          >
                            {countStops.map((stop) => (
                              <span className={styles.metricCountStep} key={`${metric.title}-${index}-${stop}`}>
                                {stop}
                              </span>
                            ))}
                          </span>
                        </span>
                        {metric.suffix ? (
                          <span
                            className={styles.metricCountPlus}
                            ref={(element) => {
                              countSuffixRefs.current[index] = element;
                            }}
                          >
                            {metric.suffix}
                          </span>
                        ) : null}
                      </p>
                      <h4
                        className={styles.metricTitle}
                        ref={(element) => {
                          metricTitleRefs.current[index] = element;
                        }}
                      >
                        {metric.title}
                      </h4>
                    </div>

                    <p
                      className={styles.metricDescription}
                      ref={(element) => {
                        metricDescriptionRefs.current[index] = element;
                      }}
                    >
                      {metric.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
