"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import PillButton from "../ui/PillButton/PillButton";

gsap.registerPlugin(ScrollTrigger);

const ContactCtaSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const blackCardRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const contactInfoRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const section = sectionRef.current;
      const blackCard = blackCardRef.current;
      const bgImage = bgImageRef.current;
      const title = titleRef.current;
      const subtitle = subtitleRef.current;
      const button = buttonRef.current;

      if (!section || !blackCard || !bgImage || !title || !subtitle || !button)
        return;

      const contactInfo = contactInfoRef.current;

      // ─── Image: zoomed in → fits perfectly (like Hero parallax) ───────────
      // Starts zoomed at 1.3x, when user reaches section it's at 1x — fully fit, clear.
      gsap.fromTo(
        bgImage,
        { scale: 1.3, yPercent: -5 },
        {
          scale: 1,
          yPercent: 5,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      // ─── Black bar: simple clean slide-in from above ──────────────────────
      gsap.fromTo(
        blackCard,
        { yPercent: -100 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "top 40%",
            scrub: 1,
          },
        },
      );

      // ─── Bottom content: coordinated entrance ─────────────────────────────
      const contentTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".contact-bottom-section",
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      // Title slides up
      contentTl.fromTo(
        title,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        0,
      );

      // Subtitle slides up (slightly delayed)
      contentTl.fromTo(
        subtitle,
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
        0.15,
      );

      // Button scales in
      contentTl.fromTo(
        button,
        { y: 24, opacity: 0, scale: 0.88 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: "back.out(1.6)",
        },
        0.28,
      );

      // Contact info row: staggered slide-up after button
      if (contactInfo) {
        contentTl.fromTo(
          contactInfo,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
          0.44,
        );
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      className="contact-section-container-main"
      data-node-id="555:1241"
      id="contact"
      ref={sectionRef}
    >
      <div className="contact-section-container container">
        <div
          className="top-black-container"
          aria-hidden="true"
          data-node-id="555:1252"
          ref={blackCardRef}
        />

        <img
          className="contact-bg-image"
          src="/images/contact-cta-image.png"
          alt=""
          aria-hidden="true"
          data-node-id="555:1243"
          ref={bgImageRef}
        />
        <div className="contact-image-overlay" aria-hidden="true" />

        <div className="contact-bottom-section" data-node-id="555:1244">
          <h2 ref={titleRef}>
            Let<span className="tag-separator">&apos;</span>s Build Something That Holds
          </h2>
          <p ref={subtitleRef}>
            If you&apos;re building a brand, refining an identity, or shaping a
            digital experience, we&apos;d like to hear what you&apos;re working on.
            Share the context, and we&apos;ll come back with clear next steps.
          </p>
          <div ref={buttonRef}>
            <PillButton label="Start a Project" variant="brand" href="#contact" />
          </div>

          {/* Contact info: phone + email on the first line, global collaboration on the second */}
          <div className="contact-info-row" ref={contactInfoRef}>
            <div className="contact-info-primary">
              <a className="contact-info-item" href="tel:+971501234567">
                <span className="contact-info-icon" aria-hidden="true">
                  {/* Phone */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </span>
                <span>+971 50 123 4567</span>
              </a>

              <span className="contact-info-divider" aria-hidden="true" />

              <a className="contact-info-item" href="mailto:hello@marcaubi.com">
                <span className="contact-info-icon" aria-hidden="true">
                  {/* Email */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </span>
                <span>hello@marcaubi.com</span>
              </a>
            </div>

            <a
              className="contact-info-item contact-info-location-line"
              href="https://maps.google.com/?q=Dubai,UAE"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-info-icon" aria-hidden="true">
                {/* Location */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="contact-info-location-list">
                Bangalore <span className="contact-info-location-separator">|</span> Kochi{" "}
                <span className="contact-info-location-separator">|</span> Trivandrum{" "}
                <span className="contact-info-location-separator">|</span> Dubai{" "}
                <span className="contact-info-location-separator">|</span> Saudi Arabia{" "}
                <span className="contact-info-location-separator">|</span> Qatar{" "}
                <span className="contact-info-location-separator">|</span> Bahrain{" "}
                <span className="contact-info-location-separator">|</span> UK
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactCtaSection;
