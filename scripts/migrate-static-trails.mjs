/**
 * One-time migration: upsert the 10 hardcoded static trails into Supabase.
 * Run once, then the static layer can be removed from the source code.
 *
 * Usage:
 *   node scripts/migrate-static-trails.mjs
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv needed)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

let supabaseUrl = ''
let supabaseKey = ''

try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split(/\r?\n/)) {
    const [key, ...rest] = line.split('=')
    const value = rest.join('=').trim()
    if (key === 'VITE_SUPABASE_URL') supabaseUrl = value
    if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = value
    if (key === 'VITE_SUPABASE_ANON_KEY' && !supabaseKey) supabaseKey = value
  }
} catch {
  console.error('Could not read .env.local')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ---------------------------------------------------------------------------
// Static trail data (copied verbatim from src/data/tracks.js)
// ---------------------------------------------------------------------------
const staticTrails = [
  {
    id: "inovec-mitice-ostry-vrch",
    name: "Inovec Mitice Ostrý vrch",
    description: "Náročná MTB trasa cez Inovecké pohorie s výzvovými stúpaniami na Ostrý vrch. Technické single-tracky striedajú lesné cesty s výhľadmi na celé Považie. Ideálne pre pokročilých bikérov hľadajúcich adrenalínový zážitok v srdci Slovenska.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "81.7 km",
    distanceValue: 81.7,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "5h 32m",
    elevation: "↑1,735 m / ↓1,728 m",
    previewImage: "/assets/tracks/inovec-mitice-ostry-vrch/preview.png",
    profileImage: "/assets/tracks/inovec-mitice-ostry-vrch/profil.png",
    gpxFile: "/assets/tracks/inovec-mitice-ostry-vrch/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/robavalovu",
    tags: ["cyklistika", "bicykel", "náročné", "hory", "vrcholy"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "81.7 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑1,735 m / ↓1,728 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "kolacin-trail-klepac",
    name: "KOLAČIN TRAIL + KLEPÁČ",
    description: "Technicky náročná MTB trasa kombinújúca Kolačín trail s výstupom na Klepáč. Úzke single-tracky a lesné chodníčky s krásnymi panoramatickými výhľadmi. Pre bikérov milujúcich výzvu technických úsekôv a hľadás slovenských vrchov.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "29.3 km",
    distanceValue: 29.3,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "8h 24m",
    elevation: "↑844 m / ↓852 m",
    previewImage: "/assets/tracks/kolacin-trail-klepac/preview.png",
    profileImage: "/assets/tracks/kolacin-trail-klepac/profil.png",
    gpxFile: "/assets/tracks/kolacin-trail-klepac/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/kovelodoze",
    tags: ["turistika", "pešia túra", "náročné", "vrcholy"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "29.3 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑844 m / ↓852 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "nedasov-brumov-trencin",
    name: "NEDASOV BRUMOV TRENCIN",
    description: "Dlhá vytrvalostná MTB trasa spájajúca obce Nedašov, Brumov a Trenčín cez malebný Trenčiansky kraj. Kombinácia asfaltových ciest, makadamov a lesných single-trackov. Perfektná pre bikérov milujúcich dlhé výjazdy a objavovanie okamlžitých miest.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "82.9 km",
    distanceValue: 82.9,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "5h 36m",
    elevation: "↑441 m / ↓390 m",
    previewImage: "/assets/tracks/nedasov-brumov-trencin/preview.png",
    profileImage: "/assets/tracks/nedasov-brumov-trencin/profil.png",
    gpxFile: "/assets/tracks/nedasov-brumov-trencin/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/bumahupumo",
    tags: ["cyklistika", "bicykel", "náročné"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "82.9 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑441 m / ↓390 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "nemsova-ibovka-tn-kolacin",
    name: "NEMSOVA - IBOVKA - TN - KOLAČIN",
    description: "Pokojná XC MTB trasa spájajúca úrokmlé obce Nemsová, Ibovka a Kolačín cez Trenčín. Ideálna pre rodinné výjazdy a začínajúcich bikérov. Kombinuje pohodlné asfalty s jednoduchými lesnými trailmi, ponúka krásne výhľady na Trenčiansky hrad a okolitné kopce.",
    sport: "cycling",
    bikeType: "cross-country",
    distance: "51.3 km",
    distanceValue: 51.3,
    difficulty: "moderate",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "3h 28m",
    elevation: "↑306 m / ↓305 m",
    previewImage: "/assets/tracks/nemsova-ibovka-tn-kolacin/preview.png",
    profileImage: "/assets/tracks/nemsova-ibovka-tn-kolacin/profil.png",
    gpxFile: "/assets/tracks/nemsova-ibovka-tn-kolacin/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/polenudave",
    tags: ["cyklistika", "bicykel", "stredné"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "51.3 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑306 m / ↓305 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "omsenie-dolna-poruba-iliavka",
    name: "OMSENIE - DOLNÁ PORUBA - HORNÁ PORUBA - ILIAVKA",
    description: "Náročná MTB trasa cez malebné slovenské dediny Omsenie, Dolnú a Hornú Porubu až po Iliavku. Výzva pre pokročilých s peknými kopcovatymi úsekmi a technickými single-trackmi. Ponúka autentický pohľad slovenského vidieka s tradičnými dediničkami.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "40.5 km",
    distanceValue: 40.5,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "11h 36m",
    elevation: "↑1,034 m / ↓1,029 m",
    previewImage: "/assets/tracks/omsenie-dolna-poruba-iliavka/preview.png",
    profileImage: "/assets/tracks/omsenie-dolna-poruba-iliavka/profil.png",
    gpxFile: "/assets/tracks/omsenie-dolna-poruba-iliavka/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/fahujufute",
    tags: ["turistika", "pešia túra", "náročné", "dediny"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "40.5 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑1,034 m / ↓1,029 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "soblahov-cez-brezinu",
    name: "SOBLAHOV CEZ BREZINU",
    description: "Náročná MTB trasa vedúca z obce Soblahov cez Brezinu do okolitej prirodzenej krajiny. Kombinácia lesných single-trackov a turistických chodníčkov s umierneným prevýšením. Perfektná pre milovníkov pokojných výjazov do slovenského lesa.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "51.7 km",
    distanceValue: 51.7,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "13h 12m",
    elevation: "↑524 m / ↓516 m",
    previewImage: "/assets/tracks/soblahov-cez-brezinu/preview.png",
    profileImage: "/assets/tracks/soblahov-cez-brezinu/profil.png",
    gpxFile: "/assets/tracks/soblahov-cez-brezinu/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/manuhafeja",
    tags: ["turistika", "pešia túra", "náročné"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "51.7 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑524 m / ↓516 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "suca-sanov-stitna",
    name: "SUCA SANOV STITNA",
    description: "Dlhá vytrvalostná MTB trasa spájajúca obce Suča, Šanov a Štitná. Výzva pre bikérov s kondicíou - takmer 70km lesných ciest a single-trackov s umierneným stúpaním. Ideálne pre milovníkov dlhých enduro výjazov cez slovenský prírodu.",
    sport: "cycling",
    bikeType: "enduro",
    distance: "69.8 km",
    distanceValue: 69.8,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "17h 46m",
    elevation: "↑586 m / ↓592 m",
    previewImage: "/assets/tracks/suca-sanov-stitna/preview.png",
    profileImage: "/assets/tracks/suca-sanov-stitna/profil.png",
    gpxFile: "/assets/tracks/suca-sanov-stitna/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/febafafenu",
    tags: ["turistika", "pešia túra", "náročné"],
    createdAt: "2025-09-28",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "69.8 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑586 m / ↓592 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "jesenny-vrsatec",
    name: "Jesenný Vršatec",
    description: "Náročná MTB trasa okolo malebného Vršatca s nádhernými jesennými výhľadmi. Kombinácia lesných single-trackov a makadamových ciest s umierneným stúpaním. Ideálne na jeseň pre fotografických bikérov a milovníkov farebných korun stromov.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "59.4 km",
    distanceValue: 59.4,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "4h 15m",
    elevation: "↑872 m / ↓873 m",
    previewImage: "/assets/tracks/vrsatec/preview.png",
    profileImage: "/assets/tracks/vrsatec/profil.png",
    gpxFile: "/assets/tracks/vrsatec/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/nafanobabu",
    tags: ["turistika", "cyklistika", "náročné", "vrcholy", "jeseň"],
    createdAt: "2025-10-13",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "59.4 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑872 m / ↓873 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "novodubnicky-maraton",
    name: "NOVODUBNICKÝ MARATON",
    description: "Náročný MTB maratón s imponujúcimi 2748m prevýšenia na 87km. Jedna z najnáročnejších tras pre pokročilých bikérov hľadajúcich absolútnu výzvu. Kombinácia technických single-trackov, prudkých stúpaní a dlhých zjazdôv. Iba pre zdatných a odporúčame s podporou.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "87 km",
    distanceValue: 87,
    difficulty: "hard",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "7h 45m",
    elevation: "↑2748 m / ↓2796 m",
    previewImage: "/assets/tracks/novodubnicky-maraton/preview.png",
    profileImage: "/assets/tracks/novodubnicky-maraton/profil.png",
    gpxFile: "/assets/tracks/novodubnicky-maraton/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/josesuvufa",
    tags: ["cyklistika", "bicykel", "náročné", "maraton"],
    createdAt: "2025-10-13",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "87 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑2748 m / ↓2796 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  },
  {
    id: "baske-cez-bezakovcov",
    name: "BAŠKE CEZ BEŽÁKOVCOV",
    description: "Stredne náročná MTB trasa spájajúca Baške s Bežákovcom cez kopcovatinu okolia. Krásna kombinácia lesných single-trackov a asfaltových ciest s peknými výhľadmi na okolitné dediny. Ideálne pre rodinné výjazdy a stredne pokročilých bikérov.",
    sport: "cycling",
    bikeType: "mtb",
    distance: "42.8 km",
    distanceValue: 42.8,
    difficulty: "moderate",
    location: "Trenčiansky kraj, Slovensko",
    locationRegion: "slovakia",
    duration: "3h 30m",
    elevation: "↑1170 m / ↓1170 m",
    previewImage: "/assets/tracks/baske-cez-bežákovcov/preview.png",
    profileImage: "/assets/tracks/baske-cez-bežákovcov/profil.png",
    gpxFile: "/assets/tracks/baske-cez-bežákovcov/track.gpx",
    gpxFileName: "track.gpx",
    mapUrl: "https://mapy.com/s/lazahahohe",
    tags: ["cyklistika", "bicykel", "stredné", "dediny"],
    createdAt: "2025-10-13",
    stats: {
      distance: { icon: "📏", label: "Vzdialenosť", value: "42.8 km" },
      elevation: { icon: "⛰️", label: "Prevýšenie", value: "↑1170 m / ↓1170 m" },
      startPoint: { icon: "📍", label: "START", value: "Trenčiansky kraj, Slovensko" }
    }
  }
]

// ---------------------------------------------------------------------------
// Migrate
// ---------------------------------------------------------------------------
let ok = 0
let skipped = 0

console.log(`\nMigrating ${staticTrails.length} static trails to Supabase...\n`)

for (const trail of staticTrails) {
  try {
    const { error } = await supabase
      .from('trails')
      .upsert(
        { id: trail.id, payload: trail, created_by: null },
        { onConflict: 'id' }
      )

    if (error) {
      console.warn(`  ⚠  ${trail.id}: ${error.message} — skipping`)
      skipped++
    } else {
      console.log(`  ✅ ${trail.id}`)
      ok++
    }
  } catch (err) {
    console.warn(`  ⚠  ${trail.id}: ${err.message} — skipping`)
    skipped++
  }
}

console.log(`\nDone! ${ok} migrated, ${skipped} skipped.\n`)
