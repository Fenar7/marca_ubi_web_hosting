"use client";

import React, { useState, useMemo } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";
import {
  SparkleIcon,
  HeartIcon,
  EarthGlobeIcon,
  UserIcon,
  BookIcon,
  DocumentIcon,
  DocumentsIcon,
  PackageIcon,
  DesktopIcon,
  ComponentIcon,
  MobileDeviceIcon,
  ImagesIcon,
  ImageIcon,
  EnvelopeIcon,
  ControlsIcon,
  TagIcon,
  BlockElementIcon,
  EditIcon,
  TextIcon,
  ColorWheelIcon,
  StarIcon,
  DashboardIcon,
  BulbOutlineIcon,
  PlayIcon,
} from "@sanity/icons";

interface Step1Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
}

/**
 * Complete authentic category catalog for client project intake.
 */
const CATEGORIES: string[] = [
  "Logo & identity",
  "Web & app design",
  "Business & advertising",
  "Clothing & merchandise",
  "Art & illustration",
  "Packaging & label",
  "Book & magazine",
  "Other",
];

/**
 * Dedicated visual iconography for every granular service item.
 */
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  // Logo & identity
  "Logo design": <SparkleIcon />,
  "Logo & brand identity pack": <StarIcon />,
  "Logo & social media pack": <HeartIcon />,
  "Logo & hosted website": <EarthGlobeIcon />,
  "Logo & business card": <UserIcon />,
  "Brand guide": <BookIcon />,
  "Business card": <UserIcon />,
  "Stationery": <DocumentIcon />,
  "Logo & brand guide": <BookIcon />,
  "Logo & product packaging": <PackageIcon />,

  // Web & app design
  "Web page design": <DesktopIcon />,
  "WordPress theme design": <DashboardIcon />,
  "Landing page design": <DesktopIcon />,
  "Icon or button": <ComponentIcon />,
  "App design": <MobileDeviceIcon />,
  "Facebook cover": <ImagesIcon />,
  "Social media page": <ImagesIcon />,
  "Banner ad": <ImageIcon />,
  "Other web or app design": <DesktopIcon />,

  // Business & advertising
  "Postcard, flyer or print": <EnvelopeIcon />,
  "Poster": <DocumentsIcon />,
  "Infographic": <ControlsIcon />,
  "Brochure": <BookIcon />,
  "Car, truck or van wrap": <ColorWheelIcon />,
  "Signage": <BlockElementIcon />,
  "Email": <EnvelopeIcon />,
  "PowerPoint template": <DesktopIcon />,
  "Menu": <TextIcon />,
  "Other business or advertising": <BulbOutlineIcon />,
  "Album Cover": <ImagesIcon />,
  "Podcast": <PlayIcon />,

  // Clothing & merchandise
  "T-shirt": <TagIcon />,
  "Clothing or apparel": <TagIcon />,
  "Merchandise": <PackageIcon />,
  "Cup or mug": <StarIcon />,
  "Sticker": <SparkleIcon />,
  "Other clothing or merchandise": <TagIcon />,

  // Art & illustration
  "Illustration or graphics": <EditIcon />,
  "Card or invitation": <EnvelopeIcon />,
  "Character or mascot": <UserIcon />,
  "Tattoo": <EditIcon />,
  "3D": <BlockElementIcon />,
  "Other art or illustration": <EditIcon />,

  // Packaging & label
  "Product packaging": <PackageIcon />,
  "Product label": <TagIcon />,
  "Other packaging or label": <PackageIcon />,

  // Book & magazine
  "Book cover": <BookIcon />,
  "Magazine cover": <ImagesIcon />,
  "Typesetting": <TextIcon />,
  "Typesetting with imagery": <ImagesIcon />,
  "Other book or magazine": <BookIcon />,

  // Default fallback
  "Other design": <BulbOutlineIcon />,
};

/**
 * 52 granular sub-services categorized by design discipline.
 */
const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  "Logo & identity": [
    "Logo design",
    "Logo & brand identity pack",
    "Logo & social media pack",
    "Logo & hosted website",
    "Logo & business card",
    "Brand guide",
    "Business card",
    "Stationery",
    "Logo & brand guide",
    "Logo & product packaging",
  ],
  "Web & app design": [
    "Web page design",
    "WordPress theme design",
    "Landing page design",
    "Icon or button",
    "App design",
    "Facebook cover",
    "Social media page",
    "Banner ad",
    "Other web or app design",
  ],
  "Business & advertising": [
    "Postcard, flyer or print",
    "Poster",
    "Infographic",
    "Brochure",
    "Car, truck or van wrap",
    "Signage",
    "Email",
    "PowerPoint template",
    "Menu",
    "Other business or advertising",
    "Album Cover",
    "Podcast",
  ],
  "Clothing & merchandise": [
    "T-shirt",
    "Clothing or apparel",
    "Merchandise",
    "Cup or mug",
    "Sticker",
    "Other clothing or merchandise",
  ],
  "Art & illustration": [
    "Illustration or graphics",
    "Card or invitation",
    "Character or mascot",
    "Tattoo",
    "3D",
    "Other art or illustration",
  ],
  "Packaging & label": [
    "Product packaging",
    "Product label",
    "Other packaging or label",
  ],
  "Book & magazine": [
    "Book cover",
    "Magazine cover",
    "Typesetting",
    "Typesetting with imagery",
    "Other book or magazine",
  ],
  "Other": ["Other design"],
};

/**
 * Pre-computed inverted lookup mapping every service name to its parent category.
 */
const SERVICE_TO_CATEGORY: Record<string, string> = Object.entries(
  SERVICES_BY_CATEGORY
).reduce((acc, [category, services]) => {
  services.forEach((service) => {
    acc[service] = category;
  });
  return acc;
}, {} as Record<string, string>);

/**
 * Step 1: Design Scope & Multi-Service Taxonomy Selection Engine.
 * Supports selecting multiple services within and across all 8 design disciplines,
 * with cross-category selection persistence, category badge counts, and Brand Red styling.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step1Services({
  formData,
  updateFormData,
  nextStep,
}: Step1Props) {
  // Parse currently selected services from comma-delimited string
  const selectedServices = useMemo<string[]>(() => {
    if (!formData.service) return [];
    return formData.service
      .split(", ")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [formData.service]);

  // Determine active category tab (defaults to first category with an active selection or first tab)
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (selectedServices.length > 0) {
      const firstCat = SERVICE_TO_CATEGORY[selectedServices[0]];
      if (firstCat && CATEGORIES.includes(firstCat)) return firstCat;
    }
    if (formData.category && CATEGORIES.includes(formData.category.split(", ")[0])) {
      return formData.category.split(", ")[0];
    }
    return CATEGORIES[0];
  });

  // Calculate selection count per category for tab badges
  const categorySelectionCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      const catServices = SERVICES_BY_CATEGORY[cat] || [];
      counts[cat] = selectedServices.filter((s) => catServices.includes(s)).length;
    });
    return counts;
  }, [selectedServices]);

  // Unique categories derived from all currently selected services
  const uniqueCategories = useMemo<string[]>(() => {
    const cats = selectedServices
      .map((s) => SERVICE_TO_CATEGORY[s])
      .filter((cat): cat is string => Boolean(cat));
    return Array.from(new Set(cats));
  }, [selectedServices]);

  // Toggle selection for a service item
  const handleServiceToggle = (service: string) => {
    const isAlreadySelected = selectedServices.includes(service);
    const updatedServices = isAlreadySelected
      ? selectedServices.filter((s) => s !== service)
      : [...selectedServices, service];

    const updatedCategories = Array.from(
      new Set(
        updatedServices
          .map((s) => SERVICE_TO_CATEGORY[s])
          .filter((cat): cat is string => Boolean(cat))
      )
    );

    updateFormData("service", updatedServices.join(", "));
    updateFormData("category", updatedCategories.join(", "));
  };

  // Clear all selections across all categories
  const handleClearAll = () => {
    updateFormData("service", "");
    updateFormData("category", "");
  };

  const isComplete = selectedServices.length > 0;
  const currentCategoryServices = SERVICES_BY_CATEGORY[selectedCategory] || [];

  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>What do you need designed?</h2>
        <p className={styles.stepDescription}>
          Select one or multiple services across any discipline below. We assemble dedicated specialist teams around your complete project scope.
        </p>
      </header>

      {/* Swiss Architectural Category Tabs with Dynamic Selection Badges */}
      <div
        className={styles.categoryTabs}
        role="tablist"
        aria-label="Design Categories"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const count = categorySelectionCounts[cat] || 0;

          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.categoryTab} ${isActive ? styles.active : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{cat}</span>
              {count > 0 && (
                <span className={styles.tabBadge} aria-label={`${count} selected`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Granular Multi-Select Service Cards Grid */}
      <div
        className={styles.serviceGrid}
        role="group"
        aria-label={`${selectedCategory} Services (Multi-Select)`}
      >
        {currentCategoryServices.map((service) => {
          const isSelected = selectedServices.includes(service);
          const icon = SERVICE_ICONS[service] || <SparkleIcon />;

          return (
            <button
              key={service}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              className={`${styles.serviceCard} ${isSelected ? styles.active : ""}`}
              onClick={() => handleServiceToggle(service)}
            >
              <div className={styles.cardIcon} aria-hidden="true">
                {icon}
              </div>
              <span className={styles.serviceName}>{service}</span>
              <span className={styles.selectionDot} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* Real-Time Live Selection Status Bar */}
      {selectedServices.length > 0 && (
        <div className={styles.selectionStatusBar}>
          <span className={styles.selectionStatusText}>
            <strong>{selectedServices.length}</strong> {selectedServices.length === 1 ? "service" : "services"} selected across <strong>{uniqueCategories.length}</strong> {uniqueCategories.length === 1 ? "discipline" : "disciplines"}
          </span>
          <button
            type="button"
            className={styles.clearSelectionBtn}
            onClick={handleClearAll}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Continue Action Button */}
      <div className={styles.actionContainer}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={nextStep}
          disabled={!isComplete}
          aria-label="Continue to business details"
        >
          <span>
            {selectedServices.length > 1
              ? `Continue (${selectedServices.length} Selected)`
              : "Continue"}
          </span>
          <span className={styles.arrow} aria-hidden="true">
            &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}
