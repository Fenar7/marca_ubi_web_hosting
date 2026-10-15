import { defineField, defineType } from "sanity";

export const postSchema = defineType({
  name: "post",
  title: "Blog Post / Dispatch",
  type: "document",
  fieldsets: [
    { name: "editorial", title: "Editorial Content" },
    { name: "metadata", title: "Metadata & Taxonomy" },
    { name: "seo", title: "Search Engine Optimization (SEO)", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    // ── Editorial Fields
    defineField({
      name: "title",
      title: "Article Title",
      type: "string",
      fieldset: "editorial",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      fieldset: "editorial",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt / Standfirst",
      type: "text",
      rows: 3,
      fieldset: "editorial",
      description: "2-3 sentences providing an authoritative summary of the dispatch. Essential for cards and meta descriptions.",
      validation: (rule) => rule.required().min(40).max(280),
    }),
    defineField({
      name: "mainImage",
      title: "Main / Hero Image",
      type: "image",
      fieldset: "editorial",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "caption",
          title: "Caption",
          type: "string",
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Article Body",
      type: "blockContent",
      fieldset: "editorial",
      validation: (rule) => rule.required(),
    }),

    // ── Taxonomy & Metadata
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      fieldset: "metadata",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      fieldset: "metadata",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      fieldset: "metadata",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "estimatedReadingTime",
      title: "Estimated Reading Time (Minutes)",
      type: "number",
      fieldset: "metadata",
      description: "e.g. 5 (if left empty, calculated automatically from body word count)",
    }),
    defineField({
      name: "featured",
      title: "Featured Article",
      type: "boolean",
      fieldset: "metadata",
      description: "Pins this article as the hero feature on the /blog listing page",
      initialValue: false,
    }),

    // ── SEO Fieldset
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      fieldset: "seo",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "Max 60 chars. Defaults to post title + ' — Marca Ubi Insights'",
          validation: (rule) => rule.max(65),
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          rows: 3,
          description: "Max 160 chars. Recommended: 130-155 characters. Defaults to post excerpt.",
          validation: (rule) => rule.max(165),
        }),
        defineField({
          name: "ogImage",
          title: "Social Share Image (OG Image)",
          type: "image",
          description: "1200x630px recommended. Defaults to the Main Image if omitted.",
          options: { hotspot: true },
        }),
        defineField({
          name: "canonicalUrl",
          title: "Canonical URL",
          type: "url",
          description: "Leave empty to use the auto-generated https://marcaubi.com/blog/[slug]",
        }),
        defineField({
          name: "keywords",
          title: "Target Keywords / Tags",
          type: "array",
          of: [{ type: "string" }],
          options: { layout: "tags" },
          description: "Target search terms, e.g. 'brand architecture', 'design systems', 'digital experience'",
        }),
        defineField({
          name: "noIndex",
          title: "Hide from Search Engines (noindex)",
          type: "boolean",
          initialValue: false,
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: "Publication Date, New to Old",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Title, A to Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      authorName: "author.name",
      categoryTitle: "category.title",
      media: "mainImage",
    },
    prepare({ title, authorName, categoryTitle, media }) {
      return {
        title,
        subtitle: `${categoryTitle ?? "Uncategorized"} · by ${authorName ?? "Anonymous"}`,
        media,
      };
    },
  },
});
