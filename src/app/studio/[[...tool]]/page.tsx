"use client";

/**
 * Sanity Studio embedded at /studio
 * Accessible from the Next.js dev server — no separate process needed.
 */

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export default function StudioPage() {
    return <NextStudio config={config} />;
}
