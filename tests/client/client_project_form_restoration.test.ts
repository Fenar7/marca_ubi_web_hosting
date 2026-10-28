/**
 * @file tests/client/client_project_form_restoration.test.ts
 * @description Automated verification test suite for the Project Form Flow Restoration
 *              and Swiss Dark Luxury Aesthetic Elevation for Marca Ubi Enterprise.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Marca Ubi — Project Brief Questionnaire Flow Restoration & Dark Luxury Invariants", () => {
  const rootDir = process.cwd();

  describe("1. Step 1 Services Taxonomy & All 8 Categories Restoration", () => {
    test("verifies Step1Services.tsx contains all 8 authentic categories", () => {
      const step1Path = path.join(
        rootDir,
        "src",
        "app",
        "components",
        "ProjectForm",
        "steps",
        "Step1Services.tsx"
      );
      assert.ok(fs.existsSync(step1Path), "Step1Services.tsx must exist");

      const content = fs.readFileSync(step1Path, "utf8");
      const expectedCategories = [
        "Logo & identity",
        "Web & app design",
        "Business & advertising",
        "Clothing & merchandise",
        "Art & illustration",
        "Packaging & label",
        "Book & magazine",
        "Other",
      ];

      for (const cat of expectedCategories) {
        assert.ok(
          content.includes(`"${cat}"`),
          `Step1Services must declare category '${cat}'`
        );
      }
    });

    test("verifies Step1Services.tsx maps essential @sanity/icons for sub-services", () => {
      const step1Path = path.join(
        rootDir,
        "src",
        "app",
        "components",
        "ProjectForm",
        "steps",
        "Step1Services.tsx"
      );
      const content = fs.readFileSync(step1Path, "utf8");

      assert.ok(content.includes("SparkleIcon"), "Step1Services must import SparkleIcon");
      assert.ok(content.includes("DesktopIcon"), "Step1Services must import DesktopIcon");
      assert.ok(content.includes("PackageIcon"), "Step1Services must import PackageIcon");
      assert.ok(content.includes("TagIcon"), "Step1Services must import TagIcon");
      assert.ok(content.includes("BookIcon"), "Step1Services must import BookIcon");
      assert.ok(content.includes("BulbOutlineIcon"), "Step1Services must import BulbOutlineIcon");
    });
  });

  describe("2. Step 2 Business Coordinates & Stakeholder Fields Restoration", () => {
    test("verifies Step2Business.tsx captures complete business dimensions and Back button", () => {
      const step2Path = path.join(
        rootDir,
        "src",
        "app",
        "components",
        "ProjectForm",
        "steps",
        "Step2Business.tsx"
      );
      assert.ok(fs.existsSync(step2Path), "Step2Business.tsx must exist");

      const content = fs.readFileSync(step2Path, "utf8");
      assert.ok(content.includes("formData.name"), "Step2Business must bind Name input");
      assert.ok(content.includes("formData.email"), "Step2Business must bind Email input");
      assert.ok(content.includes("formData.phone"), "Step2Business must bind Phone input");
      assert.ok(content.includes("formData.instagram"), "Step2Business must bind Instagram input");
      assert.ok(content.includes("formData.language"), "Step2Business must bind Language select");
      assert.ok(content.includes("formData.projectName"), "Step2Business must bind Project Name input");
      assert.ok(content.includes("formData.projectDescription"), "Step2Business must bind Project Description");
      assert.ok(content.includes("formData.industry"), "Step2Business must bind Industry select");
      assert.ok(content.includes("formData.website"), "Step2Business must bind Website input");
      assert.ok(content.includes("formData.agencyStatus"), "Step2Business must bind Agency Status");
      assert.ok(content.includes("formData.referral"), "Step2Business must bind Referral select");
      assert.ok(content.includes("prevStep"), "Step2Business must accept and wire prevStep action");
    });
  });

  describe("3. Step 3 Details, Dynamic Link Repeater & 6 Timelines Restoration", () => {
    test("verifies Step3Details.tsx implements dynamic Inspiration links repeater and 6 timelines", () => {
      const step3Path = path.join(
        rootDir,
        "src",
        "app",
        "components",
        "ProjectForm",
        "steps",
        "Step3Details.tsx"
      );
      assert.ok(fs.existsSync(step3Path), "Step3Details.tsx must exist");

      const content = fs.readFileSync(step3Path, "utf8");
      assert.ok(content.includes("inspirationLinks"), "Step3Details must bind inspirationLinks");
      assert.ok(content.includes("addLinkField"), "Step3Details must provide addLinkField action");
      assert.ok(content.includes("removeLinkField"), "Step3Details must provide removeLinkField action");
      assert.ok(content.includes("48 hours"), "Step3Details must declare 48 hours turnaround timeline");
      assert.ok(content.includes("1 week"), "Step3Details must declare 1 week timeline");
      assert.ok(content.includes("2 weeks"), "Step3Details must declare 2 weeks timeline");
      assert.ok(content.includes("1 month"), "Step3Details must declare 1 month timeline");
      assert.ok(content.includes("Choose a start & end date"), "Step3Details must declare calendar range timeline");
      assert.ok(content.includes("showcasePermission"), "Step3Details must bind showcasePermission radio");
      assert.ok(content.includes("extraNotes"), "Step3Details must bind extraNotes textarea");
      assert.ok(content.includes("prevStep"), "Step3Details must accept and wire prevStep action");
    });
  });

  describe("4. Step 4 Executive Summary Review & CRM Ingestion Invariants", () => {
    test("verifies Step4Summary.tsx implements 3 review dossiers with edit triggers", () => {
      const step4Path = path.join(
        rootDir,
        "src",
        "app",
        "components",
        "ProjectForm",
        "steps",
        "Step4Summary.tsx"
      );
      assert.ok(fs.existsSync(step4Path), "Step4Summary.tsx must exist");

      const content = fs.readFileSync(step4Path, "utf8");
      assert.ok(content.includes("goToStep(1)"), "Step4Summary must wire jump edit to Step 1");
      assert.ok(content.includes("goToStep(2)"), "Step4Summary must wire jump edit to Step 2");
      assert.ok(content.includes("goToStep(3)"), "Step4Summary must wire jump edit to Step 3");
      assert.ok(content.includes("submitCommandButton"), "Step4Summary must render submitCommandButton");
    });

    test("verifies ProjectForm.tsx wires multi-step navigation and transmits payload to CRM", () => {
      const formPath = path.join(rootDir, "src", "app", "components", "ProjectForm", "ProjectForm.tsx");
      assert.ok(fs.existsSync(formPath), "ProjectForm.tsx must exist");

      const content = fs.readFileSync(formPath, "utf8");
      assert.ok(content.includes("/api/sales-funnel/ingest"), "ProjectForm must post to /api/sales-funnel/ingest");
      assert.ok(content.includes("idempotencyKey"), "ProjectForm must transmit X-Idempotency-Key");
      assert.ok(content.includes("prevStep={prevStep}"), "ProjectForm must pass prevStep to sub-steps");
    });
  });

  describe("5. Swiss Dark Luxury Design Tokens & Accessibility", () => {
    test("verifies Step.module.scss enforces Swiss 2px border radius, Brand Red #ea002a, and obsidian palette", () => {
      const scssPath = path.join(
        rootDir,
        "src",
        "app",
        "components",
        "ProjectForm",
        "steps",
        "Step.module.scss"
      );
      assert.ok(fs.existsSync(scssPath), "Step.module.scss must exist");

      const content = fs.readFileSync(scssPath, "utf8");
      assert.ok(content.includes("border-radius: 2px"), "Step.module.scss must enforce Swiss 2px border radius");
      assert.ok(content.includes("border-radius: 4px"), "Step.module.scss must enforce Swiss 4px card radius");
      assert.ok(!content.includes("border-radius: 9999px"), "Step.module.scss must not contain 9999px bubble pills");
      assert.ok(content.includes("$client-accent-red"), "Step.module.scss must use official Brand Red token");
      assert.ok(content.includes("min-height: 44px"), "Step.module.scss interactive elements must meet 44px touch target");
    });
  });
});
