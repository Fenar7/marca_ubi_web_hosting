"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldUseMobileMotion } from "@/app/lib/motion";
import SectionTitleBlock from "../ui/SectionTitleBlock/SectionTitleBlock";
import styles from "./HowWeWork.module.scss";

const cards = [
  {
    id: "direction-locked",
    title: "Strategy Before Expression",
    description:
      "Every project begins by defining the brand core, audience, positioning, and direction, so every creative and digital decision has a clear foundation.",
    icon: "/images/icons/direction-locked.png",
    className: styles.cardDirection,
    type: "image",
    image: "/images/how-we-work1.png",
  },
  {
    id: "systems-not-one-offs",
    title: "Systems Over Isolated Outputs",
    description:
      "Identity, messaging, content, and digital touchpoints are built as connected systems, not standalone pieces, so the brand stays coherent as it grows.",
    icon: "/images/icons/systems-icon.png",
    className: styles.cardSystems,
    type: "solid",
  },
  {
    id: "craft-with-quality-gates",
    title: "Craft With Deliberate Precision",
    description:
      "Every element is shaped with care, from hierarchy and storytelling to motion and interaction, so the work feels refined, meaningful, and considered.",
    icon: "/images/icons/craft-icon.png",
    className: styles.cardCraft,
    type: "gradient",
  },
  {
    id: "ship-iterate-scale",
    title: "Build, Refine, Evolve",
    description:
      "We create for real-world use, then strengthen the work through feedback, iteration, and performance insight so the brand continues to improve over time.",
    icon: "/images/icons/ship-iterate-icon.png",
    className: styles.cardShip,
    type: "image",
    image: "/images/how-we-work2.png",
  },
] as const;
const titleLines = ["How We Build Brands With", "Clarity, Structure, and Intent"];

export default function HowWeWork() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const tagIconRef = useRef<HTMLImageElement | null>(null);
  const tagTextRef = useRef<HTMLSpanElement | null>(null);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const descriptionRef = useRef<HTMLSpanElement | null>(null);
  const cardsGridRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const cardImageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const cardShadeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardContentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardIconRefs = useRef<Array<HTMLImageElement | null>>([]);
  const cardTitleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const cardLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const cardBodyRefs = useRef<Array<HTMLParagraphElement | null>>([]);

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
      gsap.set(titleLineNodes, { autoAlpha: 1, yPercent: 0, xPercent: 0, rotateX: 0, filter: "blur(0px)" });
      gsap.set(description, { autoAlpha: 1, y: 0, x: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)" });
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
        yPercent: 115,
        xPercent: -7,
        rotateX: -36,
        transformPerspective: 1100,
        transformOrigin: "50% 100%",
        filter: "blur(9px)",
      });
      gsap.set(description, {
        autoAlpha: 0,
        y: 24,
        x: 22,
        clipPath: "inset(0% 0% 100% 0%)",
        filter: "blur(6px)",
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
              end: "top 28%",
              scrub: 0.95,
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
            rotateX: 0,
            filter: "blur(0px)",
            duration: mobileMotion ? 0.86 : 1.06,
            stagger: 0.15,
            ease: mobileMotion ? "expo.out" : "none",
          },
          0,
        )
        .to(
          description,
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            filter: "blur(0px)",
            duration: mobileMotion ? 0.72 : 0.92,
            ease: mobileMotion ? "power3.out" : "none",
          },
          mobileMotion ? 0.12 : 0.24,
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
    const cardsGrid = cardsGridRef.current;
    const cardsNodes = cardRefs.current.filter((card): card is HTMLElement => card !== null);

    if (!section || !cardsGrid || cardsNodes.length === 0) {
      return;
    }

    const mobileMotion = shouldUseMobileMotion();

    const getMotionProfile = () => {
      const viewportWidth = window.innerWidth;

      if (viewportWidth <= 899) {
        return {
          cardX: 0,
          cardY: 58,
          cardRotateY: 0,
          cardRotateX: 0,
          cardRotateZ: 0,
          cardScale: 0.9,
          cardBlur: 8,
          imageY: 30,
          imageScale: 1.12,
          contentY: 26,
          iconY: 20,
          titleY: 20,
          bodyY: 24,
          scrub: 0.95,
          start: "top 90%",
          end: "top 38%",
        };
      }

      if (viewportWidth <= 1250) {
        return {
          cardX: 54,
          cardY: 66,
          cardRotateY: 11,
          cardRotateX: 11,
          cardRotateZ: 1.8,
          cardScale: 0.88,
          cardBlur: 9,
          imageY: 34,
          imageScale: 1.16,
          contentY: 30,
          iconY: 22,
          titleY: 24,
          bodyY: 28,
          scrub: 1.02,
          start: "top 88%",
          end: "top 34%",
        };
      }

      return {
        cardX: 70,
        cardY: 74,
        cardRotateY: 13,
        cardRotateX: 13,
        cardRotateZ: 2.8,
        cardScale: 0.86,
        cardBlur: 10.5,
        imageY: 38,
        imageScale: 1.18,
        contentY: 32,
        iconY: 24,
        titleY: 26,
        bodyY: 30,
        scrub: 1.08,
        start: "top 86%",
        end: "top 30%",
      };
    };

    const setFinalValues = () => {
      cardsNodes.forEach((card, index) => {
        const image = cardImageRefs.current[index];
        const shade = cardShadeRefs.current[index];
        const content = cardContentRefs.current[index];
        const icon = cardIconRefs.current[index];
        const title = cardTitleRefs.current[index];
        const line = cardLineRefs.current[index];
        const body = cardBodyRefs.current[index];

        gsap.set(card, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          clipPath: "inset(0% 0% 0% 0% round 0rem)",
          filter: "blur(0px) saturate(1) brightness(1)",
        });

        if (image) {
          gsap.set(image, { y: 0, scale: 1 });
        }
        if (shade) {
          gsap.set(shade, { opacity: 1 });
        }
        if (content) {
          gsap.set(content, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
        }
        if (icon) {
          gsap.set(icon, { autoAlpha: 1, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" });
        }
        if (title) {
          gsap.set(title, {
            autoAlpha: 1,
            y: 0,
            x: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            filter: "blur(0px)",
          });
        }
        if (line) {
          gsap.set(line, { autoAlpha: 1, scaleX: 1 });
        }
        if (body) {
          gsap.set(body, {
            autoAlpha: 1,
            y: 0,
            x: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            filter: "blur(0px)",
          });
        }
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFinalValues();
      return;
    }

    const context = gsap.context(() => {
      cardsNodes.forEach((card, index) => {
        const profile = getMotionProfile();
        const image = cardImageRefs.current[index];
        const shade = cardShadeRefs.current[index];
        const content = cardContentRefs.current[index];
        const icon = cardIconRefs.current[index];
        const title = cardTitleRefs.current[index];
        const line = cardLineRefs.current[index];
        const body = cardBodyRefs.current[index];
        const direction = index % 2 === 0 ? -1 : 1;
        const isSecondRow = index > 1;
        const rowDepthMultiplier = isSecondRow ? 1.16 : 1;
        const initialX = mobileMotion
          ? 0
          : profile.cardX === 0
            ? 0
            : direction * profile.cardX * (isSecondRow ? 0.88 : 1);
        const initialY = mobileMotion ? 30 + index * 8 : profile.cardY * rowDepthMultiplier + (isSecondRow ? 16 : 0);

        gsap.set(card, {
          autoAlpha: mobileMotion ? 0 : 0.08,
          x: initialX,
          y: initialY,
          rotateX: mobileMotion ? 0 : profile.cardRotateX,
          rotateY: mobileMotion ? 0 : direction * profile.cardRotateY,
          rotateZ: mobileMotion ? 0 : direction * profile.cardRotateZ,
          scale: mobileMotion ? 0.98 : profile.cardScale,
          transformPerspective: 1600,
          transformOrigin: isSecondRow ? "50% 16%" : "50% 84%",
          clipPath: mobileMotion ? "inset(0% 0% 0% 0% round 0rem)" : "inset(7% 7% 7% 7% round 0.8rem)",
          filter: mobileMotion ? "none" : `blur(${profile.cardBlur}px) saturate(0.6) brightness(0.72)`,
        });

        if (image) {
          gsap.set(image, { y: mobileMotion ? 18 : profile.imageY, scale: mobileMotion ? 1.05 : profile.imageScale });
        }
        if (shade) {
          gsap.set(shade, { opacity: mobileMotion ? 0.92 : 0.76 });
        }
        if (content) {
          gsap.set(content, { autoAlpha: 0, y: mobileMotion ? 16 : profile.contentY, filter: mobileMotion ? "none" : "blur(7px)" });
        }
        if (icon) {
          gsap.set(icon, {
            autoAlpha: 0,
            y: mobileMotion ? 12 : profile.iconY,
            rotate: mobileMotion ? -18 : direction * -26,
            scale: mobileMotion ? 0.88 : 0.72,
            transformOrigin: "50% 50%",
            filter: mobileMotion ? "none" : "blur(4px)",
          });
        }
        if (title) {
          gsap.set(title, {
            autoAlpha: mobileMotion ? 0 : 0.18,
            y: mobileMotion ? 14 : profile.titleY,
            x: mobileMotion ? 0 : direction * -12,
            clipPath: "inset(0% 0% 100% 0%)",
            filter: mobileMotion ? "none" : "blur(6px)",
          });
        }
        if (line) {
          gsap.set(line, { autoAlpha: 0.16, scaleX: 0, transformOrigin: "left center" });
        }
        if (body) {
          gsap.set(body, {
            autoAlpha: mobileMotion ? 0 : 0.12,
            y: mobileMotion ? 16 : profile.bodyY,
            x: mobileMotion ? 0 : direction * 14,
            clipPath: "inset(0% 0% 100% 0%)",
            filter: mobileMotion ? "none" : "blur(6px)",
          });
        }

        const cardTimeline = gsap.timeline({
          scrollTrigger: mobileMotion
            ? {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              }
            : {
                trigger: card,
                start: profile.start,
                end: profile.end,
                scrub: profile.scrub,
                invalidateOnRefresh: true,
              },
        });

        cardTimeline.to(
          card,
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
            clipPath: "inset(0% 0% 0% 0% round 0rem)",
            filter: "blur(0px) saturate(1) brightness(1)",
            duration: mobileMotion ? 0.74 : 1.08,
            ease: mobileMotion ? "power3.out" : "none",
          },
          0,
        );

        if (image) {
          cardTimeline.to(
            image,
            {
              y: 0,
              scale: 1,
              duration: mobileMotion ? 0.72 : 1.14,
              ease: mobileMotion ? "power2.out" : "none",
            },
            0.04,
          );
        }

        if (shade) {
          cardTimeline.to(
            shade,
            {
              opacity: 1,
              duration: mobileMotion ? 0.56 : 1.02,
              ease: mobileMotion ? "power2.out" : "none",
            },
            0.08,
          );
        }

        if (content) {
          cardTimeline.to(
            content,
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.56 : 0.82,
              ease: mobileMotion ? "power2.out" : "none",
            },
            mobileMotion ? 0.14 : 0.26,
          );
        }

        if (icon) {
          cardTimeline.to(
            icon,
            {
              autoAlpha: 1,
              y: 0,
              rotate: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: mobileMotion ? 0.52 : 0.72,
              ease: mobileMotion ? "back.out(1.6)" : "none",
            },
            mobileMotion ? 0.2 : 0.34,
          );
        }

        if (title) {
          cardTimeline.to(
            title,
            {
              autoAlpha: 1,
              y: 0,
              x: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              filter: "blur(0px)",
              duration: mobileMotion ? 0.56 : 0.86,
              ease: mobileMotion ? "power3.out" : "none",
            },
            mobileMotion ? 0.24 : 0.42,
          );
        }

        if (line) {
          cardTimeline.to(
            line,
            {
              autoAlpha: 1,
              scaleX: 1,
              duration: mobileMotion ? 0.46 : 0.7,
              ease: mobileMotion ? "power2.out" : "none",
            },
            mobileMotion ? 0.28 : 0.52,
          );
        }

        if (body) {
          cardTimeline.to(
            body,
            {
              autoAlpha: 1,
              y: 0,
              x: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              filter: "blur(0px)",
              duration: mobileMotion ? 0.58 : 0.9,
              ease: mobileMotion ? "power2.out" : "none",
            },
            mobileMotion ? 0.32 : 0.58,
          );
        }
      });
    }, section);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <section className={styles.howWeWorkContainerSection} data-node-id="545:1145" ref={sectionRef}>
      <div className={styles.howWeWorkContainer}>
        <SectionTitleBlock
          className={styles.titleSection}
          descriptionClassName={styles.titleDescription}
          description={
            <span className={styles.titleDescriptionInner} ref={descriptionRef}>
              Our process brings together brand engineering, art, and experience design to create
              work that is strategically grounded, creatively distinct, and built to perform in the
              real world.
            </span>
          }
          leftColumnClassName={styles.titleLeftColumn}
          tagClassName={styles.titleTag}
          tagIcon={<img className={styles.titleTagIcon} ref={tagIconRef} src="/images/asterisk.png" alt="" aria-hidden="true" />}
          tagTextClassName={styles.titleTagText}
          rightColumnClassName={styles.titleRightColumn}
          label={
            <span className={styles.titleTagTextInner} ref={tagTextRef}>
              How We Work
            </span>
          }
          titleClassName={styles.sectionTitle}
          title={
            <span className={styles.sectionTitleInner}>
              {titleLines.map((line, index) => (
                <span className={styles.sectionTitleLineMask} key={line}>
                  <span
                    className={styles.sectionTitleLine}
                    ref={(element) => {
                      titleLineRefs.current[index] = element;
                    }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </span>
          }
        />

        <div className={styles.contentGridContainer} ref={cardsGridRef}>
          {cards.map((card, index) => (
            <article
              className={`${styles.card} ${card.className}`}
              key={card.id}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
            >
              {card.type === "image" ? (
                <>
                  <img
                    className={styles.cardImage}
                    src={card.image}
                    alt=""
                    aria-hidden="true"
                    ref={(element) => {
                      cardImageRefs.current[index] = element;
                    }}
                  />
                  <div
                    className={styles.imageShade}
                    aria-hidden="true"
                    ref={(element) => {
                      cardShadeRefs.current[index] = element;
                    }}
                  />
                </>
              ) : null}

              <div
                className={styles.contentContainer}
                ref={(element) => {
                  cardContentRefs.current[index] = element;
                }}
              >
                <img
                  className={styles.icon}
                  src={card.icon}
                  alt=""
                  aria-hidden="true"
                  ref={(element) => {
                    cardIconRefs.current[index] = element;
                  }}
                />
                <h4
                  className={styles.cardHeading}
                  ref={(element) => {
                    cardTitleRefs.current[index] = element;
                  }}
                >
                  {card.title}
                </h4>
                <span
                  className={styles.titleLine}
                  aria-hidden="true"
                  ref={(element) => {
                    cardLineRefs.current[index] = element;
                  }}
                />
                <p
                  className={styles.cardBody}
                  ref={(element) => {
                    cardBodyRefs.current[index] = element;
                  }}
                >
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
