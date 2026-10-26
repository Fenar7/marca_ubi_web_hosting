import { client } from "@/sanity/lib/client";
import { worksQuery } from "@/sanity/lib/queries";
import { postsQuery } from "@/sanity/lib/blog-queries";
import type { SanityWork } from "./components/WorksSection/WorksSectionClient";
import type { PostSummary } from "@/sanity/types/blog";
import ClientHomeExperience from "./components/ClientHomeExperience/ClientHomeExperience";

export const revalidate = 60; // 60-second Incremental Static Regeneration

/**
 * Flagship Client-Facing Homepage Server Component.
 * Concurrently streams dynamic client case studies and editorial dispatches from Sanity CMS,
 * feeding them into the 160over90 alternating living video stream.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function Home() {
  let works: SanityWork[] = [];
  let posts: PostSummary[] = [];

  try {
    const [fetchedWorks, fetchedPosts] = await Promise.all([
      client.fetch<SanityWork[]>(worksQuery),
      client.fetch<PostSummary[]>(postsQuery),
    ]);
    works = fetchedWorks || [];
    posts = fetchedPosts || [];
  } catch (error) {
    console.error("Sanity data fetch error on flagship homepage:", error);
    works = [];
    posts = [];
  }

  return <ClientHomeExperience works={works} posts={posts} />;
}
