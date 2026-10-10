"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, shouldUseMobileMotion } from "@/app/lib/motion";
import PillButton from "../ui/PillButton/PillButton";
import SectionTitleBlock from "../ui/SectionTitleBlock/SectionTitleBlock";
import styles from "./TestimonialsSection.module.scss";

const testimonialsImages = {
  left: "/testimonials/left-item.png",
  center: "/testimonials/center-item.png",
  right: "/testimonials/right-item.png",
};
const titleLines = ["What Clients Value After", "Working With Marca Ubi"];

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

    const mobileMotion = shouldUseMobileMotion();

    const setFinalValues = () => {
      gsap.set(tagIcon, { autoAlpha: 1, y: 0, rotate: 0, scale: 1, filter: "none" });
      gsap.set(tagText, { autoAlpha: 1, y: 0, x: 0, filter: "none" });
      gsap.set(titleLinesNodes, { autoAlpha: 1, yPercent: 0, rotateX: 0, filter: "none" });
      gsap.set(description, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", filter: "none" });
      gsap.set(actionWrap, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, filter: "none" });
    };

    if (prefersReducedMotion()) {
      setFinalValues();
      return;
    }

    const context = gsap.context(() => {
      gsap.set(tagIcon, {
        autoAlpha: 0,
        y: mobileMotion ? 8 : 14,
        rotate: mobileMotion ? 0 : -170,
        scale: mobileMotion ? 0.8 : 0.28,
        transformOrigin: "50% 50%",
        filter: mobileMotion ? "none" : "blur(5px)",
      });
      gsap.set(tagText, { autoAlpha: 0, y: mobileMotion ? 8 : 16, x: mobileMotion ? 0 : 12, filter: mobileMotion ? "none" : "blur(5px)" });
      gsap.set(titleLinesNodes, {
        autoAlpha: 0,
        yPercent: mobileMotion ? 25 : 116,
        rotateX: mobileMotion ? 0 : -42,
        transformPerspective: 1100,
        transformOrigin: "50% 100%",
        filter: mobileMotion ? "none" : "blur(9px)",
      });
      gsap.set(description, {
        autoAlpha: 0,
        y: mobileMotion ? 12 : 26,
        clipPath: mobileMotion ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
        filter: mobileMotion ? "none" : "blur(6px)",
      });
      gsap.set(actionWrap, {
        autoAlpha: 0,
        y: mobileMotion ? 14 : 32,
        scale: mobileMotion ? 0.98 : 0.92,
        rotateX: mobileMotion ? 0 : 16,
        transformOrigin: "50% 100%",
        filter: mobileMotion ? "none" : "blur(7px)",
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
            filter: "none",
            duration: mobileMotion ? 0.45 : 0.78,
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
            filter: "none",
            duration: mobileMotion ? 0.45 : 0.72,
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
            filter: "none",
            duration: mobileMotion ? 0.52 : 1.02,
            stagger: mobileMotion ? 0.08 : 0.14,
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
            filter: "none",
            duration: mobileMotion ? 0.48 : 0.82,
            ease: "power3.out",
          },
          mobileMotion ? 0.28 : 0.44,
        )
        .to(
          actionWrap,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            filter: "none",
            duration: mobileMotion ? 0.45 : 0.86,
            ease: "back.out(1.24)",
          },
          mobileMotion ? 0.36 : 0.58,
        );

      if (!mobileMotion) {
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
      }
    }, section);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <section className={styles.testimonialSectionContainerMain} data-node-id="503:927" id="testimonials" ref={sectionRef}>
      <div className={styles.testimonialSectionContainer}>
        <SectionTitleBlock
          actionWrapClassName={styles.headerAction}
          className={styles.headerBlock}
          action={
            <div className={styles.headerActionInner} ref={actionWrapRef}>
              <PillButton
                className={styles.contactButton}
                icon={<img className={styles.buttonIcon} src="/hero/primary-arrow.png" alt="" />}
                href="/start-project"
                label="Start a Conversation"
                variant="brand"
              />
            </div>
          }
          description={
            <span className={styles.headerDescriptionInner} ref={descriptionRef}>
              Real feedback from teams and businesses we&apos;ve partnered with across brand
              engineering, art, digital experiences, and communication systems.
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

        {/* Future 3-image layout:
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
        */}

        <div className={styles.singleImageContainer}>
          <img alt="Testimonial visual" src="/images/test-image-1.png" className={styles.singleImage} />
        </div>
      </div>
    </section>
  );
}
