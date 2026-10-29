import { defineType, defineField } from "sanity";

export const faqItemSchema = defineType({
  name: "faqItem",
  title: "FAQ Items",
  type: "document",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (Rule) => Rule.required().min(5),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Agency & Philosophy", value: "Agency & Philosophy" },
          { title: "Engagements & Delivery", value: "Engagements & Delivery" },
          { title: "Technology & Systems", value: "Technology & Systems" },
          { title: "IP & Commercial Terms", value: "IP & Commercial Terms" },
        ],
      },
      initialValue: "Agency & Philosophy",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Priority sequence for homepage ordering (lowest number appears first).",
      initialValue: 0,
    }),
    defineField({
      name: "isActive",
      title: "Active Status",
      type: "boolean",
      description: "Toggle whether this FAQ is publicly displayed on the homepage.",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Display Order, Ascending",
      name: "orderAsc",
      by: [
        { field: "order", direction: "asc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "question",
      subtitle: "category",
      isActive: "isActive",
    },
    prepare({ title, subtitle, isActive }) {
      return {
        title: title || "Untitled Question",
        subtitle: `${subtitle || "Uncategorized"} · ${isActive ? "Active" : "Draft/Hidden"}`,
      };
    },
  },
});

export default faqItemSchema;
