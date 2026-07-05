"use client";

import React from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";
import {
  ClockIcon,
  CalendarIcon,
  ControlsIcon,
  CommentIcon,
  OlistIcon,
  RocketIcon
} from "@sanity/icons";

interface Step3Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const timelines = [
  "48 hours (Quick turnaround fees typically apply)",
  "1 week",
  "2 weeks",
  "1 month",
  "Choose a start & end date",
  "Not sure. I'd like to chat with my designer",
];

const timelineIcons: Record<string, React.ReactNode> = {
  "48 hours (Quick turnaround fees typically apply)": <RocketIcon />,
  "1 week": <ClockIcon />,
  "2 weeks": <CalendarIcon />,
  "1 month": <CalendarIcon />,
  "Choose a start & end date": <OlistIcon />,
  "Not sure. I'd like to chat with my designer": <CommentIcon />,
};

export default function Step3Details({ formData, updateFormData, nextStep, prevStep }: Step3Props) {
  const handleTimelineSelect = (timeline: string) => {
    updateFormData("timeline", timeline);
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Details & Timeline</h2>

      <div className={styles.formGroup}>
        <label>Link to any inspiration on the Web</label>
        <p style={{fontSize: "0.875rem", color: "var(--color-hash-grey)", margin: "0 0 0.5rem 0"}}>
          Paste URLs to any designs or imagery you like so we get an idea of the style you're looking for.
        </p>
        <input 
          type="text" 
          className={styles.formInput}
          placeholder="https://pinterest.com/..."
          value={formData.inspirationLinks}
          onChange={(e) => updateFormData("inspirationLinks", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>What's your timeline?</label>
        <div className={styles.timelineGrid}>
          {timelines.map((tl) => (
            <button
              key={tl}
              className={`${styles.timelineCard} ${formData.timeline === tl ? styles.active : ""}`}
              onClick={() => handleTimelineSelect(tl)}
            >
              <div className={styles.cardIcon}>
                {timelineIcons[tl]}
              </div>
              <div className={styles.textContent}>
                <h3>{tl.split(" (")[0]}</h3>
                {tl.includes("(") && <p>{tl.substring(tl.indexOf("("))}</p>}
                {tl.includes("Not sure") && <p>I'd like to chat with my designer</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Can your designer showcase the finished designs in their portfolio?</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="showcasePermission" 
              value="Yes"
              checked={formData.showcasePermission === "Yes"}
              onChange={(e) => updateFormData("showcasePermission", e.target.value)}
            />
            Yes
          </label>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="showcasePermission" 
              value="No"
              checked={formData.showcasePermission === "No"}
              onChange={(e) => updateFormData("showcasePermission", e.target.value)}
            />
            No
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Anything else you'd like to share with your designer?</label>
        <textarea 
          className={styles.formTextarea}
          placeholder="Any extra details..."
          value={formData.extraNotes}
          onChange={(e) => updateFormData("extraNotes", e.target.value)}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.btnSecondary} onClick={prevStep}>Back</button>
        <button className={styles.btnPrimary} onClick={nextStep}>
          Review Brief
        </button>
      </div>
    </div>
  );
}
