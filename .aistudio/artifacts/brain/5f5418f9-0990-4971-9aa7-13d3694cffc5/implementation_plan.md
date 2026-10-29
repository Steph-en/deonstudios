# Dual-Asset Desktop & Mobile Hero Presentation

Empower the photographer client to upload tailored, high-impact portrait crops for mobile displays alongside landscape desktop assets for the hero background, with seamless viewport switching and graceful fallback.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core product and architecture decisions were confirmed during Phase 1 clarification:
> - **CMS Asset Pairing**: Desktop and mobile images are managed as paired assets within each playlist slot. Each hero slot has a primary Desktop Asset and an optional Mobile Crop.
> - **Responsive Trigger**: The browser switches to the mobile crop when screen width is under 768px or device orientation is portrait (`(max-width: 767px), (orientation: portrait)`).
> - **Fallback Policy**: If a mobile crop has not been uploaded for a specific slot, the hero displays the desktop asset using intelligent mobile focal centering and scale adjustments.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the Deon Studios hero section and Admin Hero CMS so the photographer can upload distinct, aspect-ratio-perfect portrait images (or videos) for smartphones and tablets while retaining cinematic landscape media for desktop monitors.
- **Target Audience**: Gideon Boadi / Deon Studios clients and visitors browsing on iPhones, Android smartphones, iPads, and desktop displays.
- **Key Value**: Eliminates awkward automated zooming and head/outfit cropping on mobile screens. Mobile visitors see intentional, magazine-grade vertical compositions tailored specifically for mobile viewports.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Admin Hero Management Flow (`/admin#admin/hero`)**:
   - The photographer navigates to the **Hero Backgrounds & Rotation** tab in the CMS.
   - In each playlist card, the photographer sees a split asset panel:
     - **Desktop Asset (Landscape / Full)**: Existing upload/preview thumbnail.
     - **Mobile Asset (Portrait 9:16 Crop)**: Dedicated upload trigger, file dropper, and preview thumbnail.
   - When the photographer selects a mobile file, it uploads directly to Supabase Storage (`portfolio-media/hero/`) and links to `asset.mobileUrl`.
   - The photographer can remove or replace the mobile asset at any time.
   - The live admin preview toggle (`Desktop` / `Mobile`) in the right-hand inspection drawer immediately reflects the mobile asset when mobile mode is toggled.

2. **Public Visitor Experience (`/`)**:
   - On desktop screens ($\ge 768\text{px}$ in landscape), the hero renders the cinematic desktop asset.
   - On mobile screens ($< 768\text{px}$ or portrait orientation), the hero displays the dedicated portrait asset with zero letterboxing and zero unwanted clipping.
   - Preloading ensures instant, flicker-free playlist transitions without layout shifts.

### Visual Identity & Theme Integration

- **Design Language**: Follows Deon Studios' minimalist luxury aesthetic—neutral canvas (`#0A0A0A` / `#FAFAFA`), clean hairline borders (`border-neutral-200`), tabular typography (`tabular-nums`), and unboxed metadata.
- **Admin UI Polish**:
  - Asset cards feature side-by-side miniature aspect ratio frames: `16:9` for desktop and `9:16` for mobile.
  - Clear visual indicator chips (`Mobile Crop Active` vs. `Desktop Fallback`).
  - Smooth hover transitions and upload progress spinners.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Paired Slot Architecture vs. Independent Mobile Playlist
- **Chosen Approach**: Paired slots (`HeroAsset.url` + `HeroAsset.mobileUrl`).
- **Why**: Keeps rotation timing, titles, ordering, and active states synchronized between desktop and mobile. If asset #2 is scheduled to display at 2:00 PM, both desktop and mobile visitors experience the exact same creative concept in its optimal aspect ratio.
- **Alternatives Considered**: Separate independent playlists would double scheduling complexity and desynchronize the storytelling between devices.

### Decision 2: Responsive Switch Mechanism (CSS Media Query vs. Window Listener)
- **Chosen Approach**: Hybrid approach—reactive React state backed by `window.matchMedia('(max-width: 767px), (orientation: portrait)')` combined with responsive `<picture>` / `<source>` element patterns.
- **Why**: Ensures zero flash during orientation changes and window resizes, while allowing JavaScript preloading of upcoming rotation items.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEON STUDIOS HERO CMS                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │  DESKTOP HERO ASSET   │             │   MOBILE HERO CROP    │
        │  (16:9 / Landscape)   │             │   (9:16 / Portrait)   │
        │  `asset.url`          │             │   `asset.mobileUrl`   │
        └───────────┬───────────┘             └───────────┬───────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │      HeroSettings JSON Document     │
                    │      Supabase `site_settings`       │
                    └──────────────────┬──────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
         [Desktop / Tablet Landscape]              [Mobile / Portrait]
              Viewport >= 768px                     Viewport < 768px
           Renders: `asset.url`              Renders: `asset.mobileUrl`
                                             (Fallback: `asset.url` +
                                              Focal Centering)
```

### Data Model Updates (`src/services/siteSettingsService.ts`)

```typescript
export interface HeroAsset {
  id: string;
  url: string;                     // Primary desktop asset URL
  mediaType: 'image' | 'video';
  title?: string;
  mobileUrl?: string;              // Specific mobile portrait crop URL
  fallbackPosterUrl?: string;
}
```

### Component Implementation Scope

1. **`src/pages/admin/HeroCmsPage.tsx`**:
   - Add dedicated Mobile Upload action to each playlist item in the asset list.
   - Display dual thumbnails (Desktop 16:9 + Mobile 9:16) with upload/replace/delete controls for the mobile asset.
   - Connect live mobile upload to `StorageService.uploadMedia` targeting `hero/`.
   - Update the preview pane to seamlessly test mobile uploads in simulated mobile viewport.

2. **`src/components/HeroVideo.tsx`**:
   - Update active asset media resolution:
     ```typescript
     const activeMediaUrl = (isMobileOrPortrait && activeAsset?.mobileUrl) 
       ? activeAsset.mobileUrl 
       : activeAsset?.url;
     ```
   - Preload both `asset.url` and `asset.mobileUrl` during rotation cycles.
   - Preserve focal centering and mobile scale as intelligent fallback when `mobileUrl` is absent.
