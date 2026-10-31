/**
 * @file src/app/services/content/heroes.ts
 * @description Curated 2400px Unsplash hero imagery for the 16 Services detail pages.
 *              Every photo id was HTTP-verified and visually screened; none collide
 *              with the 16 resting card stills used by the homepage accordion.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { ServiceHero } from "../types";

const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=85&w=2400`;

export const SERVICE_HEROES: Record<string, ServiceHero> = {
  "demand-generation": {
    imageUrl: unsplash("photo-1477959858617-67f85cf4f1df"),
    alt: "Metropolitan skyline at night, office towers lit floor by floor above a dark river",
  },
  "integrated-marketing": {
    imageUrl: unsplash("photo-1517048676732-d65bc937f952"),
    alt: "Strategy session around a timber table, laptops open and notes in review",
  },
  "corporate-communications": {
    imageUrl: unsplash("photo-1505373877841-8d25f7d46678"),
    alt: "Presenter on a large conference stage addressing a packed auditorium under industrial lighting",
  },
  "social-influencer-marketing": {
    imageUrl: unsplash("photo-1516035069371-29a1b244cc32"),
    alt: "Cinema camera body and prime lenses laid out on a dark workbench",
  },
  "content-and-scale": {
    imageUrl: unsplash("photo-1488190211105-8b0e65b80b4e"),
    alt: "Editorial desk from above with notebook in progress, coffee, books and a tablet",
  },
  "public-relations-pr": {
    imageUrl: unsplash("photo-1478737270239-2f02b77fc618"),
    alt: "Broadcast condenser microphone with pop filter in a dim recording studio",
  },
  "customer-marketing": {
    imageUrl: unsplash("photo-1552664730-d307ca884978"),
    alt: "Cross-functional team working through a plan at a whiteboard in a bright office",
  },
  "account-based-marketing": {
    imageUrl: unsplash("photo-1449824913935-59a10b8d2000"),
    alt: "Aerial view of a dense downtown street grid between corporate towers",
  },
  "integrated-creativity": {
    imageUrl: unsplash("photo-1541701494587-cb58502866ab"),
    alt: "Spectral paint burst suspended mid-explosion against a black void",
  },
  "social-influencer": {
    imageUrl: unsplash("photo-1529626455594-4ff0802cfb7e"),
    alt: "Editorial studio portrait of a model against a muted concrete backdrop",
  },
  "digital-performance": {
    imageUrl: unsplash("photo-1454165804606-c3d57bc86b40"),
    alt: "Analysts marking up performance documents between two laptops in daylight",
  },
  "sports-marketing": {
    imageUrl: unsplash("photo-1546519638-68e109498ffc"),
    alt: "Basketball dropping past the rim under arena lights with a darkened crowd behind",
  },
  "crm-and-loyalty": {
    imageUrl: unsplash("photo-1563013544-824ae1b704d3"),
    alt: "Member card held over a laptop during a checkout session",
  },
  "public-relations": {
    imageUrl: unsplash("photo-1459749411175-04bf5292ceea"),
    alt: "Concert hall bathed in warm stage light with the audience in silhouette",
  },
  "live-experiences": {
    imageUrl: unsplash("photo-1514320291840-2e0a9bf2a9ae"),
    alt: "Crowd seen from behind the stage at a night show, hands and lights raised",
  },
  "retail-activation": {
    imageUrl: unsplash("photo-1558769132-cb1aea458c5e"),
    alt: "Neutral-tone knitwear on a minimalist boutique rail beside dried pampas",
  },
};
