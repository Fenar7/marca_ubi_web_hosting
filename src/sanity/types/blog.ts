import type { PortableTextBlock } from "next-sanity";

export interface SanityImageReference {
  asset?: {
    _id: string;
    url: string;
    metadata?: {
      dimensions?: {
        width: number;
        height: number;
        aspectRatio: number;
      };
      lqip?: string;
    };
  };
  alt?: string;
  caption?: string;
  hotspot?: {
    x: number;
    y: number;
    height?: number;
    width?: number;
  };
}

export interface Author {
  _id: string;
  name: string;
  slug: string;
  role: string;
  bio?: string;
  avatar?: SanityImageReference;
  socialLinks?: Array<{
    platform: "linkedin" | "twitter" | "instagram" | "website";
    url: string;
  }>;
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  color?: string;
  postCount?: number;
}

export interface PostSEO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: SanityImageReference;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  _updatedAt?: string;
  excerpt: string;
  estimatedReadingTime?: number;
  featured?: boolean;
  mainImage?: SanityImageReference;
  author?: Author;
  category?: Category;
  body: PortableTextBlock[];
  seo?: PostSEO;
}

export type PostSummary = Omit<Post, "body" | "seo">;

interface RawTextBlock {
  _type?: string;
  children?: Array<{ text?: string }>;
}

export function calculateReadingTime(blocks?: PortableTextBlock[]): number {
  if (!blocks || blocks.length === 0) return 3;
  const rawBlocks = blocks as unknown as RawTextBlock[];
  const text = rawBlocks
    .filter((b) => b._type === "block")
    .flatMap((b) => b.children || [])
    .map((c) => c.text || "")
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
