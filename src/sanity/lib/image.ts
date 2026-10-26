import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

/**
 * Generates responsive image URLs from Sanity image assets with strict typing.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
