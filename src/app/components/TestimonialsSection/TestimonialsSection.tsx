"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "../ui/PillButton/PillButton";
import SectionTitleBlock from "../ui/SectionTitleBlock/SectionTitleBlock";
import styles from "./TestimonialsSection.module.scss";

const testimonialsImages = {
  left: "/testimonials/left-item.png",
  center: "/testimonials/center-item.png",
  right: "/testimonials/right-item.png",
};
const titleLines = ["What Clients Say After", "Working With Us"];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const tagIconRef = useRef<HTMLImageElement | null>(null);
  const tagTextRef = useRef<HTMLSpanElement | null>(null);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const descriptionRef = useRef<HTMLSpanElement | null>(null);
  const actionWrapRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const tagIcon = tagIconRef.current;
    const tagText = tagTextRef.current;
    const titleLinesNodes = titleLineRefs.current.filter((line): line is HTMLSpanElement => line !== null);
    const description = descriptionRef.current;
    const actionWrap = actionWrapRef.current;

    if (!section || !tagIcon || !tagText || titleLinesNodes.length === 0 || !description || !actionWrap) {
      return;
    }

    const setFinalValues = () => {
      gsap.set(tagIcon, { autoAlpha: 1, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" });
      gsap.set(tagText, { autoAlpha: 1, y: 0, x: 0, filter: "blur(0px)" });
      gsap.set(titleLinesNodes, { autoAlpha: 1, yPercent: 0, rotateX: 0, filter: "blur(0px)" });
      gsap.set(description, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)" });
      gsap.set(actionWrap, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" });
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
      gsap.set(titleLinesNodes, {
        autoAlpha: 0,
        yPercent: 116,
        rotateX: -42,
        transformPerspective: 1100,
        transformOrigin: "50% 100%",
        filter: "blur(9px)",
      });
      gsap.set(description, {
        autoAlpha: 0,
        y: 26,
        clipPath: "inset(0% 0% 100% 0%)",
        filter: "blur(6px)",
      });
      gsap.set(actionWrap, {
        autoAlpha: 0,
        y: 32,
        scale: 0.92,
        rotateX: 16,
        transformOrigin: "50% 100%",
        filter: "blur(7px)",
      });

      const introTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          end: "top 36%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
      });

      introTimeline
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
            y: 0,
            x: 0,
            filter: "blur(0px)",
            duration: 0.72,
            ease: "power3.out",
          },
          0.14,
        )
        .to(
          titleLinesNodes,
          {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 1.02,
            stagger: 0.14,
            ease: "expo.out",
          },
          0.2,
        )
        .to(
          description,
          {
            autoAlpha: 1,
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            filter: "blur(0px)",
            duration: 0.82,
            ease: "power3.out",
          },
          0.44,
        )
        .to(
          actionWrap,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.86,
            ease: "back.out(1.24)",
          },
          0.58,
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

  return (
    <section className={styles.testimonialSectionContainerMain} data-node-id="503:927" ref={sectionRef}>
      <div className={styles.testimonialSectionContainer}>
        <SectionTitleBlock
          actionWrapClassName={styles.headerAction}
          className={styles.headerBlock}
          action={
            <div className={styles.headerActionInner} ref={actionWrapRef}>
              <PillButton
                className={styles.contactButton}
                icon={<img className={styles.buttonIcon} src="/hero/primary-arrow.png" alt="" />}
                label="Contact us"
                variant="brand"
              />
            </div>
          }
          description={
            <span className={styles.headerDescriptionInner} ref={descriptionRef}>
              Honest feedback from teams we’ve supported across branding, content, design, and product
              delivery.
            </span>
          }
          descriptionClassName={styles.headerDescription}
          label={
            <span className={styles.headerTagTextInner} ref={tagTextRef}>
              Testimonials
            </span>
          }
          leftColumnClassName={styles.headerLeft}
          rightColumnClassName={styles.headerRight}
          tagClassName={styles.headerTag}
          tagIcon={<img className={styles.headerTagIcon} ref={tagIconRef} src="/images/asterisk.png" alt="" aria-hidden="true" />}
          tagTextClassName={styles.headerTagText}
          title={
            <span className={styles.headerTitleInner}>
              {titleLines.map((line, index) => (
                <span className={styles.headerTitleLineMask} key={line}>
                  <span
                    className={styles.headerTitleLine}
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
          titleClassName={styles.headerTitle}
        />

        <div className={styles.itemsContainer}>
          <article className={`${styles.itemCard} ${styles.itemLeft}`}>
            <img alt="Product jacket visual" src={testimonialsImages.left} />
          </article>
          <article className={`${styles.itemCard} ${styles.itemCenter}`}>
            <img alt="Client wearing headphones" src={testimonialsImages.center} />
          </article>
          <article className={`${styles.itemCard} ${styles.itemRight}`}>
            <img alt="Product bottle visual" src={testimonialsImages.right} />
          </article>
        </div>
      </div>
    </section>
  );
}
