/**
 * @file seed-user-avatars.ts
 * @description Utility script to download and assign professional corporate portrait avatars
 *              for existing Marca Ubi team personnel.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

interface AvatarMapping {
  name: string;
  email: string;
  localFile: string;
  avatarUrl: string;
  sourceUrl: string;
}

const AVATAR_ASSIGNMENTS: AvatarMapping[] = [
  {
    name: 'Elena Vance',
    email: 'manager@marcaubi.com',
    localFile: 'public/avatars/elena-vance.jpg',
    avatarUrl: '/avatars/elena-vance.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=512&h=512&q=80',
  },
  {
    name: 'Tariq Al-Mansoor',
    email: 'exec1@marcaubi.com',
    localFile: 'public/avatars/tariq-al-mansoor.jpg',
    avatarUrl: '/avatars/tariq-al-mansoor.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=512&h=512&q=80',
  },
  {
    name: 'Sophia Sterling',
    email: 'exec2@marcaubi.com',
    localFile: 'public/avatars/sophia-sterling.jpg',
    avatarUrl: '/avatars/sophia-sterling.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=512&h=512&q=80',
  },
  {
    name: 'Marca Ubi Root Admin',
    email: 'admin@marcaubi.com',
    localFile: 'public/avatars/root-admin.jpg',
    avatarUrl: '/avatars/root-admin.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=512&h=512&q=80',
  },
];

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      })
      .on('error', reject);
  });
}

async function main(): Promise<void> {
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  console.log('Downloading high-resolution portraits for team members...');
  for (const item of AVATAR_ASSIGNMENTS) {
    const fullDest = path.join(process.cwd(), item.localFile);
    if (!fs.existsSync(fullDest) || fs.statSync(fullDest).size === 0) {
      await downloadFile(item.sourceUrl, fullDest);
    }
    const sz = fs.statSync(fullDest).size;
    console.log(`[OK] ${item.name} (${item.email}) -> ${item.localFile} (${sz} bytes)`);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('Connected to PostgreSQL database. Updating public.profiles.avatar_url...');

  for (const item of AVATAR_ASSIGNMENTS) {
    const updateRes = await client.query(
      `UPDATE public.profiles
       SET avatar_url = $1, updated_at = NOW()
       WHERE email = $2
       RETURNING id, full_name, email, role, avatar_url;`,
      [item.avatarUrl, item.email]
    );

    if (updateRes.rows.length > 0) {
      console.log(`[UPDATED] ${item.name}: avatar_url set to ${updateRes.rows[0].avatar_url}`);
    } else {
      console.warn(`[WARN] No profile record found for email: ${item.email}`);
    }
  }

  await client.end();
  console.log('All user avatars successfully seeded and synchronized!');
}

main().catch((err) => {
  console.error('Avatar seeding failed:', err);
  process.exit(1);
});
