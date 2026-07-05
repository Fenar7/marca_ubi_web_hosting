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
  PlayIcon
} from "@sanity/icons";

interface Step1Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
}

const categories = [
  "Logo & identity",
  "Web & app design",
  "Business & advertising",
  "Clothing & merchandise",
  "Art & illustration",
  "Packaging & label",
  "Book & magazine",
  "Other",
];

const serviceIcons: Record<string, React.ReactNode> = {
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
  
  // Web & app
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

  // Clothing
  "T-shirt": <TagIcon />,
  "Clothing or apparel": <TagIcon />,
  "Merchandise": <PackageIcon />,
  "Cup or mug": <StarIcon />,
  "Sticker": <SparkleIcon />,
  "Other clothing or merchandise": <TagIcon />,

  // Art
  "Illustration or graphics": <EditIcon />,
  "Card or invitation": <EnvelopeIcon />,
  "Character or mascot": <UserIcon />,
  "Tattoo": <EditIcon />,
  "3D": <BlockElementIcon />,
  "Other art or illustration": <EditIcon />,

  // Packaging
  "Product packaging": <PackageIcon />,
  "Product label": <TagIcon />,
  "Other packaging or label": <PackageIcon />,

  // Book
  "Book cover": <BookIcon />,
  "Magazine cover": <ImagesIcon />,
  "Typesetting": <TextIcon />,
  "Typesetting with imagery": <ImagesIcon />,
  "Other book or magazine": <BookIcon />,

  // Default fallback
  "Other design": <BulbOutlineIcon />
};

const servicesByCategory: Record<string, string[]> = {
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
  "Packaging & label": ["Product packaging", "Product label", "Other packaging or label"],
  "Book & magazine": ["Book cover", "Magazine cover", "Typesetting", "Typesetting with imagery", "Other book or magazine"],
  "Other": ["Other design"],
};

export default function Step1Services({ formData, updateFormData, nextStep }: Step1Props) {
  const [selectedCategory, setSelectedCategory] = useState(formData.category || categories[0]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    updateFormData("category", category);
    updateFormData("service", ""); // Reset service when category changes
  };

  const handleServiceSelect = (service: string) => {
    if (!formData.category) {
      updateFormData("category", selectedCategory);
    }
    updateFormData("service", service);
  };

  const isComplete = formData.category !== "" && formData.service !== "";

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>What do you need designed?</h2>
      
      <div className={styles.categoryTabs}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ""}`}
            onClick={() => handleCategorySelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.serviceGrid}>
        {servicesByCategory[selectedCategory]?.map((service) => (
          <button
            key={service}
            className={`${styles.serviceCard} ${formData.service === service ? styles.active : ""}`}
            onClick={() => handleServiceSelect(service)}
          >
            <div className={styles.cardIcon}>
              {serviceIcons[service] || <SparkleIcon />}
            </div>
            <h3>{service}</h3>
          </button>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button 
          className={styles.btnPrimary} 
          onClick={nextStep}
          disabled={!isComplete}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
