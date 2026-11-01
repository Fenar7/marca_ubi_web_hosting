import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { client } from "./client";
import type { SanityImageReference } from "@/sanity/types/blog";

const builder = createImageUrlBuilder(client);

/**
 * Generates responsive image URLs from Sanity image assets with strict typing.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Editorially-safe cover crop: renders the fixed aspect frame the card system
 * expects while honouring the studio's authored hotspot, so a subject the
 * editor pinned in Studio is never blind-center-cropped away. Returns null
 * when the post has no cover at all, letting callers decide their fallback.
 */
export function coverUrl(
  source: SanityImageReference | undefined,
  width: number,
  height: number
): string | null {
  if (!source?.asset?.url) return null;
  let image = builder.image(source).width(width).height(height).quality(85).auto("format");
  const hotspot = source.hotspot;
  if (hotspot && typeof hotspot.x === "number" && typeof hotspot.y === "number") {
    image = image.focalPoint(hotspot.x, hotspot.y);
  }
  return image.url();
}
