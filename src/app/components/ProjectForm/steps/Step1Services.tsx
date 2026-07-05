"use client";

import React, { useState } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";
import { 
  ImagesIcon, 
  DesktopIcon, 
  SparkleIcon, 
  TagIcon, 
  BlockElementIcon, 
  PackageIcon, 
  BookIcon, 
  DocumentIcon 
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

const categoryIcons: Record<string, React.ReactNode> = {
  "Logo & identity": <SparkleIcon />,
  "Web & app design": <DesktopIcon />,
  "Business & advertising": <ImagesIcon />,
  "Clothing & merchandise": <TagIcon />,
  "Art & illustration": <BlockElementIcon />,
  "Packaging & label": <PackageIcon />,
  "Book & magazine": <BookIcon />,
  "Other": <DocumentIcon />,
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
              {categoryIcons[selectedCategory]}
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
