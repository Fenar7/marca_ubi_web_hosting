# Services Accordion Section Architecture & Master Plan (B2B & B2C)

**Document ID**: `docs/services_accordion/services_accordion_master_plan.md`  
**Target References**:
- `Screenshot 2026-10-27 150837.png` (Current About section showing numbers)
- `Screenshot 2026-10-27 150824.png` (Horizontal multi-column accordion resting state with editorial imagery)
- `Screenshot 2026-10-27 151028.png` (Horizontal multi-column accordion hovered/active state with expanded copy)
**Target Files**:
- `src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx` (New component)
- `src/app/components/Sections/ServicesAccordion/ServicesAccordion.module.scss` (New component styles)
- `src/app/components/Sections/ServicesAccordion/types.ts` (Data structures and service definitions)
- `src/app/components/Sections/AboutCurtain.tsx` (Integration right after the Quantified Delivery Scope numbers)
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)

---

## 1. Executive Summary & Design Read

Following the Quantified Delivery Scope metrics in View 02 (`AboutCurtain.tsx`), we are introducing an interactive, editorial **Services Accordion Showcase** supporting Marca Ubi's dual commercial practices: **B2B Enterprise** and **B2C Consumer**.

```yaml
Design Read:
  dial: ENERGY 2 / RHYTHM 2 / MOTION 1
  canvas: #ffffff (White Curtain container) / #0a0a0a (Accordion card active stage)
  typography: Circular XX Book (400) & Medium (500)
  accent: #ea002a (Brand Red for indicators, active pill, and directional cues)
```

---

## 2. Component Architecture & Structural Layout

```
src/app/components/Sections/ServicesAccordion/
├── ServicesAccordion.tsx         # Core client interactive component
├── ServicesAccordion.module.scss  # Smooth flex-grow transitions & Scrim gradients
└── types.ts                      # B2B & B2C data models and photography mappings
```

### Visual Specifications (`Screenshot 150824` & `Screenshot 151028` Parity)
1. **Section Header & Segmented Pill Switch**:
   - Sub-kicker: `02 / PRACTICE SPECTRUM`
   - Segmented Toggle:
     - `B2B Enterprise (8)`
     - `B2C Consumer (8)`
   - Active state: Pill switch with `#0a0a0a` backdrop, `#ea002a` subtle badge, and crisp white typography.
2. **Horizontal Accordion Strip**:
   - Container height: `520px` with `overflow: hidden; border-radius: 4px; display: flex; gap: 4px;`
   - **Resting Column (`flex: 1`)**:
     - High-resolution editorial photography.
     - Dark bottom scrim gradient (`linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)`).
     - Bottom-aligned Title in Circular XX Medium (`clamp(1.1rem, 1.3vw, 1.35rem)`), white `#ffffff`.
     - Monospace numeric badge (`01`, `02`, etc.) in `$font-mono` at the bottom right.
   - **Active Hovered Column (`flex: 3.2`)**:
     - Smooth cubic bezier transition: `flex 0.5s cubic-bezier(0.16, 1, 0.3, 1)`.
     - Dark solid scrim (`rgba(10, 10, 10, 0.94)`) reveals full editorial copy.
     - Top-aligned Title: Circular XX Medium (`1.35rem`), white, with leading red accent line.
     - Full Description: Circular XX Book (`0.95rem`), line-height `1.65`, `$client-text-secondary-light` (`rgba(255, 255, 255, 0.85)`).
     - Trailing Accent: Brand red directional chevron `→` (`#ea002a`) positioned at bottom.
3. **Mobile Reflow**:
   - Under `768px`: Reflows into a horizontal touch-snap carousel or vertical tap-to-expand accordion stack with 48px touch targets.

---

## 3. Complete Content Matrix

### Stream A: B2B Enterprise (8 Services)
1. **Demand Generation**
   - *Image*: Modern architectural glass skyscrapers / strategy room (`photo-1486406146926-c627a92ad1ab`)
   - *Copy*: Demand generation is the process of creating awareness and interest in your brand to attract potential customers and drive business growth. Through targeted campaigns, content marketing, SEO, social media, and paid advertising, we help businesses reach the right audience and build lasting trust. Using tools like Google Ads, HubSpot, and Google Analytics, we measure performance, optimize campaigns, and turn brand awareness into meaningful business opportunities.
2. **Integrated Marketing**
   - *Image*: Collaborative enterprise war room (`photo-1522071820081-009f0129c71c`)
   - *Copy*: Integrated marketing brings all your marketing channels together to deliver a consistent brand message across every customer touchpoint. At Marca Ubi, we align digital marketing, social media, content, advertising, and brand communication into a unified strategy. This creates a seamless customer experience, strengthens brand recognition, improves campaign performance, and drives sustainable business growth.
3. **Corporate Communications**
   - *Image*: Executive corporate communications (`photo-1507679799987-c73779587ccf`)
   - *Copy*: Corporate communications shape how your brand communicates with employees, customers, partners, and the public. At Marca Ubi, we develop clear messaging, communication strategies, and brand narratives that maintain consistency across every touchpoint. By aligning internal and external communications, we help businesses strengthen their reputation, build trust, and establish a distinctive, credible brand presence.
4. **Social & Influencer Marketing**
   - *Image*: Cultural media studio set (`photo-1618005182384-a83a8bd57fbe`)
   - *Copy*: Social and influencer marketing help brands build meaningful connections with their audiences through engaging content, strategic storytelling, and authentic collaborations. At Marca Ubi, we develop social media strategies, create compelling content, and collaborate with relevant creators to expand reach, strengthen brand awareness, and build lasting audience engagement.
5. **Content & Scale**
   - *Image*: Editorial publishing and typography systems (`photo-1499750310107-5fef28a66643`)
   - *Copy*: Content is the foundation of meaningful brand engagement and sustainable growth. At Marca Ubi, we create strategic, high-quality content that communicates your brand’s value, connects with your audience, and supports business objectives. Through consistent content production, targeted distribution, and performance-driven optimization, we help brands expand their reach, strengthen authority, and scale their digital presence.
6. **Public Relations (PR)**
   - *Image*: Global media PR conference (`photo-1557804506-669a67965ba0`)
   - *Copy*: Public relations shape how your brand is perceived by the public, media, and industry. At Marca Ubi, we develop strategic PR campaigns, media outreach, and brand storytelling to build credibility, strengthen reputation, and create meaningful visibility. By communicating the right message through the right channels, we help brands earn trust and establish a lasting presence in their markets.
7. **Customer Marketing**
   - *Image*: Strategic customer engagement lounge (`photo-1556761175-5973dc0f32e7`)
   - *Copy*: Customer marketing focuses on strengthening relationships with existing customers to encourage loyalty, retention, and long-term growth. At Marca Ubi, we develop personalized campaigns, customer engagement strategies, loyalty initiatives, and targeted communication that keep your audience connected to your brand. By nurturing existing relationships and creating meaningful experiences, we help businesses increase customer lifetime value and turn satisfied customers into lasting advocates.
8. **Account-Based Marketing (ABM)**
   - *Image*: Precision enterprise network architecture (`photo-1451187580459-43490279c0fa`)
   - *Copy*: Account-Based Marketing focuses on targeting high-value businesses with personalized marketing strategies designed around their specific needs and goals. At Marca Ubi, we align research, tailored content, targeted campaigns, and sales-driven communication to engage key decision-makers. By focusing on the accounts that matter most, we help businesses build stronger relationships, improve conversion opportunities, and drive measurable growth.

---

### Stream B: B2C Consumer (8 Services)
1. **Integrated Creativity**
   - *Image*: Haute couture artistic lighting (`photo-1550684848-fac1c5b4e853`)
   - *Copy*: Integrated creativity brings strategy, design, storytelling, and digital experiences together to create meaningful brand connections. At Marca Ubi, we combine creative thinking with purposeful execution to develop compelling campaigns, distinctive visuals, and engaging experiences that resonate with audiences. By aligning creativity across every touchpoint, we help brands stand out, inspire engagement, and leave a lasting impression.
2. **Social & Influencer**
   - *Image*: Creator community culture (`photo-1529156069898-49953e39b3ac`)
   - *Copy*: Social and influencer marketing help brands connect with consumers through engaging content, relatable storytelling, and authentic creator partnerships. At Marca Ubi, we develop platform-specific strategies and creative campaigns that capture attention, inspire conversations, and build stronger audience relationships. By combining social storytelling with the right influencer collaborations, we help brands increase visibility, drive engagement, and turn followers into loyal customers.
3. **Digital Performance**
   - *Image*: Immersive interactive performance canvas (`photo-1551288049-bebda4e38f71`)
   - *Copy*: Digital performance focuses on maximizing your brand’s online reach, engagement, and conversions through data-driven strategies. At Marca Ubi, we combine paid advertising, SEO, conversion optimization, and performance analytics to connect brands with the right audiences. By continuously measuring and refining campaigns, we help businesses improve marketing efficiency, drive measurable results, and achieve sustainable digital growth.
4. **Sports Marketing**
   - *Image*: Athletic stadium floodlights (`photo-1517649763962-0c623266ddc0`)
   - *Copy*: Sports marketing connects brands with passionate audiences through sporting events, athlete partnerships, sponsorships, and engaging campaigns. At Marca Ubi, we create strategic sports marketing experiences that strengthen brand visibility, inspire fan engagement, and build meaningful connections between brands and sports communities. By combining creativity with authentic partnerships, we help brands turn sporting moments into lasting impact.
5. **CRM & Loyalty**
   - *Image*: Luxury tactile packaging and membership concierge (`photo-1563013544-824ae1b704d3`)
   - *Copy*: CRM and loyalty strategies help brands build stronger customer relationships and encourage repeat business. At Marca Ubi, we combine customer relationship management, personalized communication, and loyalty programs to create meaningful experiences at every stage of the customer journey. By understanding customer needs and rewarding engagement, we help brands improve retention, strengthen trust, and turn one-time buyers into loyal advocates.
6. **Public Relations (PR)**
   - *Image*: Cultural red carpet spotlight (`photo-1511578314322-379afb476865`)
   - *Copy*: Public relations help brands build credibility, shape public perception, and create meaningful connections with their audiences. At Marca Ubi, we develop strategic PR campaigns, media outreach, and compelling brand stories that strengthen reputation and increase visibility. Through relevant media coverage and authentic communication, we help brands earn consumer trust, stand out in competitive markets, and build lasting recognition.
7. **Live Experiences**
   - *Image*: Experiential lighting and spatial activation (`photo-1492684223066-81342ee5ff30`)
   - *Copy*: Live experiences bring brands to life through immersive events, activations, and memorable real-world interactions. At Marca Ubi, we design and execute engaging brand experiences that connect with audiences beyond the digital space. From product launches and experiential campaigns to interactive events, we help brands create meaningful moments that inspire participation, strengthen emotional connections, and leave a lasting impression.
8. **Retail Activation**
   - *Image*: Minimalist luxury retail flagship space (`photo-1441986300917-64674bd600d8`)
   - *Copy*: Retail activation brings brands closer to consumers through engaging in-store experiences, product demonstrations, promotional campaigns, and interactive displays. At Marca Ubi, we create strategic retail activations that capture attention, encourage product discovery, and influence purchasing decisions. By transforming retail spaces into meaningful brand experiences, we help businesses increase engagement, drive sales, and build stronger connections with customers.

---

## 4. Technical Implementation Steps

1. **Create `src/app/components/Sections/ServicesAccordion/`**:
   - `types.ts`: Define `ServiceCategory = "B2B" | "B2C"`, `ServiceItem` interface, and typed data sets with production Unsplash URLs.
   - `ServicesAccordion.tsx`: Implement the segmented toggle (`activeCategory`), hover/active index state (`activeItemIndex`), keyboard navigation, and responsive touch handling.
   - `ServicesAccordion.module.scss`: Implement the accordion CSS grid/flex mechanics, smooth `flex-grow` easing, high-contrast dark scrims, and mobile breakpoint rules.
2. **Integrate into `src/app/components/Sections/AboutCurtain.tsx`**:
   - Mount `<ServicesAccordion />` directly after `{/* 4 Metric Odometers with Tabular Numerals */}` in the right column.
3. **Delivery & PR Update**:
   - Stage and commit authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - Push to `showcase/homepage-works-cutout-and-portfolio-showcase`.
   - Update [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) description with the updated 4-Block Delivery Gate Report.
