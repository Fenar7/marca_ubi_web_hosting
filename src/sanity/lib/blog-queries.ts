import { groq } from "next-sanity";

// All published posts for the /blog listing page
export const postsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    estimatedReadingTime,
    featured,
    mainImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions,
          lqip
        }
      },
      alt,
      caption
    },
    author->{
      _id,
      name,
      role,
      "slug": slug.current,
      avatar {
        asset->{
          _id,
          url
        },
        alt
      }
    },
    category->{
      _id,
      title,
      "slug": slug.current,
      color
    }
  }
`;

// Categories with live post count for filter tabs
export const categoriesQuery = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    color,
    "postCount": count(*[_type == "post" && references(^._id)])
  }
`;

// Detailed single post by slug
export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    _updatedAt,
    excerpt,
    estimatedReadingTime,
    featured,
    mainImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions,
          lqip
        }
      },
      alt,
      caption
    },
    author->{
      _id,
      name,
      role,
      bio,
      "slug": slug.current,
      avatar {
        asset->{
          _id,
          url
        },
        alt
      },
      socialLinks[] {
        platform,
        url
      }
    },
    category->{
      _id,
      title,
      "slug": slug.current,
      color
    },
    body,
    seo {
      metaTitle,
      metaDescription,
      canonicalUrl,
      keywords,
      noIndex,
      ogImage {
        asset->{
          _id,
          url
        }
      }
    }
  }
`;

// Slugs for generateStaticParams()
export const postSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)][].slug.current
`;

// Related posts from the same category
export const relatedPostsQuery = groq`
  *[_type == "post" && category._ref == $categoryId && _id != $currentPostId] | order(publishedAt desc)[0...3] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    estimatedReadingTime,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    },
    category->{
      title,
      "slug": slug.current,
      color
    },
    author->{
      name,
      role,
      avatar {
        asset->{
          _id,
          url
        }
      }
    }
  }
`;

// Slugs and timestamps for dynamic sitemap.ts
export const sitemapPostsQuery = groq`
  *[_type == "post" && defined(slug.current)] {
    "slug": slug.current,
    _updatedAt,
    publishedAt
  }
`;
