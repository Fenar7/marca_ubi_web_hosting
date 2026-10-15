import { defineField, defineType } from "sanity";

export const authorSchema = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role / Title",
      type: "string",
      description: "e.g. Founder & Brand Strategist, Design Technologist",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "avatar",
      title: "Avatar Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Author Bio",
      type: "text",
      rows: 3,
      description: "Editorial bio displayed in the author card at the end of dispatches",
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "X (Twitter)", value: "twitter" },
                  { title: "Instagram", value: "instagram" },
                  { title: "Personal Website", value: "website" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "Profile URL",
              type: "url",
              validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role",
      media: "avatar",
    },
  },
});
