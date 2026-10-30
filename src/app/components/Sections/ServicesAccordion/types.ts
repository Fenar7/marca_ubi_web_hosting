/**
 * @file src/app/components/Sections/ServicesAccordion/types.ts
 * @description Types and complete content datasets for B2B Enterprise and B2C Consumer services.
 *              Contains concise executive agency capabilities, high-resolution editorial photography,
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
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
    alt: "Monolithic architectural skyscraper representing enterprise scale and market presence",
    videoSrc: "/videos/services/service-01.mp4",
    videoPoster: "/videos/services/service-01.webp",
  },
  {
    id: "b2b-integrated-marketing",
    number: "02",
    title: "Integrated Marketing",
    desc: "Unifying digital, social, and brand communications into a cohesive strategy that delivers consistent customer experiences and accelerates growth.",
    services: ["Marketing strategy", "Campaign planning", "Channel orchestration", "Brand communications", "Performance reporting"],
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
    alt: "Collaborative marketing strategists in an executive war room",
    videoSrc: "/videos/services/service-02.mp4",
    videoPoster: "/videos/services/service-02.webp",
  },
  {
    id: "b2b-corporate-communications",
    number: "03",
    title: "Corporate Communications",
    desc: "Strategic internal and external messaging frameworks that strengthen executive credibility, corporate reputation, and stakeholder alignment.",
    services: ["Corporate narrative", "Executive communications", "Internal communications", "Stakeholder messaging", "Reputation management"],
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200",
    alt: "Executive brand communication in an architectural boardroom setting",
    videoSrc: "/videos/services/service-03.mp4",
    videoPoster: "/videos/services/service-03.webp",
  },
  {
    id: "b2b-social-influencer",
    number: "04",
    title: "Social & Influencer Marketing",
    desc: "Purposeful B2B storytelling and credible creator collaborations that expand industry reach and cultivate meaningful audience engagement.",
    services: ["Social strategy", "Creator partnerships", "Content production", "Community management", "Campaign measurement"],
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    alt: "Dynamic digital art and cultural influence sculpture",
    videoSrc: "/videos/services/service-04.mp4",
    videoPoster: "/videos/services/service-04.webp",
  },
  {
    id: "b2b-content-scale",
    number: "05",
    title: "Content & Scale",
    desc: "High-impact editorial content engines and targeted distribution frameworks that elevate brand authority and scale digital visibility.",
    services: ["Content strategy", "Editorial production", "Thought leadership", "Content distribution", "Search optimisation"],
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",
    alt: "Editorial typography and digital publication setup",
    videoSrc: "/videos/services/service-05.mp4",
    videoPoster: "/videos/services/service-05.webp",
  },
  {
    id: "b2b-public-relations",
    number: "06",
    title: "Public Relations (PR)",
    desc: "Strategic media relations, executive positioning, and narrative placement that secure earned trust and authoritative industry presence.",
    services: ["Media relations", "Press office", "Executive profiling", "Thought leadership", "Issues communications"],
    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200",
    alt: "International press conference and corporate leadership podium",
    videoSrc: "/videos/services/service-06.mp4",
    videoPoster: "/videos/services/service-06.webp",
  },
  {
    id: "b2b-customer-marketing",
    number: "07",
    title: "Customer Marketing",
    desc: "Retention programs, advocacy initiatives, and personalized customer touchpoints designed to expand lifetime value and build long-term loyalty.",
    services: ["Customer advocacy", "Retention campaigns", "Lifecycle communications", "Case studies", "Customer events"],
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200",
    alt: "High-touch customer relationship consultation",
    videoSrc: "/videos/services/service-07.mp4",
    videoPoster: "/videos/services/service-07.webp",
  },
  {
    id: "b2b-abm",
    number: "08",
    title: "Account-Based Marketing (ABM)",
    desc: "Bespoke research, tailored content, and hyper-targeted outreach engineered to engage key decision-makers across high-priority enterprise accounts.",
    services: ["Account research", "Audience mapping", "Personalised campaigns", "Sales enablement", "Account measurement"],
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    alt: "Strategic global data network for enterprise account targeting",
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
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200",
    alt: "High-concept neon art installation symbolizing consumer creativity",
    videoSrc: "/videos/services/service-09.mp4",
    videoPoster: "/videos/services/service-09.webp",
  },
  {
    id: "b2c-social-influencer",
    number: "02",
    title: "Social & Influencer",
    desc: "Platform-native campaigns and authentic creator partnerships that spark cultural conversations, inspire discovery, and turn followers into advocates.",
    services: ["Social strategy", "Creator partnerships", "Platform content", "Community management", "Campaign reporting"],
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200",
    alt: "Authentic youth creator culture and social collaboration",
    videoSrc: "/videos/services/service-10.mp4",
    videoPoster: "/videos/services/service-10.webp",
  },
  {
    id: "b2c-digital-performance",
    number: "03",
    title: "Digital Performance",
    desc: "Data-driven paid acquisition, search optimization, and conversion analytics engineered to maximize consumer reach and efficiency.",
    services: ["Paid search and social", "SEO", "Conversion optimisation", "Analytics setup", "Performance reporting"],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    alt: "Interactive visual data visualization dashboard for consumer conversions",
    videoSrc: "/videos/services/service-11.mp4",
    videoPoster: "/videos/services/service-11.webp",
  },
  {
    id: "b2c-sports-marketing",
    number: "04",
    title: "Sports Marketing",
    desc: "High-visibility athlete partnerships, sponsorships, and experiential moments that connect brands authentically with passionate fan communities.",
    services: ["Partnership strategy", "Athlete and talent activations", "Sponsorship campaigns", "Fan engagement", "Measurement"],
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=1200",
    alt: "Iconic athletic stadium under high-intensity arena lights",
    videoSrc: "/videos/services/service-12.mp4",
    videoPoster: "/videos/services/service-12.webp",
  },
  {
    id: "b2c-crm-loyalty",
    number: "05",
    title: "CRM & Loyalty",
    desc: "Tailored lifecycle marketing, automated retention journeys, and rewarding loyalty programs that turn one-time shoppers into lifelong customers.",
    services: ["CRM strategy", "Lifecycle journeys", "Loyalty programmes", "Marketing automation", "Retention analysis"],
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1200",
    alt: "Bespoke luxury tactile unboxing and customer appreciation",
    videoSrc: "/videos/services/service-13.mp4",
    videoPoster: "/videos/services/service-13.webp",
  },
  {
    id: "b2c-public-relations",
    number: "06",
    title: "Public Relations (PR)",
    desc: "High-profile press outreach and cultural storytelling that earn consumer credibility, secure premier media coverage, and build brand fame.",
    services: ["Media relations", "Press events", "Product launches", "Cultural storytelling", "Reputation management"],
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
    alt: "Cultural red carpet premiere event with spotlights",
    videoSrc: "/videos/services/service-14.mp4",
    videoPoster: "/videos/services/service-14.webp",
  },
  {
    id: "b2c-live-experiences",
    number: "07",
    title: "Live Experiences",
    desc: "Immersive activations, spatial pop-ups, and premier product launches that create unforgettable real-world connections between brands and people.",
    services: ["Experience strategy", "Event creative", "Spatial design", "Live production", "Audience engagement"],
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200",
    alt: "Immersive live brand festival with spatial light projections",
    videoSrc: "/videos/services/service-15.mp4",
    videoPoster: "/videos/services/service-15.webp",
  },
  {
    id: "b2c-retail-activation",
    number: "08",
    title: "Retail Activation",
    desc: "Dynamic in-store displays, merchandising, and experiential activations designed to captivate shoppers and drive point-of-sale conversion.",
    services: ["Retail strategy", "Point-of-sale creative", "Visual merchandising", "In-store experiences", "Sell-through measurement"],
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
    alt: "Architectural luxury retail flagship boutique environment",
    videoSrc: "/videos/services/service-16.mp4",
    videoPoster: "/videos/services/service-16.webp",
  },
];
