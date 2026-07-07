import { defineType, defineField } from "sanity";

export const projectBriefSchema = defineType({
    name: "projectBrief",
    title: "Project Briefs",
    type: "document",
    fields: [
        defineField({
            name: "name",
            title: "Name",
            type: "string",
        }),
        defineField({
            name: "email",
            title: "Email",
            type: "string",
        }),
        defineField({
            name: "phone",
            title: "Phone",
            type: "string",
        }),
        defineField({
            name: "instagram",
            title: "Instagram",
            type: "string",
        }),
        defineField({
            name: "category",
            title: "Category",
            type: "string",
            description: "The top-level category selected (e.g., Logo & identity)",
        }),
        defineField({
            name: "service",
            title: "Service",
            type: "string",
            description: "The specific service selected (e.g., Logo design)",
        }),
        defineField({
            name: "language",
            title: "Preferred Language",
            type: "string",
        }),
        defineField({
            name: "projectName",
            title: "Project Name",
            type: "string",
        }),
        defineField({
            name: "projectDescription",
            title: "Project Description",
            type: "text",
        }),
        defineField({
            name: "industry",
            title: "Industry",
            type: "string",
        }),
        defineField({
            name: "website",
            title: "Website / Social Media",
            type: "string",
        }),
        defineField({
            name: "agencyStatus",
            title: "Agency Status",
            type: "string",
        }),
        defineField({
            name: "referral",
            title: "How did they hear about us?",
            type: "string",
        }),
        defineField({
            name: "timeline",
            title: "Timeline",
            type: "string",
        }),
        defineField({
            name: "inspirationLinks",
            title: "Inspiration Links",
            type: "text",
        }),
        defineField({
            name: "showcasePermission",
            title: "Showcase Permission",
            type: "string",
            options: {
                list: ["Yes", "No"],
            },
        }),
        defineField({
            name: "extraNotes",
            title: "Extra Notes",
            type: "text",
        }),
        defineField({
            name: "submittedAt",
            title: "Submitted At",
            type: "datetime",
            initialValue: () => new Date().toISOString(),
        }),
    ],
    preview: {
        select: {
            title: "projectName",
            subtitle: "category",
            date: "submittedAt",
        },
        prepare(selection) {
            const { title, subtitle, date } = selection;
            return {
                title: title || "Unnamed Project",
                subtitle: `${subtitle || "No category"} - ${date ? new Date(date).toLocaleDateString() : ""}`,
            };
        },
    },
});
