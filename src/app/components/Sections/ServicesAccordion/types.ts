/**
 * @file src/app/components/Sections/ServicesAccordion/types.ts
 * @description Types and complete content datasets for B2B Enterprise and B2C Consumer services.
 *              Contains verbatim agency capabilities, high-resolution editorial photography,
 *              and accessibility attributes for the Services Accordion Showcase.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type ServiceCategory = "B2B" | "B2C";

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  desc: string;
  imageUrl: string;
  alt: string;
}

/**
 * 8 Core B2B Enterprise Capabilities
 */
export const B2B_SERVICES: ServiceItem[] = [
  {
    id: "b2b-demand-generation",
    number: "01",
    title: "Demand Generation",
    desc: "Demand generation is the process of creating awareness and interest in your brand to attract potential customers and drive business growth. Through targeted campaigns, content marketing, SEO, social media, and paid advertising, we help businesses reach the right audience and build lasting trust. Using tools like Google Ads, HubSpot, and Google Analytics, we measure performance, optimize campaigns, and turn brand awareness into meaningful business opportunities.",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
    alt: "Monolithic architectural skyscraper representing enterprise scale and market presence",
  },
  {
    id: "b2b-integrated-marketing",
    number: "02",
    title: "Integrated Marketing",
    desc: "Integrated marketing brings all your marketing channels together to deliver a consistent brand message across every customer touchpoint. At Marca Ubi, we align digital marketing, social media, content, advertising, and brand communication into a unified strategy. This creates a seamless customer experience, strengthens brand recognition, improves campaign performance, and drives sustainable business growth.",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
    alt: "Collaborative marketing strategists in an executive war room",
  },
  {
    id: "b2b-corporate-communications",
    number: "03",
    title: "Corporate Communications",
    desc: "Corporate communications shape how your brand communicates with employees, customers, partners, and the public. At Marca Ubi, we develop clear messaging, communication strategies, and brand narratives that maintain consistency across every touchpoint. By aligning internal and external communications, we help businesses strengthen their reputation, build trust, and establish a distinctive, credible brand presence.",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200",
    alt: "Executive brand communication in an architectural boardroom setting",
  },
  {
    id: "b2b-social-influencer",
    number: "04",
    title: "Social & Influencer Marketing",
    desc: "Social and influencer marketing help brands build meaningful connections with their audiences through engaging content, strategic storytelling, and authentic collaborations. At Marca Ubi, we develop social media strategies, create compelling content, and collaborate with relevant creators to expand reach, strengthen brand awareness, and build lasting audience engagement.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    alt: "Dynamic digital art and cultural influence sculpture",
  },
  {
    id: "b2b-content-scale",
    number: "05",
    title: "Content & Scale",
    desc: "Content is the foundation of meaningful brand engagement and sustainable growth. At Marca Ubi, we create strategic, high-quality content that communicates your brand’s value, connects with your audience, and supports business objectives. Through consistent content production, targeted distribution, and performance-driven optimization, we help brands expand their reach, strengthen authority, and scale their digital presence.",
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200",
    alt: "Editorial typography and digital publication setup",
  },
  {
    id: "b2b-public-relations",
    number: "06",
    title: "Public Relations (PR)",
    desc: "Public relations shape how your brand is perceived by the public, media, and industry. At Marca Ubi, we develop strategic PR campaigns, media outreach, and brand storytelling to build credibility, strengthen reputation, and create meaningful visibility. By communicating the right message through the right channels, we help brands earn trust and establish a lasting presence in their markets.",
    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200",
    alt: "International press conference and corporate leadership podium",
  },
  {
    id: "b2b-customer-marketing",
    number: "07",
    title: "Customer Marketing",
    desc: "Customer marketing focuses on strengthening relationships with existing customers to encourage loyalty, retention, and long-term growth. At Marca Ubi, we develop personalized campaigns, customer engagement strategies, loyalty initiatives, and targeted communication that keep your audience connected to your brand. By nurturing existing relationships and creating meaningful experiences, we help businesses increase customer lifetime value and turn satisfied customers into lasting advocates.",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200",
    alt: "High-touch customer relationship consultation",
  },
  {
    id: "b2b-abm",
    number: "08",
    title: "Account-Based Marketing (ABM)",
    desc: "Account-Based Marketing focuses on targeting high-value businesses with personalized marketing strategies designed around their specific needs and goals. At Marca Ubi, we align research, tailored content, targeted campaigns, and sales-driven communication to engage key decision-makers. By focusing on the accounts that matter most, we help businesses build stronger relationships, improve conversion opportunities, and drive measurable growth.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    alt: "Strategic global data network for enterprise account targeting",
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
    desc: "Integrated creativity brings strategy, design, storytelling, and digital experiences together to create meaningful brand connections. At Marca Ubi, we combine creative thinking with purposeful execution to develop compelling campaigns, distinctive visuals, and engaging experiences that resonate with audiences. By aligning creativity across every touchpoint, we help brands stand out, inspire engagement, and leave a lasting impression.",
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200",
    alt: "High-concept neon art installation symbolizing consumer creativity",
  },
  {
    id: "b2c-social-influencer",
    number: "02",
    title: "Social & Influencer",
    desc: "Social and influencer marketing help brands connect with consumers through engaging content, relatable storytelling, and authentic creator partnerships. At Marca Ubi, we develop platform-specific strategies and creative campaigns that capture attention, inspire conversations, and build stronger audience relationships. By combining social storytelling with the right influencer collaborations, we help brands increase visibility, drive engagement, and turn followers into loyal customers.",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200",
    alt: "Authentic youth creator culture and social collaboration",
  },
  {
    id: "b2c-digital-performance",
    number: "03",
    title: "Digital Performance",
    desc: "Digital performance focuses on maximizing your brand’s online reach, engagement, and conversions through data-driven strategies. At Marca Ubi, we combine paid advertising, SEO, conversion optimization, and performance analytics to connect brands with the right audiences. By continuously measuring and refining campaigns, we help businesses improve marketing efficiency, drive measurable results, and achieve sustainable digital growth.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    alt: "Interactive visual data visualization dashboard for consumer conversions",
  },
  {
    id: "b2c-sports-marketing",
    number: "04",
    title: "Sports Marketing",
    desc: "Sports marketing connects brands with passionate audiences through sporting events, athlete partnerships, sponsorships, and engaging campaigns. At Marca Ubi, we create strategic sports marketing experiences that strengthen brand visibility, inspire fan engagement, and build meaningful connections between brands and sports communities. By combining creativity with authentic partnerships, we help brands turn sporting moments into lasting impact.",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=1200",
    alt: "Iconic athletic stadium under high-intensity arena lights",
  },
  {
    id: "b2c-crm-loyalty",
    number: "05",
    title: "CRM & Loyalty",
    desc: "CRM and loyalty strategies help brands build stronger customer relationships and encourage repeat business. At Marca Ubi, we combine customer relationship management, personalized communication, and loyalty programs to create meaningful experiences at every stage of the customer journey. By understanding customer needs and rewarding engagement, we help brands improve retention, strengthen trust, and turn one-time buyers into loyal advocates.",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1200",
    alt: "Bespoke luxury tactile unboxing and customer appreciation",
  },
  {
    id: "b2c-public-relations",
    number: "06",
    title: "Public Relations (PR)",
    desc: "Public relations help brands build credibility, shape public perception, and create meaningful connections with their audiences. At Marca Ubi, we develop strategic PR campaigns, media outreach, and compelling brand stories that strengthen reputation and increase visibility. Through relevant media coverage and authentic communication, we help brands earn consumer trust, stand out in competitive markets, and build lasting recognition.",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
    alt: "Cultural red carpet premiere event with spotlights",
  },
  {
    id: "b2c-live-experiences",
    number: "07",
    title: "Live Experiences",
    desc: "Live experiences bring brands to life through immersive events, activations, and memorable real-world interactions. At Marca Ubi, we design and execute engaging brand experiences that connect with audiences beyond the digital space. From product launches and experiential campaigns to interactive events, we help brands create meaningful moments that inspire participation, strengthen emotional connections, and leave a lasting impression.",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200",
    alt: "Immersive live brand festival with spatial light projections",
  },
  {
    id: "b2c-retail-activation",
    number: "08",
    title: "Retail Activation",
    desc: "Retail activation brings brands closer to consumers through engaging in-store experiences, product demonstrations, promotional campaigns, and interactive displays. At Marca Ubi, we create strategic retail activations that capture attention, encourage product discovery, and influence purchasing decisions. By transforming retail spaces into meaningful brand experiences, we help businesses increase engagement, drive sales, and build stronger connections with customers.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
    alt: "Architectural luxury retail flagship boutique environment",
  },
];
