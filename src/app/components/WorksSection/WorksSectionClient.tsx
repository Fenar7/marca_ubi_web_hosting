"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { shouldUseMobileMotion } from "@/app/lib/motion";
import { urlFor } from "@/sanity/lib/image";

gsap.registerPlugin(ScrollTrigger);

export interface SanityWork {
    _id: string;
    title: string;
    subtext: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coverImage: any;
    caseStudyLink?: string;
    testimonialLink?: string;
    viewWorkLink?: string;
}

interface WorksSectionClientProps {
    works: SanityWork[];
}

const WorksSectionClient = ({ works }: WorksSectionClientProps) => {
    const containerRef = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const container = containerRef.current;

            if (!container) {
                return;
            }

            const mobileMotion = shouldUseMobileMotion();
            const mobileHeaderOffsetPx = 4.8 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
            const mobilePinDistance = Math.max(window.innerHeight * 0.92, 520);
            const titleFill = container.querySelector<HTMLElement>(".works-title-fill");
            const titleSection = container.querySelector<HTMLElement>(".title-section-container");
            const wrappers = gsap.utils.toArray<HTMLElement>(".work-item-wrapper", container);
            const setSafeState = (filled: boolean) => {
                if (titleFill) {
                    gsap.set(titleFill, { "--title-fill": filled ? "100%" : "0%" });
                }

                wrappers.forEach((wrapper) => {
                    const card = wrapper.querySelector<HTMLElement>(".work-item");
                    const image = card?.querySelector<HTMLElement>(".work-item-image img");

                    if (card) {
                        gsap.set(card, { clearProps: "transform" });
                    }

                    if (image) {
                        gsap.set(image, { scale: 1 });
                    }
                });
            };

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                setSafeState(true);
                return;
            }

            // ─── Title: pin + orange fill ─────────────────────────────────────────────
            if (titleFill && titleSection) {
                gsap
                    .timeline({
                        scrollTrigger: {
                            trigger: titleSection,
                            start: mobileMotion ? `top top+=${mobileHeaderOffsetPx}` : "center center",
                            end: mobileMotion ? `+=${mobilePinDistance}` : "+=60%",
                            pin: true,
                            scrub: mobileMotion ? 0.85 : true,
                            pinSpacing: true,
                            anticipatePin: 1,
                            invalidateOnRefresh: true,
                        },
                    })
                    .fromTo(
                        titleFill,
                        { "--title-fill": "0%" },
                        { "--title-fill": "100%", ease: "none" },
                    );
            } else {
                setSafeState(true);
            }

            // ─── Cards ────────────────────────────────────────────────────────────────
            wrappers.forEach((wrapper) => {
                const card = wrapper.querySelector<HTMLElement>(".work-item");
                const image = card?.querySelector<HTMLElement>(".work-item-image img");

                if (!card) return;

                // Keep mobile behavior visually aligned with desktop: scrub-based entrance.
                gsap.fromTo(
                    card,
                    {
                        rotateZ: mobileMotion ? 8 : 18,
                        rotateX: mobileMotion ? 3 : 6,
                        y: mobileMotion ? 34 : 0,
                        scale: mobileMotion ? 0.88 : 0.72,
                        transformOrigin: "center bottom",
                        transformPerspective: 1400,
                    },
                    {
                        y: 0,
                        rotateZ: 0,
                        rotateX: 0,
                        scale: 1,
                        ease: "power2.out",
                        force3D: true,
                        scrollTrigger: {
                            trigger: wrapper,
                            start: "top bottom",
                            end: mobileMotion ? "top 24%" : "top 20%",
                            scrub: mobileMotion ? 0.9 : true,
                            invalidateOnRefresh: true,
                        },
                    },
                );

                // ── Image de-zoom synced with entrance ────────────────────────────────
                if (image) {
                    gsap.fromTo(
                        image,
                        { scale: mobileMotion ? 1.16 : 1.28 },
                        {
                            scale: 1,
                            ease: "power2.out",
                            force3D: true,
                            scrollTrigger: {
                                trigger: wrapper,
                                start: "top bottom",
                                end: mobileMotion ? "top 24%" : "top 20%",
                                scrub: mobileMotion ? 0.9 : true,
                                invalidateOnRefresh: true,
                            },
                        },
                    );
                }
            });

            const handleLoaderComplete = () => {
                ScrollTrigger.refresh();
            };
            window.addEventListener("initial-loader:complete", handleLoaderComplete);

            const refreshFrameId = window.requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
            const refreshTimerId = window.setTimeout(() => {
                ScrollTrigger.refresh();
            }, 450);

            return () => {
                window.removeEventListener("initial-loader:complete", handleLoaderComplete);
                window.cancelAnimationFrame(refreshFrameId);
                window.clearTimeout(refreshTimerId);
            };
        },
        { scope: containerRef },
    );

    return (
        <section
            className="works-section-container-main"
            data-node-id="484:1124"
            id="works"
            ref={containerRef}
        >
            <div className="works-title-wrap">
                <div className="title-section-container">
                    <h2>
                        <span className="works-title-fill">CURATED WORKS</span>
                    </h2>
                </div>
            </div>

            <div className="works-item-container-wrap">
                {works.map((work) => {
                    const imageUrl = work.coverImage
                        ? urlFor(work.coverImage).width(1920).height(1080).url()
                        : "/images/work-image.png";

                    return (
                        <div className="work-item-wrapper" key={work._id}>
                            {/* Whole card is clickable if viewWorkLink is set */}
                            <article
                                className={`work-item${work.viewWorkLink ? " work-item--clickable" : ""}`}
                                data-node-id="553:1148"
                                onClick={() => {
                                    if (work.viewWorkLink) window.open(work.viewWorkLink, "_blank", "noopener,noreferrer");
                                }}
                                role={work.viewWorkLink ? "link" : undefined}
                                tabIndex={work.viewWorkLink ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (work.viewWorkLink && (e.key === "Enter" || e.key === " ")) {
                                        window.open(work.viewWorkLink, "_blank", "noopener,noreferrer");
                                    }
                                }}
                            >
                                {/* Cover image */}
                                <div className="work-item-image">
                                    <Image
                                        src={imageUrl}
                                        alt={work.title}
                                        fill
                                        sizes="100vw"
                                        style={{ objectFit: "cover", objectPosition: "center" }}
                                        priority={false}
                                    />
                                </div>

                                <div className="work-item-overlay" aria-hidden="true" />

                                {/* Optional links — only rendered if they have a value */}
                                {(work.caseStudyLink || work.testimonialLink || work.viewWorkLink) && (
                                    <div
                                        className="top-right-section work-card-links"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {work.caseStudyLink && (
                                            <Link
                                                href={work.caseStudyLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                CASE STUDY
                                            </Link>
                                        )}
                                        {work.testimonialLink && (
                                            <Link
                                                href={work.testimonialLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                TESTIMONIAL
                                            </Link>
                                        )}
                                        {work.viewWorkLink && (
                                            <Link
                                                href={work.viewWorkLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                VIEW WORK
                                            </Link>
                                        )}
                                    </div>
                                )}

                                <div className="work-card-bottom">
                                    <h4>{work.title}</h4>
                                    <p>{work.subtext}</p>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default WorksSectionClient;
