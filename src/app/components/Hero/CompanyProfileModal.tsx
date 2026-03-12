"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import styles from "./CompanyProfileModal.module.scss";

const COMPANY_PROFILE_URL = "/pdf/Marca_Ubi_Company_Profile.pdf";
const COMPANY_PROFILE_FILENAME = "Marca_Ubi_Company_Profile.pdf";

type CompanyProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FormState = {
  name: string;
  businessType: string;
  phone: string;
  email: string;
  instagramId: string;
  website: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM_STATE: FormState = {
  name: "",
  businessType: "",
  phone: "",
  email: "",
  instagramId: "",
  website: "",
  message: "",
};

const FIELD_ORDER: Array<keyof FormState> = [
  "name",
  "businessType",
  "phone",
  "email",
  "instagramId",
  "website",
  "message",
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
}

function isValidWebsite(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

function validateForm(formData: FormState) {
  const errors: FormErrors = {};

  if (!formData.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!formData.businessType.trim()) {
    errors.businessType = "Please enter your business type.";
  }

  if (!formData.phone.trim()) {
    errors.phone = "Please enter your phone number.";
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!formData.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (formData.website.trim() && !isValidWebsite(formData.website)) {
    errors.website = "Please enter a valid website URL.";
  }

  return errors;
}

function triggerProfileDownload() {
  const anchor = document.createElement("a");
  anchor.href = COMPANY_PROFILE_URL;
  anchor.download = COMPANY_PROFILE_FILENAME;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function CompanyProfileModal({ isOpen, onClose }: CompanyProfileModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasOpenRef = useRef(false);
  const submitTimerRef = useRef<number | null>(null);
  const focusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isMounted) {
      return;
    }

    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const header = headerRef.current;
    const body = bodyRef.current;

    if (!overlay || !panel || !header || !body) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(overlay, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(panel, {
        autoAlpha: 0,
        y: 30,
        scale: 0.965,
        transformOrigin: "50% 50%",
      });
      gsap.set([header, body], { autoAlpha: 0, y: 20 });

      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onStart: () => {
          overlay.style.pointerEvents = "auto";
        },
        onReverseComplete: () => {
          gsap.set(overlay, { pointerEvents: "none" });
        },
      });

      timeline
        .to(
          overlay,
          {
            autoAlpha: 1,
            duration: 0.22,
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
            duration: 0.44,
          },
          0.02,
        )
        .to(
          [header, body],
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.34,
            stagger: 0.05,
          },
          0.12,
        );

      timelineRef.current = timeline;
    }, panel);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      context.revert();
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const timeline = timelineRef.current;

    if (timeline) {
      if (isOpen) {
        timeline.play();
      } else {
        timeline.reverse();
      }
    }

    if (isOpen) {
      document.body.classList.add("profile-modal-open");
      document.documentElement.classList.add("profile-modal-open");

      if (!wasOpenRef.current) {
        window.dispatchEvent(new Event("profile-modal:open"));
      }

      wasOpenRef.current = true;

      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
      }

      focusTimerRef.current = window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 220);

      if (isSubmitted) {
        setFormData(INITIAL_FORM_STATE);
        setFormErrors({});
        setIsSubmitted(false);
        setIsSubmitting(false);
      }

      return;
    }

    document.body.classList.remove("profile-modal-open");
    document.documentElement.classList.remove("profile-modal-open");

    if (wasOpenRef.current) {
      window.dispatchEvent(new Event("profile-modal:close"));
    }

    wasOpenRef.current = false;

    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }

    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }

    setIsSubmitting(false);
  }, [isMounted, isOpen, isSubmitted]);

  useEffect(() => {
    const onEscapePress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscapePress);

    return () => {
      window.removeEventListener("keydown", onEscapePress);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("profile-modal-open");
      document.documentElement.classList.remove("profile-modal-open");

      if (wasOpenRef.current) {
        window.dispatchEvent(new Event("profile-modal:close"));
      }

      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }

      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const handleInputChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;

      setFormData((currentValue) => ({
        ...currentValue,
        [field]: nextValue,
      }));

      setFormErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(formData);

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);

      const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalidField) {
        window.requestAnimationFrame(() => {
          const firstInvalidElement = document.getElementById(`company-profile-${firstInvalidField}`);
          if (firstInvalidElement instanceof HTMLElement) {
            firstInvalidElement.focus();
          }
        });
      }

      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      triggerProfileDownload();
      submitTimerRef.current = null;
    }, 720);
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden={!isOpen}
      className={styles.overlay}
      ref={overlayRef}
    >
      <button
        aria-label="Close company profile form"
        className={styles.backdrop}
        onClick={onClose}
        type="button"
      />

      <div className={styles.viewport}>
        <div
          aria-describedby="company-profile-description"
          aria-labelledby="company-profile-title"
          aria-modal="true"
          className={styles.panel}
          ref={panelRef}
          role="dialog"
        >
          <span aria-hidden="true" className={`${styles.panelGlow} ${styles.panelGlowPrimary}`} />
          <span aria-hidden="true" className={`${styles.panelGlow} ${styles.panelGlowSecondary}`} />

          <div className={styles.header} ref={headerRef}>
            <div className={styles.headerCopy}>
              <p className={styles.eyebrow}>Company Profile Access</p>
              <h2 className={styles.title} id="company-profile-title">
                Share a few details to unlock the profile
              </h2>
              <p className={styles.description} id="company-profile-description">
                We use this form to understand who is requesting the profile and keep access a bit
                more intentional.
              </p>
            </div>

            <button
              aria-label="Close company profile form"
              className={styles.closeButton}
              onClick={onClose}
              type="button"
            >
              <span aria-hidden="true" className={styles.closeIcon}>
                <span className={styles.closeLine} />
                <span className={styles.closeLine} />
              </span>
            </button>
          </div>

          <div className={styles.body} ref={bodyRef}>
            {isSubmitted ? (
              <div className={styles.successState} role="status">
                <div className={styles.successIconWrap} aria-hidden="true">
                  <svg className={styles.successIcon} viewBox="0 0 64 64">
                    <circle className={styles.successCircle} cx="32" cy="32" r="23" />
                    <path className={styles.successCheck} d="M20 33.5 28.5 42 45 24.5" />
                  </svg>
                </div>
                <p className={styles.successEyebrow}>Profile Unlocked</p>
                <h3 className={styles.successTitle}>Thanks for sharing your details.</h3>
                <p className={styles.successCopy}>
                  Your company profile should begin downloading in a moment. If it does not, use
                  the manual link below and we will get it to you right away.
                </p>
                <div className={styles.successActions}>
                  <a
                    className={styles.manualDownloadLink}
                    download={COMPANY_PROFILE_FILENAME}
                    href={COMPANY_PROFILE_URL}
                    onClick={(event) => {
                      event.preventDefault();
                      triggerProfileDownload();
                    }}
                  >
                    Download the profile manually
                  </a>
                  <button className={styles.secondaryButton} onClick={onClose} type="button">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.form} noValidate onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Name <span className={styles.requiredMark}>*</span>
                    </span>
                    <input
                      autoComplete="name"
                      className={styles.fieldControl}
                      id="company-profile-name"
                      name="name"
                      onChange={handleInputChange("name")}
                      placeholder="Your full name"
                      ref={nameInputRef}
                      type="text"
                      value={formData.name}
                    />
                    {formErrors.name ? <span className={styles.fieldError}>{formErrors.name}</span> : null}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Business type <span className={styles.requiredMark}>*</span>
                    </span>
                    <input
                      autoComplete="organization"
                      className={styles.fieldControl}
                      id="company-profile-businessType"
                      name="businessType"
                      onChange={handleInputChange("businessType")}
                      placeholder="Brand, studio, real estate, hospitality..."
                      type="text"
                      value={formData.businessType}
                    />
                    {formErrors.businessType ? (
                      <span className={styles.fieldError}>{formErrors.businessType}</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Phone number <span className={styles.requiredMark}>*</span>
                    </span>
                    <input
                      autoComplete="tel"
                      className={styles.fieldControl}
                      id="company-profile-phone"
                      name="phone"
                      onChange={handleInputChange("phone")}
                      placeholder="+971 50 123 4567"
                      type="tel"
                      value={formData.phone}
                    />
                    {formErrors.phone ? <span className={styles.fieldError}>{formErrors.phone}</span> : null}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Email <span className={styles.requiredMark}>*</span>
                    </span>
                    <input
                      autoComplete="email"
                      className={styles.fieldControl}
                      id="company-profile-email"
                      name="email"
                      onChange={handleInputChange("email")}
                      placeholder="you@business.com"
                      type="email"
                      value={formData.email}
                    />
                    {formErrors.email ? <span className={styles.fieldError}>{formErrors.email}</span> : null}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Instagram ID</span>
                    <span className={styles.fieldNote}>
                      Optional. This just helps us understand your social presence.
                    </span>
                    <input
                      autoComplete="off"
                      className={styles.fieldControl}
                      id="company-profile-instagramId"
                      name="instagramId"
                      onChange={handleInputChange("instagramId")}
                      placeholder="@yourbrand"
                      type="text"
                      value={formData.instagramId}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Website</span>
                    <span className={styles.fieldNote}>Optional. Add it if you already have one.</span>
                    <input
                      autoComplete="url"
                      className={styles.fieldControl}
                      id="company-profile-website"
                      name="website"
                      onChange={handleInputChange("website")}
                      placeholder="yourbrand.com"
                      type="text"
                      value={formData.website}
                    />
                    {formErrors.website ? <span className={styles.fieldError}>{formErrors.website}</span> : null}
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Message</span>
                    <span className={styles.fieldNote}>Optional. Tell us what you are building.</span>
                    <textarea
                      className={`${styles.fieldControl} ${styles.fieldTextarea}`}
                      id="company-profile-message"
                      name="message"
                      onChange={handleInputChange("message")}
                      placeholder="A short note about your brand, project, or what you are looking for."
                      rows={4}
                      value={formData.message}
                    />
                  </label>
                </div>

                <div className={styles.formFooter}>
                  <p className={styles.footerNote}>
                    Required fields help us understand who is requesting the profile before it is
                    downloaded.
                  </p>
                  <button
                    className={styles.submitButton}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Preparing your profile..." : "Submit and Download Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
