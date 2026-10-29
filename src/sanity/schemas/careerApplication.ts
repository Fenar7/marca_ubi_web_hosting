import { defineField, defineType } from "sanity";

/**
 * Career Application Schema definition.
 * Ingests inbound candidate submissions, resume attachments, and recruitment progress status.
 */
export const careerApplicationSchema = defineType({
  name: "careerApplication",
  title: "Career Applications",
  type: "document",
  fields: [
    defineField({
      name: "position",
      title: "Linked Position",
      type: "reference",
      to: [{ type: "careerPosting" }],
      description: "Direct reference to the Sanity Career Posting document.",
    }),
    defineField({
      name: "positionTitle",
      title: "Position Title",
      type: "string",
      description: "Position title captured at time of candidate application.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fullName",
      title: "Full Name",
      type: "string",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "email",
      title: "Email Address",
      type: "string",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "linkedIn",
      title: "LinkedIn Profile URL",
      type: "url",
    }),
    defineField({
      name: "portfolio",
      title: "Portfolio / Website URL",
      type: "url",
    }),
    defineField({
      name: "resumeFile",
      title: "Resume File Asset",
      type: "file",
      options: {
        accept: ".pdf,.doc,.docx,.rtf",
      },
    }),
    defineField({
      name: "coverNote",
      title: "Cover Note / Candidate Remarks",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Application Status",
      type: "string",
      options: {
        list: ["New", "Reviewing", "Shortlisted", "Archived"],
      },
      initialValue: "New",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Newest First",
      name: "submittedAtDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      fullName: "fullName",
      positionTitle: "positionTitle",
      status: "status",
      submittedAt: "submittedAt",
    },
    prepare(selection) {
      const { fullName, positionTitle, status, submittedAt } = selection;
      const formattedDate =
        typeof submittedAt === "string"
          ? new Date(submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recently";

      return {
        title: fullName || "Unnamed Applicant",
        subtitle: `[${status || "New"}] ${positionTitle || "General Application"} · ${formattedDate}`,
      };
    },
  },
});
