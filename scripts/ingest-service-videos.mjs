/**
 * @file scripts/ingest-service-videos.mjs
 * @description Automated media processing pipeline for Marca Ubi Services Accordion.
 *              Downloads vetted luxury commercial video loops, transcode to fast-start H.264 MP4,
 *              and extracts zero-jump WebP poster frames.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const TARGET_DIR = path.join(ROOT_DIR, "public", "videos", "services");
const TEMP_DIR = path.join(ROOT_DIR, "temp", "video_ingest");

const VETTED_ASSETS = [
  {
    num: "01",
    id: "b2b-demand-generation",
    name: "Demand Generation",
    url: "https://assets.mixkit.co/videos/49845/49845-720.mp4",
    duration: 5.5,
  },
  {
    num: "02",
    id: "b2b-integrated-marketing",
    name: "Integrated Marketing",
    url: "https://assets.mixkit.co/videos/46680/46680-720.mp4",
    duration: 5.5,
  },
  {
    num: "03",
    id: "b2b-corporate-communications",
    name: "Corporate Communications",
    url: "https://assets.mixkit.co/videos/13222/13222-720.mp4",
    duration: 5.5,
  },
  {
    num: "04",
    id: "b2b-social-influencer",
    name: "Social & Influencer Marketing",
    url: "https://assets.mixkit.co/videos/44074/44074-720.mp4",
    duration: 5.5,
  },
  {
    num: "05",
    id: "b2b-content-scale",
    name: "Content & Scale",
    url: "https://assets.mixkit.co/videos/12268/12268-720.mp4",
    duration: 5.5,
  },
  {
    num: "06",
    id: "b2b-public-relations",
    name: "Public Relations (PR)",
    url: "https://assets.mixkit.co/videos/24357/24357-720.mp4",
    duration: 5.5,
  },
  {
    num: "07",
    id: "b2b-customer-marketing",
    name: "Customer Marketing",
    url: "https://assets.mixkit.co/videos/15716/15716-720.mp4",
    duration: 5.5,
  },
  {
    num: "08",
    id: "b2b-abm",
    name: "Account-Based Marketing (ABM)",
    url: "https://assets.mixkit.co/videos/49846/49846-720.mp4",
    duration: 5.5,
  },
  {
    num: "09",
    id: "b2c-integrated-creativity",
    name: "Integrated Creativity",
    url: "https://assets.mixkit.co/videos/44818/44818-720.mp4",
    duration: 5.5,
  },
  {
    num: "10",
    id: "b2c-social-influencer",
    name: "Social & Influencer",
    url: "https://assets.mixkit.co/videos/50641/50641-720.mp4",
    duration: 5.5,
  },
  {
    num: "11",
    id: "b2c-digital-performance",
    name: "Digital Performance",
    url: "https://assets.mixkit.co/videos/47796/47796-720.mp4",
    duration: 5.5,
  },
  {
    num: "12",
    id: "b2c-sports-marketing",
    name: "Sports Marketing",
    url: "https://assets.mixkit.co/videos/32807/32807-720.mp4",
    duration: 5.5,
  },
  {
    num: "13",
    id: "b2c-crm-loyalty",
    name: "CRM & Loyalty",
    url: "https://assets.mixkit.co/videos/18264/18264-720.mp4",
    duration: 5.5,
  },
  {
    num: "14",
    id: "b2c-public-relations",
    name: "Public Relations (PR - Consumer)",
    url: "https://assets.mixkit.co/videos/32591/32591-720.mp4",
    duration: 5.5,
  },
  {
    num: "15",
    id: "b2c-live-experiences",
    name: "Live Experiences",
    url: "https://assets.mixkit.co/videos/48510/48510-720.mp4",
    duration: 5.5,
  },
  {
    num: "16",
    id: "b2c-retail-activation",
    name: "Retail Activation",
    url: "https://assets.mixkit.co/videos/23327/23327-720.mp4",
    duration: 5.5,
  },
];

async function downloadFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function processAll() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  console.log(`Starting media ingestion for ${VETTED_ASSETS.length} assets...`);

  for (const asset of VETTED_ASSETS) {
    const rawFile = path.join(TEMP_DIR, `raw-${asset.num}.mp4`);
    const finalMp4 = path.join(TARGET_DIR, `service-${asset.num}.mp4`);
    const finalWebp = path.join(TARGET_DIR, `service-${asset.num}.webp`);

    console.log(`\n[${asset.num}/16] Ingesting: ${asset.name}...`);
    console.log(`  Downloading from: ${asset.url}`);
    await downloadFile(asset.url, rawFile);

    console.log(`  Transcoding fast-start H.264 loop...`);
    // Transcode: cut to duration, strip audio (-an), h264 crf 23, faststart moov atom
    const ffmpegCmd = `ffmpeg -y -i "${rawFile}" -t ${asset.duration} -an -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -movflags +faststart "${finalMp4}"`;
    execSync(ffmpegCmd, { stdio: "pipe" });

    console.log(`  Extracting zero-jump WebP poster (Frame 0)...`);
    const posterCmd = `ffmpeg -y -ss 00:00:00.000 -i "${finalMp4}" -vframes 1 -q:v 85 "${finalWebp}"`;
    execSync(posterCmd, { stdio: "pipe" });

    const mp4Stat = fs.statSync(finalMp4);
    const webpStat = fs.statSync(finalWebp);
    console.log(`  Completed: MP4 = ${(mp4Stat.size / (1024 * 1024)).toFixed(2)} MB | WebP = ${(webpStat.size / 1024).toFixed(1)} KB`);
  }

  // Cleanup temp files
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log("\nAll 16 video loops and posters successfully ingested and verified!");
}

processAll().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
