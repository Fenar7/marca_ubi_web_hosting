# Master Architecture & Redesign Plan: PrimeStay People Directory & Avatar Management System

**Document Version**: 1.0.0  
**Target Module**: `/admin/team` (User Management & Commercial Roster) & `/admin` Layout Top Bar  
**Reference Design Benchmark**: PrimeStay People Reference (`original-a90edff5ebcc6e3fee2aee29ea8e8282.webp`)  
**Current Baseline**: AI-Slop Corporate Spreadsheet (`Screenshot 2026-10-23 155350.png`)  
**Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Base Branch**: `master` / `brand-upgrade-phase-8/logip-clean-mid-tier-analytics-redesign`  
**Target Branch**: `redesign/primestay-people-and-avatar-management`  

---

## 1. Executive Summary & Design Transformation

### 1.1 The Problem: Current AI-Slop Implementation
The current User Management screen (`Screenshot 2026-10-23 155350.png`) suffers from:
1. **Generic Corporate Spreadsheet Table**: 7 wide columns with empty white/grey cells, low visual density, and horizontal sprawl that fails on standard laptops and mobile screens.
2. **Neon Lime Accent Disconnect**: An out-of-place `#eefb87` neon lime yellow pill button that clashes with Marca Ubi's dark luxury aesthetic (`#000000`, `#ff6100`, `#ffffff`).
3. **Monochrome Initials Avatars**: Completely ignores `avatar_url` from the database, forcing a sterile black `#000` circle with white initials (`FU`, `AJ`, `AD`) on all users.
4. **No Profile Photo Management**: Neither admins nor users can set, upload, replace, or crop profile pictures.
5. **Rigid Information Architecture**: No segmentation between leadership, active sales reps, and suspended staff; no view toggling; cramped inline action icons.

```
[ Current Implementation - AI-Slop Spreadsheet ]
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Team Management        [Neon Yellow Pill: + Add Team Member]                   │
│ ┌────────┬────────────────┬──────────────┬──────────────┬──────────────┬───────┐ │
│ │ Member │ Role           │ Phone        │ Status       │ Last Login   │ ···   │ │
│ ├────────┼────────────────┼──────────────┼──────────────┼──────────────┼───────┤ │
│ │ (FU)   │ Admin          │ +91 9876...  │ Active       │ 2 hours ago  │ ✎ 🚫  │ │
│ │ (AJ)   │ Sales Exec     │ +91 9123...  │ Active       │ Yesterday    │ ✎ 🚫  │ │
│ └────────┴────────────────┴──────────────┴──────────────┴──────────────┴───────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 The Solution: PrimeStay People-Inspired Luxury Architecture
Transforming the directory into a high-craft, card-based team roster mirroring the PrimeStay reference:
1. **PrimeStay Underlined Category Tabs**: Direct filter tabs with live counters:
   - `All Personnel (12)`
   - `Leadership & Admins (3)`
   - `Sales Executives (7)`
   - `Suspended / Inactive (2)`
2. **Omni-Search & View Control Toolbar**:
   - Command-K search input with instant client-side debounced fuzzy filtering.
   - Quick role & status dropdown filters.
   - View mode switcher: **Card Grid** (default luxury visual mode) vs. **Compact Table** (for dense data auditing).
3. **Personnel Fluid Cards (4-Column Responsive Grid)**:
   - High-density luxury card (`#0e1013` surface, `1px solid rgba(255,255,255,0.07)` border, 16px radius, subtle hover elevation).
   - 56px circular photography avatar with online status indicator and camera overlay.
   - Raycast monospace role badge & territory/job title chip.
   - Commercial metrics scorecard: Active Deals count and Portfolio Value (formatted in ₹Cr / ₹L).
   - Linear capacity gauge (e.g., `4/10 Leads (40%)`).
   - Symmetrical dual-button footer: `Manage Access` (primary action) + `View Profile` (secondary outline), with secondary governance actions delegated to a neat `···` popover.
4. **End-to-End Profile Photo Management System**:
   - **Admin Management**: Admins can upload, crop, set, or remove profile photos for ANY user directly from their personnel card or profile drawer.
   - **User Self-Service**: Users can upload, crop, or change their own photo via the `UserProfileDropdown` in the top navigation bar or from their own card marked `(You)`.
   - Client-side offscreen canvas center-cropping (<90KB WebP, 512×512px).
   - Supabase Storage `avatars` bucket with strict RLS and automatic orphaned asset deletion.

```
[ PrimeStay People Design Architecture ]
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Team & Personnel                                             [ + Add Member ]                  │
│                                                                                                  │
│  [All Personnel (12)]   [Leadership & Admins (3)]   [Sales Executives (7)]   [Suspended (2)]    │
│  ───────────────────                                                                             │
│                                                                                                  │
│  [ 🔍 Search personnel...  Ctrl+K ]  [ All Roles ▾ ]  [ Status: Active ▾ ]      [ ⊞ Grid | ☰ List ]│
│                                                                                                  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │  (📷 Avatar) 🟢       │ │  (📷 Avatar) 🟢       │ │  (📷 Avatar) ⚪       │ │ (📷 Avatar)   │ │
│  │  Farhan Firoz (You)   │ │  Ayesha Khan          │ │  Vikram Sethi         │ │ Rahul Verma   │ │
│  │  [ ADMIN ] [HQ]       │ │  [ SALES EXEC ] [MUM] │ │  [ SALES EXEC ] [BLR] │ │ [ VIEWER ]    │ │
│  │  farhan@marcaubi.com  │ │  ayesha@marcaubi.com  │ │  vikram@marcaubi.com  │ │ rahul@...     │ │
│  │  ───────────────────  │ │  ───────────────────  │ │  ───────────────────  │ │ ─────────────│ │
│  │  Deals: 14 • ₹4.2Cr   │ │  Deals: 8 • ₹1.8Cr    │ │  Deals: 2 • ₹45L      │ │ Deals: 0      │ │
│  │  Capacity: [████░] 80%│ │  Capacity: [███░░] 60%│ │  Capacity: [█░░░░] 20%│ │ Inactive     │ │
│  │  ───────────────────  │ │  ───────────────────  │ │  ───────────────────  │ │ ─────────────│ │
│  │ [Manage] [Profile] [⋮]│ │ [Reassign] [Profile][⋮│ │ [Reassign] [Profile][⋮│ │ [Reactivate] │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Full-Stack Profile Photo Storage Architecture

### 2.1 Database & Storage Bucket Infrastructure
The database table `public.profiles` already contains `avatar_url TEXT`. We will configure the Supabase Storage bucket and Row Level Security (RLS) policies.

#### Supabase Migration: `supabase/migrations/20261023000001_avatar_storage_and_governance.sql`
```sql
-- 1. Create dedicated 'avatars' storage bucket with public read access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB raw payload ceiling
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage RLS: Public Read Access
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Storage RLS: Upload / Insert
-- User can upload to their own user-scoped folder: avatars/{user_id}/avatar.webp
-- Administrators can upload to ANY user folder: avatars/{any_user_id}/avatar.webp
CREATE POLICY "Avatar Upload Policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  )
);

-- 4. Storage RLS: Update / Overwrite
CREATE POLICY "Avatar Update Policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  )
);

-- 5. Storage RLS: Delete / Remove
CREATE POLICY "Avatar Delete Policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  )
);
```

### 2.2 Client-Side Image Processor (`src/app/lib/avatarImageProcessor.ts`)
To prevent uncompressed 10MB mobile uploads from degrading performance and wasting bandwidth, all avatar uploads are processed client-side prior to network dispatch:
1. **Magic Byte Verification**: Inspects binary header bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46` for WebP).
2. **Center Square Crop & Resample**: Creates an `HTMLCanvasElement`, calculates square crop box `min(width, height)`, and renders at exact `512×512px`.
3. **WebP Compression**: Encodes canvas to `image/webp` at 0.85 quality, yielding an ultra-sharp file under 80KB.
4. **Instant Preview**: Returns an object URL for zero-latency local UI display while the upload action executes in the background.

```ts
export interface ProcessedAvatarResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  fileSize: number;
}

export async function processAvatarImage(file: File): Promise<ProcessedAvatarResult>;
```

### 2.3 Server Actions (`src/app/actions/avatarActions.ts`)
Two enterprise server actions with strict authorization and transactional integrity:

```ts
/**
 * Uploads/updates a user's avatar.
 * Permitted for:
 * 1. Self-service caller (targetUserId === caller.id)
 * 2. Administrative caller (caller.role === 'admin')
 */
export async function updateUserAvatarAction(
  targetUserId: string,
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }>;

/**
 * Removes a user's avatar and clears avatar_url in the database.
 * Deletes corresponding asset in Supabase storage bucket.
 */
export async function removeUserAvatarAction(
  targetUserId: string
): Promise<{ success: boolean; error?: string }>;
```

### 2.4 Next.js CSP & Image Remote Patterns
In `next.config.ts`:
1. **Content Security Policy (`img-src`)**:
   Update `img-src 'self' blob: data: https://cdn.sanity.io` to add `https://*.supabase.co` to allow rendering Supabase Storage avatars.
2. **Image Optimization Remote Patterns**:
   Add `{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/avatars/**' }`.

---

## 3. UI Component Architecture & Design System Integration

### 3.1 Component Hierarchy
```
src/app/admin/(workspace)/team/
├── page.tsx                                  # Server Component: fetches roster & metrics
├── team.module.scss                          # SCSS Module for directory workspace
└── components/
    ├── TeamWorkspaceClient.tsx               # Client orchestrator: state, tabs, view toggle
    ├── CategoryUnderlineTabs.tsx             # PrimeStay underlined category tabs
    ├── FilterControlToolbar.tsx              # Search input, role filter, status, view toggle
    ├── PersonnelCardGrid.tsx                 # 4-column responsive grid container
    ├── PersonnelCard.tsx                     # PrimeStay luxury personnel card
    ├── PersonnelActionMenu.tsx               # Dropdown popover for card secondary actions
    ├── AvatarUploadModal.tsx                 # Drag-and-drop / center-crop photo modal
    ├── CommercialDirectoryTable.tsx          # Modernized compact table view (alternative toggle)
    ├── AddTeamMemberDrawer.tsx               # Existing modal for creating staff
    ├── EditUserPermissionsModal.tsx          # Existing modal for editing roles
    ├── LeadReassignmentWizardModal.tsx       # Existing modal for lead handover
    └── SuspendUserModal.tsx                  # Existing modal for account suspension
```

### 3.2 Layout Top Bar & Self-Service Integration
1. **Update `src/app/admin/(workspace)/layout.tsx`**:
   Hydrate `avatarUrl: profile?.avatar_url || null` into `userDisplay` passed to `AdminWorkspaceShell`.
2. **Update `src/app/admin/components/layout/UserProfileDropdown.tsx`**:
   - Render 32px photography avatar with fallback to monograms if `currentUser.avatarUrl` is null.
   - Render 48px avatar inside the popover flyout with a subtle "Edit Photo" camera icon overlay.
   - Clicking "Edit Photo" triggers the `AvatarUploadModal` scoped to the current user.
3. **Cross-Component Synchronization**:
   When an avatar is saved or removed, dispatch a `user-avatar-updated` window event with `{ userId, avatarUrl }`. `UserProfileDropdown` and `PersonnelCard` listen to this event to update instantly without requiring a full browser refresh.

---

## 4. Visual Tokens & Anti-AI-Slop Styling

In strict compliance with `DESIGN.md` and `master-ui-ux-design-system`:
- **Surface Elevation**: `#0e1013` with `1px solid rgba(255, 255, 255, 0.07)` border and `16px` border-radius.
- **Accents**: Brand Safety Orange `#ff6100` for active indicators and primary buttons; strict prohibition of generic AI blue (`#2563eb`) and neon lime yellow (`#eefb87`).
- **Typography**: Inter / Outfit with tabular figures (`font-variant-numeric: tabular-nums`) for currency and counters.
- **Avatars**: 56px circular photography with `object-fit: cover`, subtle `2px solid rgba(255, 255, 255, 0.1)` ring, and absolute 12px status pip (Green `#10b981` = Active, Slate `#64748b` = Inactive).
- **Responsive Grid**:
  - Desktop (>1280px): `grid-template-columns: repeat(4, 1fr)`
  - Medium Laptops (1024px-1279px): `grid-template-columns: repeat(3, 1fr)`
  - Tablets (768px-1023px): `grid-template-columns: repeat(2, 1fr)`
  - Mobile (<768px): `grid-template-columns: 1fr`

---

## 5. Step-by-Step Implementation Roadmap

| Phase | Description | Deliverables |
|---|---|---|
| **Phase 1: Storage & Security Engine** | Supabase migration for `avatars` bucket and RLS policies; Next.js CSP and `remotePatterns` configuration in `next.config.ts`. | `supabase/migrations/20261023000001_avatar_storage_and_governance.sql`, `next.config.ts` |
| **Phase 2: Image Processor & Server Actions** | Client-side magic byte inspection, 512×512 canvas cropping, WebP compression, and Server Actions `updateUserAvatarAction` & `removeUserAvatarAction`. | `src/app/lib/avatarImageProcessor.ts`, `src/app/lib/avatar-schemas.ts`, `src/app/actions/avatarActions.ts` |
| **Phase 3: PrimeStay Personnel Components** | Category underline tabs, search toolbar, 4-column card grid, `PersonnelCard`, `PersonnelActionMenu`, and avatar camera hover overlay. | `src/app/admin/(workspace)/team/components/CategoryUnderlineTabs.tsx`, `FilterControlToolbar.tsx`, `PersonnelCardGrid.tsx`, `PersonnelCard.tsx`, `PersonnelActionMenu.tsx` |
| **Phase 4: Avatar Upload & Crop Modal** | Modal dialog with drag-and-drop file picker, real-time zoom/pan preview, center-crop canvas, and delete avatar trigger. | `src/app/admin/(workspace)/team/components/AvatarUploadModal.tsx`, `AvatarUploadModal.module.scss` |
| **Phase 5: Self-Service Integration** | Hydrate `avatarUrl` into `layout.tsx`, connect `UserProfileDropdown.tsx` top-bar avatar and edit trigger, and wire real-time `user-avatar-updated` window events. | `src/app/admin/(workspace)/layout.tsx`, `src/app/admin/components/layout/UserProfileDropdown.tsx` |
| **Phase 6: Testing, Audit & PR Compilation** | Automated unit tests for avatar actions and image processing; TypeScript `npx tsc --noEmit` verification; Playwright live screenshots; Senior CTO PR Auditor delivery gate report. | PR opened on GitHub (OPEN state, author `Fenar7`, no `feat` prefix). |

---

## 6. Strict Behavioral Governance & Safety Compliance

- **ZERO PR MERGES BY AGENT**: All pull requests must remain strictly in an `OPEN` state for human review on GitHub.
- **NEVER EXECUTE WITHOUT EXPLICIT PERMISSION**: Await explicit user authorization ("proceed" or "do it") before switching branches or writing component code.
- **MANDATORY AUTHORSHIP**: All commits must be authored exclusively by:
  `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **NO `FEAT` IN PR TITLES**: Use professional titles such as `Phase 9: PrimeStay People Directory & Avatar Management Architecture`.
- **PORT ISOLATION**: Dev server runs on port 3003; never terminate process 10640 on port 3000.
