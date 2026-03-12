import { defineField, defineType } from "sanity";

export const companyProfileSubmissionSchema = defineType({
  name: "companyProfileSubmission",
  title: "Company Profile Submissions",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "businessType",
      title: "Business Type",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "instagramId",
      title: "Instagram ID",
      type: "string",
    }),
    defineField({
      name: "website",
      title: "Website",
      type: "url",
    }),
    defineField({
      name: "message",
      title: "Message",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      initialValue: "hero-company-profile-modal",
      readOnly: true,
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
      title: "name",
      subtitle: "email",
      submittedAt: "submittedAt",
    },
    prepare(selection) {
      const { title, subtitle, submittedAt } = selection;
      const formattedDate =
        typeof submittedAt === "string"
          ? new Date(submittedAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "No submission time";

      return {
        title: title || "Company Profile Submission",
        subtitle: `${subtitle || "No email"} · ${formattedDate}`,
      };
    },
  },
});
