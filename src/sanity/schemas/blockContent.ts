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
          type: "string",
          title: "Caption",
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
  ],
});
