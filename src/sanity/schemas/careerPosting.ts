import { defineField, defineType } from "sanity";

/**
 * Career Posting Schema definition.
 * Models open job listings with structured role requirements, departments, and working arrangements.
 */
export const careerPostingSchema = defineType({
  name: "careerPosting",
  title: "Career Postings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Position Title",
      type: "string",
      validation: (rule) => rule.required().max(120),
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
      name: "department",
      title: "Department",
      type: "string",
      options: {
        list: [
          "Brand Strategy",
          "Design & Creative Direction",
          "Engineering & Technology",
          "Client Experience",
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: "e.g. Calicut, Chennai, Trivandrum, Remote",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "workplaceType",
      title: "Workplace Type",
      type: "string",
      options: {
        list: ["On-site", "Hybrid", "Remote"],
      },
      initialValue: "On-site",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "employmentType",
      title: "Employment Type",
      type: "string",
      options: {
        list: ["Full-time", "Contract", "Part-time", "Internship"],
      },
      initialValue: "Full-time",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "experience",
      title: "Experience Required",
      type: "string",
      description: "e.g. 3–4 years experience",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "overview",
      title: "Role Overview",
      type: "text",
      description: "Role summary and contextual narrative.",
      rows: 4,
    }),
    defineField({
      name: "responsibilities",
      title: "Key Responsibilities",
      description: "On any given day you might tackle these challenges.",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "qualifications",
      title: "Qualifications & Skills",
      description: "What we value in applicants for this position.",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "order",
      title: "Display Order Priority",
      type: "number",
      initialValue: 0,
      description: "Lower numbers appear first on the listings page.",
    }),
    defineField({
      name: "isActive",
      title: "Is Active / Open",
      type: "boolean",
      initialValue: true,
      description: "Controls public visibility on the careers board.",
    }),
  ],
  orderings: [
    {
      title: "Order Priority, Ascending",
      name: "orderAsc",
      by: [
        { field: "order", direction: "asc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      department: "department",
      location: "location",
      workplaceType: "workplaceType",
      isActive: "isActive",
    },
    prepare(selection) {
      const { title, department, location, workplaceType, isActive } = selection;
      const statusBadge = isActive === false ? " [CLOSED]" : "";
      const meta = [department, location, workplaceType].filter(Boolean).join(" · ");
      return {
        title: `${title || "Untitled Role"}${statusBadge}`,
        subtitle: meta || "No metadata",
      };
    },
  },
});
