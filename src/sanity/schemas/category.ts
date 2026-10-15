import { defineField, defineType } from "sanity";

export const categorySchema = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
      description: "Brief editorial focus for this category (used in category headers and SEO)",
    }),
    defineField({
      name: "color",
      title: "Accent Color Hex",
      type: "string",
      description: "Hex code (e.g. #fe3a02) used for category pill tags",
      initialValue: "#fe3a02",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
    },
  },
});
