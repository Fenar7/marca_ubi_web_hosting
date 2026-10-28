"use client";

import React, { useState } from "react";
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
 * Step 1: Design Scope & Service Taxonomy Selection.
 * Restores 100% of authentic categories and services while applying Swiss 2px/4px
 * architectural dark luxury geometry and Brand Red (#ea002a) indicators.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step1Services({
  formData,
  updateFormData,
  nextStep,
}: Step1Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (formData.category && CATEGORIES.includes(formData.category)) {
      return formData.category;
    }
    return CATEGORIES[0];
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    updateFormData("category", category);
    // Reset service selection when changing category to avoid mismatched state
    if (formData.category !== category) {
      updateFormData("service", "");
    }
  };

  const handleServiceSelect = (service: string) => {
    if (!formData.category) {
      updateFormData("category", selectedCategory);
    }
    updateFormData("service", service);
  };

  const isComplete = Boolean(formData.category && formData.service);
  const currentServices = SERVICES_BY_CATEGORY[selectedCategory] || [];

  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>What do you need designed?</h2>
        <p className={styles.stepDescription}>
          Select your primary discipline and specific service requirements below to begin structuring your project brief.
        </p>
      </header>

      {/* Swiss Architectural Category Tabs */}
      <div
        className={styles.categoryTabs}
        role="tablist"
        aria-label="Design Categories"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.categoryTab} ${isActive ? styles.active : ""}`}
              onClick={() => handleCategorySelect(cat)}
            >
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Granular Service Cards Grid */}
      <div
        className={styles.serviceGrid}
        role="radiogroup"
        aria-label={`${selectedCategory} Services`}
      >
        {currentServices.map((service) => {
          const isSelected = formData.service === service;
          const icon = SERVICE_ICONS[service] || <SparkleIcon />;

          return (
            <button
              key={service}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${styles.serviceCard} ${isSelected ? styles.active : ""}`}
              onClick={() => handleServiceSelect(service)}
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

      {/* Continue Action Button */}
      <div className={styles.actionContainer}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={nextStep}
          disabled={!isComplete}
          aria-label="Continue to business details"
        >
          <span>Continue</span>
          <span className={styles.arrow} aria-hidden="true">
            &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}
