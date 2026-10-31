/**
 * @file src/app/components/Sections/ServicesAccordion/types.ts
 * @description Types and complete content datasets for B2B Enterprise and B2C Consumer services.
 *              Contains concise executive agency capabilities, 2400px ultra-high-resolution editorial photography,
 *              and accessibility attributes for the Services Accordion Showcase.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type ServiceCategory = "B2B" | "B2C";

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  desc: string;
  services: string[];
  imageUrl: string;
  alt: string;
  videoSrc: string;
  videoPoster: string;
}

/**
 * 8 Core B2B Enterprise Capabilities
 */
export const B2B_SERVICES: ServiceItem[] = [
  {
    id: "b2b-demand-generation",
    number: "01",
    title: "Demand Generation",
    desc: "Targeted multi-channel campaigns, paid media, and SEO that build market trust and convert brand awareness into high-value enterprise pipeline.",
    services: ["Paid media strategy", "Search engine marketing", "Lead generation", "Campaign optimisation", "Pipeline reporting"],
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=85&w=2400",
    alt: "Monolithic architectural skyscraper reflecting metropolitan transit lights",
    videoSrc: "/videos/services/service-01.mp4",
    videoPoster: "/videos/services/service-01.webp",
  },
  {
    id: "b2b-integrated-marketing",
    number: "02",
    title: "Integrated Marketing",
    desc: "Unifying digital, social, and brand communications into a cohesive strategy that delivers consistent customer experiences and accelerates growth.",
    services: ["Marketing strategy", "Campaign planning", "Channel orchestration", "Brand communications", "Performance reporting"],
    imageUrl: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=85&w=2400",
    alt: "Executive strategy session in a glass boardroom reviewing campaign architecture",
    videoSrc: "/videos/services/service-02.mp4",
    videoPoster: "/videos/services/service-02.webp",
  },
  {
    id: "b2b-corporate-communications",
    number: "03",
    title: "Corporate Communications",
    desc: "Strategic internal and external messaging frameworks that strengthen executive credibility, corporate reputation, and stakeholder alignment.",
    services: ["Corporate narrative", "Executive communications", "Internal communications", "Stakeholder messaging", "Reputation management"],
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=85&w=2400",
    alt: "Keynote speaker on a dramatic dark stage under architectural spotlights",
    videoSrc: "/videos/services/service-03.mp4",
    videoPoster: "/videos/services/service-03.webp",
  },
  {
    id: "b2b-social-influencer",
    number: "04",
    title: "Social & Influencer Marketing",
    desc: "Purposeful B2B storytelling and credible creator collaborations that expand industry reach and cultivate meaningful audience engagement.",
    services: ["Social strategy", "Creator partnerships", "Content production", "Community management", "Campaign measurement"],
    imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=85&w=2400",
    alt: "High-production digital video editing suite and creator workflow",
    videoSrc: "/videos/services/service-04.mp4",
    videoPoster: "/videos/services/service-04.webp",
  },
  {
    id: "b2b-content-scale",
    number: "05",
    title: "Content & Scale",
    desc: "High-impact editorial content engines and targeted distribution frameworks that elevate brand authority and scale digital visibility.",
    services: ["Content strategy", "Editorial production", "Thought leadership", "Content distribution", "Search optimisation"],
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=85&w=2400",
    alt: "High-speed optical data network and scalable digital distribution infrastructure",
    videoSrc: "/videos/services/service-05.mp4",
    videoPoster: "/videos/services/service-05.webp",
  },
  {
    id: "b2b-public-relations",
    number: "06",
    title: "Public Relations (PR)",
    desc: "Strategic media relations, executive positioning, and narrative placement that secure earned trust and authoritative industry presence.",
    services: ["Media relations", "Press office", "Executive profiling", "Thought leadership", "Issues communications"],
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=85&w=2400",
    alt: "International executive press conference podium with microphone battery",
    videoSrc: "/videos/services/service-06.mp4",
    videoPoster: "/videos/services/service-06.webp",
  },
  {
    id: "b2b-customer-marketing",
    number: "07",
    title: "Customer Marketing",
    desc: "Retention programs, advocacy initiatives, and personalized customer touchpoints designed to expand lifetime value and build long-term loyalty.",
    services: ["Customer advocacy", "Retention campaigns", "Lifecycle communications", "Case studies", "Customer events"],
    imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=85&w=2400",
    alt: "Executive partnership agreement and corporate relationship handshake",
    videoSrc: "/videos/services/service-07.mp4",
    videoPoster: "/videos/services/service-07.webp",
  },
  {
    id: "b2b-abm",
    number: "08",
    title: "Account-Based Marketing (ABM)",
    desc: "Bespoke research, tailored content, and hyper-targeted outreach engineered to engage key decision-makers across high-priority enterprise accounts.",
    services: ["Account research", "Audience mapping", "Personalised campaigns", "Sales enablement", "Account measurement"],
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=85&w=2400",
    alt: "Corporate financial district avenue and headquarters high-rises at twilight",
    videoSrc: "/videos/services/service-08.mp4",
    videoPoster: "/videos/services/service-08.webp",
  },
];

/**
 * 8 Core B2C Consumer Capabilities
 */
export const B2C_SERVICES: ServiceItem[] = [
  {
    id: "b2c-integrated-creativity",
    number: "01",
    title: "Integrated Creativity",
    desc: "Fusing bold design, strategic narrative, and digital experiences across touchpoints to make consumer brands culturally relevant and memorable.",
    services: ["Brand strategy", "Creative platform", "Campaign development", "Design systems", "Digital experiences"],
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=85&w=2400",
    alt: "Avant-garde fluid art with dark chromatic ink billows in an obsidian void",
    videoSrc: "/videos/services/service-09.mp4",
    videoPoster: "/videos/services/service-09.webp",
  },
  {
    id: "b2c-social-influencer",
    number: "02",
    title: "Social & Influencer",
    desc: "Platform-native campaigns and authentic creator partnerships that spark cultural conversations, inspire discovery, and turn followers into advocates.",
    services: ["Social strategy", "Creator partnerships", "Platform content", "Community management", "Campaign reporting"],
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=85&w=2400",
    alt: "High-fashion editorial model under dynamic studio strobe lighting",
    videoSrc: "/videos/services/service-10.mp4",
    videoPoster: "/videos/services/service-10.webp",
  },
  {
    id: "b2c-digital-performance",
    number: "03",
    title: "Digital Performance",
    desc: "Data-driven paid acquisition, search optimization, and conversion analytics engineered to maximize consumer reach and efficiency.",
    services: ["Paid search and social", "SEO", "Conversion optimisation", "Analytics setup", "Performance reporting"],
    imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=85&w=2400",
    alt: "Real-time analytics telemetry HUD and financial performance data",
    videoSrc: "/videos/services/service-11.mp4",
    videoPoster: "/videos/services/service-11.webp",
  },
  {
    id: "b2c-sports-marketing",
    number: "04",
    title: "Sports Marketing",
    desc: "High-visibility athlete partnerships, sponsorships, and experiential moments that connect brands authentically with passionate fan communities.",
    services: ["Partnership strategy", "Athlete and talent activations", "Sponsorship campaigns", "Fan engagement", "Measurement"],
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=85&w=2400",
    alt: "Cinematic athlete in high-speed motion along a floodlit track",
    videoSrc: "/videos/services/service-12.mp4",
    videoPoster: "/videos/services/service-12.webp",
  },
  {
    id: "b2c-crm-loyalty",
    number: "05",
    title: "CRM & Loyalty",
    desc: "Tailored lifecycle marketing, automated retention journeys, and rewarding loyalty programs that turn one-time shoppers into lifelong customers.",
    services: ["CRM strategy", "Lifecycle journeys", "Loyalty programmes", "Marketing automation", "Retention analysis"],
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=85&w=2400",
    alt: "Tactile obsidian luxury membership card transaction",
    videoSrc: "/videos/services/service-13.mp4",
    videoPoster: "/videos/services/service-13.webp",
  },
  {
    id: "b2c-public-relations",
    number: "06",
    title: "Public Relations (PR)",
    desc: "High-profile press outreach and cultural storytelling that earn consumer credibility, secure premier media coverage, and build brand fame.",
    services: ["Media relations", "Press events", "Product launches", "Cultural storytelling", "Reputation management"],
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=85&w=2400",
    alt: "Cultural gala premiere with rotating atmospheric stage spotlights",
    videoSrc: "/videos/services/service-14.mp4",
    videoPoster: "/videos/services/service-14.webp",
  },
  {
    id: "b2c-live-experiences",
    number: "07",
    title: "Live Experiences",
    desc: "Immersive activations, spatial pop-ups, and premier product launches that create unforgettable real-world connections between brands and people.",
    services: ["Experience strategy", "Event creative", "Spatial design", "Live production", "Audience engagement"],
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=85&w=2400",
    alt: "Immersive live brand festival with synchronized spatial lighting",
    videoSrc: "/videos/services/service-15.mp4",
    videoPoster: "/videos/services/service-15.webp",
  },
  {
    id: "b2c-retail-activation",
    number: "08",
    title: "Retail Activation",
    desc: "Dynamic in-store displays, merchandising, and experiential activations designed to captivate shoppers and drive point-of-sale conversion.",
    services: ["Retail strategy", "Point-of-sale creative", "Visual merchandising", "In-store experiences", "Sell-through measurement"],
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=85&w=2400",
    alt: "Tactile designer apparel selection in a minimalist luxury boutique",
    videoSrc: "/videos/services/service-16.mp4",
    videoPoster: "/videos/services/service-16.webp",
  },
];
