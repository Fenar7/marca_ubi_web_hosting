import { defineField, defineType } from "sanity";

export const workSchema = defineType({
    name: "work",
    title: "Work",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "subtext",
            title: "Subtext / Category",
            type: "string",
            description: "e.g. ARCHITECTURE | WEB DEVELOPMENT",
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "coverImage",
            title: "Cover Image",
            type: "image",
            options: { hotspot: true },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: "caseStudyLink",
            title: "Case Study Link",
            type: "url",
            description: "Optional — leave blank to hide the link on the card",
        }),
        defineField({
            name: "testimonialLink",
            title: "Testimonial Link",
            type: "url",
            description: "Optional — leave blank to hide the link on the card",
        }),
        defineField({
            name: "viewWorkLink",
            title: "View Work Link",
            type: "url",
            description: "Optional — clicking the card redirects here",
        }),
        defineField({
            name: "order",
            title: "Display Order",
            type: "number",
            description: "Lower number = appears first",
            initialValue: 0,
        }),
    ],
    orderings: [
        {
            title: "Display Order",
            name: "orderAsc",
            by: [{ field: "order", direction: "asc" }],
        },
    ],
    preview: {
        select: {
            title: "title",
            subtitle: "subtext",
            media: "coverImage",
        },
    },
});
