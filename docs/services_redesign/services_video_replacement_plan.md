# Services Accordion Cinematic Video Replacement Plan

**Scope**: Complete replacement of all 16 background video loops and poster frames in `ServicesAccordion` (`src/app/components/Sections/ServicesAccordion/`).  
**License**: Free commercial use without attribution requirement (vetted Mixkit / Pexels CDN catalog).  
**Aesthetic Language**: Swiss Dark Luxury, Architectural Geometry, Executive Prestige (`DESIGN.md`).

---

## 1. Root Cause Analysis of Previous Clips
The previous video manifest sequentially scraped raw unverified asset numbers (`4781, 4784, 4807...`), which resulted in mismatched and inappropriate content (e.g. a birthday cake for Demand Generation, a street mime for Integrated Marketing, casual vlogs for Corporate Communications).

---

## 2. Vetted Visual Concept & Asset Mapping (All 16 Services)

### B2B Enterprise Capabilities (01 – 08)

| # | Service Name | Visual Concept & Subject Matter | Asset Source & CDN URL |
|---|---|---|---|
| **01** | **Demand Generation** | Night architectural tracking of corporate glass skyscrapers reflecting metropolitan transit lights; denotes enterprise scale and inbound market pipeline. | `https://assets.mixkit.co/videos/49845/49845-720.mp4` |
| **02** | **Integrated Marketing** | Executive strategy session in a glass boardroom reviewing omnichannel campaign architecture under moody downlighting; replaces the street mime. | `https://assets.mixkit.co/videos/46680/46680-720.mp4` |
| **03** | **Corporate Communications** | Keynote leader speaking on a dramatic dark stage under architectural spotlights; represents executive narrative authority. | `https://assets.mixkit.co/videos/13222/13222-720.mp4` |
| **04** | **Social & Influencer (B2B)** | Video editing studio close-up tracking shot: creative producer grading high-production footage on an OLED grading monitor. | `https://assets.mixkit.co/videos/44074/44074-720.mp4` |
| **05** | **Content & Scale** | High-velocity data stream tunnel through optical network lines and digital cubes; symbolizes scalable editorial content syndication. | `https://assets.mixkit.co/videos/12268/12268-720.mp4` |
| **06** | **Public Relations (PR)** | International executive press conference: podium with microphone array and dynamic flashbulb illumination. | `https://assets.mixkit.co/videos/24357/24357-720.mp4` |
| **07** | **Customer Marketing** | High-level executive partnership: close-up handshake in dark tailored suits during a closed-door agreement; denotes retention and trust. | `https://assets.mixkit.co/videos/15716/15716-720.mp4` |
| **08** | **Account-Based Marketing (ABM)** | Abstract 3D digital network mesh with glowing interconnection nodes on a deep obsidian sphere; symbolizes precision account targeting. | `https://assets.mixkit.co/videos/18000/18000-720.mp4` |

---

### B2C Consumer Capabilities (09 – 16)

| # | Service Name | Visual Concept & Subject Matter | Asset Source & CDN URL |
|---|---|---|---|
| **09** | **Integrated Creativity** | Avant-garde fluid art: organic dark ink and chromatic fluid billowing in an obsidian void; represents boundary-pushing consumer design. | `https://assets.mixkit.co/videos/44818/44818-720.mp4` |
| **10** | **Social & Influencer (B2C)** | High-fashion editorial studio shoot: model turning to camera under rotating studio strobe lights and flashes; drives viral consumer discovery. | `https://assets.mixkit.co/videos/50641/50641-720.mp4` |
| **11** | **Digital Performance** | Real-time analytics telemetry HUD: glowing tabular figures, delta indicators, and candlestick data streams on dark glass. | `https://assets.mixkit.co/videos/47796/47796-720.mp4` |
| **12** | **Sports Marketing** | Cinematic athlete in high-speed motion: runner passing above the camera along a track under moody floodlights; captures athletic prestige. | `https://assets.mixkit.co/videos/32807/32807-720.mp4` |
| **13** | **CRM & Loyalty** | Tactile luxury unboxing & payment: obsidian luxury membership card tapped on smartphone terminal; represents loyalty journeys and automated retention. | `https://assets.mixkit.co/videos/18264/18264-720.mp4` |
| **14** | **Public Relations (PR - Consumer)** | Cultural gala premiere: rotating volumetric spotlights cutting through the dark with warm bokeh halos; red-carpet prestige and brand fame. | `https://assets.mixkit.co/videos/32591/32591-720.mp4` |
| **15** | **Live Experiences** | High-energy spatial festival activation: crowd silhouettes with hands raised under synchronized atmospheric laser lights and haze. | `https://assets.mixkit.co/videos/48510/48510-720.mp4` |
| **16** | **Retail Activation** | Architectural luxury retail: tactile hand browsing through designer apparel on a minimalist matte-black boutique rack; drives point-of-sale conversion. | `https://assets.mixkit.co/videos/23327/23327-720.mp4` |

*All 16 video URLs have been checked via HTTP HEAD and verified active (HTTP 200 OK).*

---

## 3. Technical Asset Pipeline & Optimization Standards

1. **H.264 MP4 with Fast Start**:
   - Audio stripped completely via `-an` (eliminates audio decode overhead and autoplay blocks).
   - Flag `-movflags +faststart` placed at front of container for instant streaming at Frame 0.
   - Target size: **1.0MB to 2.2MB per loop** (CRF 23-24, 720p/540p 24fps) ensuring zero hover latency.
   - Loop duration: Seamlessly trimmed to 5.0–6.5 seconds.

2. **Zero-Jump WebP Poster Extraction**:
   - Frame 0 extracted directly from each finalized MP4:
     ```bash
     ffmpeg -ss 00:00:00.000 -i public/videos/services/service-XX.mp4 -vframes 1 -q:v 85 -compression_level 6 public/videos/services/service-XX.webp
     ```
   - Matches the first video frame with 0px and 0ms color shift when transitioning from poster to video.

3. **Data Integrity & Typings**:
   - Update `types.ts` with accurate `alt` tags and verified poster paths.
   - Update `docs/services_hover_expansion/media_manifest.json` with verified catalog metadata.

---

## 4. Execution Workflow
1. Create new sub-branch `redesign/services-cinematic-video-replacement` under `master`.
2. Run automated Node.js ingestion script utilizing local `ffmpeg` (already installed and verified on system) to download, transcode, optimize fast-start, and extract WebP posters.
3. Validate all 16 MP4s and WebP files (`ffprobe`, file sizes < 2.5MB).
4. Run `npx tsc --noEmit` to verify type safety.
5. Commit as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`, push, and open Pull Request on GitHub.
