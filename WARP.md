# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**TrackFinder** (Activity DW Club) is a Vue 3 single-page application for discovering MTB cycling tracks in Slovakia. The app features an interactive track browser with filtering, individual track detail pages, and GPX downloads. It's optimized for GitHub Pages deployment with static page generation for SEO.

## Common Commands

### Development
```pwsh
npm install          # Install dependencies
npm run dev         # Start dev server (http://localhost:3000)
npm run preview     # Preview production build locally
```

### Building & Deployment
```pwsh
npm run build       # Full production build (includes static pages)
npm run build:spa   # SPA build only (no static pages)
npm run deploy      # Build and deploy to GitHub Pages
```

### Track Management
```pwsh
npm run tracks:scan         # Scan and validate track folders
npm run generate:static     # Generate static HTML pages for tracks
```

## Architecture

### Data Flow Pattern

The app uses a **dual-data approach** during migration:
1. **Legacy system**: Hardcoded track data in `src/data/tracks.js` (currently active)
2. **Dynamic system**: `src/utils/trackLoader.js` using Vite's `import.meta.glob` (partially implemented, not fully integrated)

**Current state**: All tracks are defined in `src/data/tracks.js`. The dynamic loader exists but isn't used by HomePage/TrackDetail components yet.

### Track Data Structure

Each track requires:
- **Folder**: `assets/tracks/{track-id}/` containing:
  - `preview.png` - Card preview image
  - `profil.png` - Elevation profile
  - `track.gpx` - GPS data
  - `track-info.json` - Metadata (for dynamic system, not currently used)

Track object schema (in tracks.js):
```javascript
{
  id: "track-id",
  name: "Display Name",
  description: "Full description",
  sport: "cycling",              // Always "cycling" for this project
  difficulty: "easy|moderate|hard",
  distance: "50.5 km",
  distanceValue: 50.5,          // Numeric for filtering
  location: "Region, Slovensko",
  locationRegion: "slovakia",
  duration: "3h 30m",
  elevation: "↑500 m / ↓500 m",
  previewImage: "/assets/tracks/{track-id}/preview.png",
  profileImage: "/assets/tracks/{track-id}/profil.png",
  gpxFile: "/assets/tracks/{track-id}/track.gpx",
  mapUrl: "https://mapy.com/s/...",
  tags: ["cyklistika", "bicykel", "náročné"],
  createdAt: "2025-09-28",
  stats: {
    distance: { icon: "📏", label: "Vzdialenosť", value: "50.5 km" },
    elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑500 m / ↓500 m" },
    startPoint: { icon: "📍", label: "START", value: "Region, Slovensko" }
  }
}
```

### Routing Architecture

Vue Router with **history mode** for clean URLs:
- `/` - HomePage (track listing grid)
- `/track/:id` - TrackDetail (individual track page)
- `/terms` - Terms & Conditions
- `/privacy` - Privacy Policy

**SEO Strategy**: `scripts/generate-static-pages.js` creates static HTML files for each track at build time with:
- Pre-rendered meta tags (title, description, Open Graph)
- `window.__INITIAL_TRACK_ID__` to trigger client-side navigation
- Sitemap generation for all routes

### State Management

**No Vuex/Pinia** - Uses Vue's reactive data and props:
- `App.vue` holds global filter state (sport, distance, difficulty, location)
- Filters passed down to HomePage via props
- Search query passed from header to HomePage
- Components load track data directly from `src/data/tracks.js`

### Component Structure

```
App.vue (root)
├── Header: Burger menu, search, logo
├── Router View (main content):
│   ├── HomePage: Track grid with filtering
│   ├── TrackDetail: Full track info, map, GPX download
│   ├── Terms: Legal page
│   └── Privacy: Privacy policy
├── Footer: Links, credits, CEA branding
└── CookieBanner: Cookie consent
```

**Key component details**:
- **HomePage**: Filters tracks using computed property based on App.vue state. Uses `getAllTracks()` from tracks.js.
- **TrackDetail**: Loads single track with `getTrackById(id)`. Shows preview, stats, profile image, and empty gallery section.
- **App.vue**: Manages burger menu (filters live inside), mobile search expansion, global click handlers.

### Styling System

All CSS in `src/style.css` - no CSS modules or scoped styles.

**Design principles**:
- Mobile-first responsive design (breakpoint: 768px)
- CSS Grid for track cards (1 column mobile → 2-3 columns desktop)
- Flexbox for header/stats/badges
- Slovak language UI

## Adding New Tracks

**Method 1: Manual (Current)**
1. Create folder: `assets/tracks/new-track-id/`
2. Add files: `preview.png`, `profil.png`, `track.gpx`
3. Add track object to `src/data/tracks.js` tracks array
4. Test with `npm run dev`
5. Build: `npm run build`

**Method 2: Automated (Intended)**
1. Create folder with files as above
2. Run `npm run tracks:scan` to validate structure
3. Track automatically appears (requires completing dynamic loader integration)

## Build Process

1. **Vite builds SPA** → `dist/` folder
2. **generate-static-pages.js** runs:
   - Reads built `dist/index.html` as template
   - Creates `dist/track/{track-id}/index.html` for each track
   - Injects track-specific meta tags and `__INITIAL_TRACK_ID__`
   - Generates `dist/sitemap.xml`
3. **gh-pages** publishes dist/ to GitHub Pages

**Deployment target**: Custom domain at `https://aktivity.ceaeurope.sk` (base path: `/`)

## File Organization

- `src/components/` - Vue components
- `src/data/` - Track data (tracks.js)
- `src/utils/` - Helper utilities (trackLoader.js - not yet integrated)
- `assets/tracks/` - Track files (preview, profile, GPX)
- `assets/icons/` - Sport/difficulty/stat icons
- `assets/shared/` - Shared images (logos, footer graphics)
- `scripts/` - Build utilities (static page generation, track validation)
- `public/` - Static assets (CNAME file for custom domain)

## Key Constraints

- **All tracks are cycling (MTB)** - Sport filter exists but only cycling tracks in database
- **Location locked to Slovakia** - Single location filter option
- **Windows development environment** - Use PowerShell commands
- **No backend/API** - Pure static site with client-side data
- **Slovak language UI** - All user-facing text in Slovak
- **Assets in public path** - Use `/assets/` paths, not relative imports

## Testing

No automated tests configured. Manual testing workflow:
1. Run `npm run dev`
2. Check track grid loads properly
3. Test filters (sport, distance, difficulty)
4. Click track cards → verify detail page
5. Test GPX download
6. Test mobile responsive behavior (burger menu, search collapse)

## Known Issues & TODOs

- Dynamic track loader (`trackLoader.js`) exists but not integrated into components
- Gallery section shows "no images" - gallery image discovery not implemented
- Profile image shows for all tracks (assumes `profil.png` exists)
- Track validation script exists but no CI/CD enforcement
