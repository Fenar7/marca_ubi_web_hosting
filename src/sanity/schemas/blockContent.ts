/**
 * @file src/sanity/schemas/blockContent.ts
 * @description Master PortableText schema for Marca Ubi editorial dispatches.
 *              Extends the core typographic ladder with four specialized Generative
 *              Engine Optimization (GEO) structured blocks:
 *              1. comparisonTable: Tabular structured data for LLM vector indexing.
 *              2. executiveSummary: High-signal opening thesis & direct answer box.
 *              3. statCallout: High-contrast verifiable empirical metrics.
 *              4. faqSection: Semantic Q&A accordion emitting FAQPage schema.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { defineArrayMember, defineType } from "sanity";

export const blockContentSchema = defineType({
  name: "blockContent",
  title: "Block Content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Heading 4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Code", value: "code" },
          { title: "Underline", value: "underline" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              {
                name: "href",
                type: "url",
                title: "URL",
                validation: (rule) => rule.required().uri({ scheme: ["http", "https", "mailto", "tel"] }),
              },
              {
                name: "blank",
                type: "boolean",
                title: "Open in new window",
                initialValue: true,
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      name: "callout",
      title: "Editorial Callout",
      type: "object",
      fields: [
        {
          name: "type",
          title: "Type",
          type: "string",
          options: {
            list: [
              { title: "Studio Note", value: "note" },
              { title: "Core Principle", value: "principle" },
              { title: "Warning / Watchpoint", value: "warning" },
            ],
          },
          initialValue: "note",
        },
        {
          name: "title",
          title: "Callout Title",
          type: "string",
        },
        {
          name: "content",
          title: "Content",
          type: "text",
          rows: 3,
          validation: (rule) => rule.required(),
        },
      ],
      preview: {
        select: {
          title: "title",
          subtitle: "content",
          type: "type",
        },
        prepare({ title, subtitle, type }) {
          return {
            title: title || `Callout (${type})`,
            subtitle,
          };
        },
      },
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Crucial for SEO and screen readers",
          validation: (rule) => rule.required(),
        },
        {
          name: "caption",
          title: "Caption",
          type: "string",
        },
      ],
    }),
    defineArrayMember({
      name: "codeBlock",
      title: "Code Block",
      type: "object",
      fields: [
        {
          name: "language",
          title: "Language",
          type: "string",
          options: {
            list: [
              { title: "TypeScript", value: "ts" },
              { title: "TSX / React", value: "tsx" },
              { title: "JavaScript", value: "js" },
              { title: "SCSS / CSS", value: "scss" },
              { title: "HTML", value: "html" },
              { title: "JSON", value: "json" },
              { title: "Bash / Terminal", value: "bash" },
            ],
          },
          initialValue: "ts",
        },
        {
          name: "filename",
          title: "Filename (optional)",
          type: "string",
        },
        {
          name: "code",
          title: "Code",
          type: "text",
          rows: 6,
          validation: (rule) => rule.required(),
        },
      ],
    }),

    // ── GEO Block 1: Structured Comparison Table
    defineArrayMember({
      name: "comparisonTable",
      title: "Comparison Table (GEO Structured Data)",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Table Title",
          type: "string",
        },
        {
          name: "caption",
          title: "Caption / Footnote",
          type: "string",
        },
        {
          name: "headers",
          title: "Column Headers",
          type: "array",
          of: [{ type: "string" }],
          validation: (rule) => rule.required().min(2),
        },
        {
          name: "rows",
          title: "Table Rows",
          type: "array",
          of: [
            defineArrayMember({
              name: "tableRow",
              title: "Table Row",
              type: "object",
              fields: [
                {
                  name: "cells",
                  title: "Cells (in column order)",
                  type: "array",
                  of: [{ type: "string" }],
                  validation: (rule) => rule.required(),
                },
              ],
              preview: {
                select: {
                  cells: "cells",
                },
                prepare({ cells }) {
                  return {
                    title: Array.isArray(cells) ? cells.join(" | ") : "Empty Row",
                  };
                },
              },
            }),
          ],
          validation: (rule) => rule.required(),
        },
      ],
      preview: {
        select: {
          title: "title",
          headers: "headers",
        },
        prepare({ title, headers }) {
          return {
            title: title || "Comparison Table",
            subtitle: Array.isArray(headers) ? `Columns: ${headers.join(", ")}` : "Table",
          };
        },
      },
    }),

    // ── GEO Block 2: Executive Summary / Direct Answer Box
    defineArrayMember({
      name: "executiveSummary",
      title: "Executive Summary / GEO First 150 Words",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Headline (optional)",
          type: "string",
          initialValue: "Executive Thesis & Strategic Summary",
        },
        {
          name: "content",
          title: "Core Thesis / Direct Answer",
          type: "text",
          rows: 4,
          validation: (rule) => rule.required(),
        },
        {
          name: "keyTakeaways",
          title: "Key Takeaways (Bullet Points)",
          type: "array",
          of: [{ type: "string" }],
        },
      ],
      preview: {
        select: {
          title: "title",
          subtitle: "content",
        },
        prepare({ title, subtitle }) {
          return {
            title: title || "Executive Summary",
            subtitle,
          };
        },
      },
    }),

    // ── GEO Block 3: Verifiable Stat Callout
    defineArrayMember({
      name: "statCallout",
      title: "Verifiable Stat Callout",
      type: "object",
      fields: [
        {
          name: "value",
          title: "Metric Value",
          type: "string",
          description: "e.g. 208%, 3.4x, 6.8 to 11 stakeholders",
          validation: (rule) => rule.required(),
        },
        {
          name: "label",
          title: "Metric Label",
          type: "string",
          description: "e.g. Pipeline Velocity Expansion",
          validation: (rule) => rule.required(),
        },
        {
          name: "description",
          title: "Contextual Details",
          type: "text",
          rows: 2,
        },
        {
          name: "sourceCitation",
          title: "Verifiable Source / Citation",
          type: "string",
          description: "e.g. Marca Ubi Enterprise Benchmark Q3 2026",
        },
      ],
      preview: {
        select: {
          value: "value",
          label: "label",
        },
        prepare({ value, label }) {
          return {
            title: `${value || ""} — ${label || ""}`,
            subtitle: "Stat Callout",
          };
        },
      },
    }),

    // ── GEO Block 4: In-Body FAQ Section
    defineArrayMember({
      name: "faqSection",
      title: "FAQ Section (In-Body Structured Q&A)",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Section Heading",
          type: "string",
          initialValue: "Frequently Asked Questions",
        },
        {
          name: "items",
          title: "Questions & Answers",
          type: "array",
          of: [
            defineArrayMember({
              name: "faqItem",
              title: "FAQ Item",
              type: "object",
              fields: [
                {
                  name: "question",
                  title: "Question",
                  type: "string",
                  validation: (rule) => rule.required(),
                },
                {
                  name: "answer",
                  title: "Answer",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                },
              ],
              preview: {
                select: {
                  title: "question",
                  subtitle: "answer",
                },
              },
            }),
          ],
          validation: (rule) => rule.required().min(1),
        },
      ],
      preview: {
        select: {
          title: "title",
          items: "items",
        },
        prepare({ title, items }) {
          return {
            title: title || "FAQ Section",
            subtitle: Array.isArray(items) ? `${items.length} question(s)` : "FAQ Section",
          };
        },
      },
    }),
  ],
});
