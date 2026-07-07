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
  RocketIcon,
  AddIcon,
  TrashIcon
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
  "Not sure. I'd like to chat with my Brand experience consultant",
];

const timelineIcons: Record<string, React.ReactNode> = {
  "48 hours (Quick turnaround fees typically apply)": <RocketIcon />,
  "1 week": <ClockIcon />,
  "2 weeks": <CalendarIcon />,
  "1 month": <CalendarIcon />,
  "Choose a start & end date": <OlistIcon />,
  "Not sure. I'd like to chat with my Brand experience consultant": <CommentIcon />,
};

export default function Step3Details({ formData, updateFormData, nextStep, prevStep }: Step3Props) {
  const [links, setLinks] = React.useState<string[]>(
    formData.inspirationLinks ? formData.inspirationLinks.split("\n") : [""]
  );

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    updateFormData("inspirationLinks", newLinks.filter(l => l.trim() !== "").join("\n"));
  };

  const addLinkField = () => {
    if (links[links.length - 1].trim() === "") return;
    setLinks([...links, ""]);
  };

  const removeLinkField = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    if (newLinks.length === 0) newLinks.push("");
    setLinks(newLinks);
    updateFormData("inspirationLinks", newLinks.filter(l => l.trim() !== "").join("\n"));
  };

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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {links.map((link, index) => (
            <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input 
                type="text" 
                className={styles.formInput}
                placeholder="https://pinterest.com/..."
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                style={{ flex: 1 }}
              />
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinkField(index)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.4)",
                    width: "56px",
                    height: "100%",
                    minHeight: "56px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#ff4d4f";
                    e.currentTarget.style.background = "rgba(255, 77, 79, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }}
                >
                  <TrashIcon style={{ width: "24px", height: "24px" }} />
                </button>
              )}
            </div>
          ))}
          <button 
            type="button"
            onClick={addLinkField}
            disabled={links[links.length - 1].trim() === ""}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              background: "none", 
              border: "none", 
              color: links[links.length - 1].trim() === "" ? "rgba(255, 255, 255, 0.2)" : "#dc4216", 
              cursor: links[links.length - 1].trim() === "" ? "not-allowed" : "pointer", 
              fontWeight: 500,
              padding: "0.5rem 0",
              alignSelf: "flex-start",
              fontSize: "0.95rem",
              fontFamily: "inherit"
            }}
          >
            <AddIcon /> Add another link
          </button>
        </div>
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
                {tl.includes("Not sure") && <p>I'd like to chat with my Brand experience consultant</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Can your Brand experience consultant showcase the finished designs in their portfolio?</label>
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
        <label>Anything else you'd like to share with your Brand experience consultant?</label>
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
