// Simple hardcoded tracks data
// No more complex dynamic loading - just a simple array!

export const tracks = [
  {
    id: "vrsatec",
    name: "Vrátec Trail",
    description: "Krásna turistická trasa cez Vrátecké skaly s úžasnými výhľadmi.",
    sport: "hiking",
    distance: "15.2 km",
    distanceValue: 15.2,
    difficulty: "moderate",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "4h 30m",
    elevation: "↑650 m / ↓640 m",
    previewImage: "/assets/tracks/vrsatec/preview.png",
    profileImage: "/assets/tracks/vrsatec/profil.png",
    gpxFile: "/assets/tracks/vrsatec/track.gpx",
    mapUrl: "https://mapy.com/s/example1",
    tags: ["turistika", "skaly", "výhľady", "stredná náročnosť"],
    createdAt: "2025-09-28"
  },
  {
    id: "forest-hike",
    name: "Lesný pochod",
    description: "Pokojná turistická trasa cez husté lesy ideálna pre celú rodinu.",
    sport: "hiking",
    distance: "8.5 km",
    distanceValue: 8.5,
    difficulty: "easy",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "2h 15m",
    elevation: "↑220 m / ↓215 m",
    previewImage: "/assets/tracks/forest-hike/preview.png",
    profileImage: "/assets/tracks/forest-hike/profil.png",
    gpxFile: "/assets/tracks/forest-hike/track.gpx",
    mapUrl: "https://mapy.com/s/example2",
    tags: ["turistika", "les", "ľahké", "rodina"],
    createdAt: "2025-09-28"
  },
  {
    id: "mountain-biking-trail",
    name: "Horský bikový trail",
    description: "Náročná cyklistická trasa pre skúsených bikrov s technickými úsekmi.",
    sport: "cycling",
    distance: "42.3 km",
    distanceValue: 42.3,
    difficulty: "hard",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "3h 45m",
    elevation: "↑1,120 m / ↓1,115 m",
    previewImage: "/assets/tracks/mountain-biking-trail/preview.png",
    profileImage: "/assets/tracks/mountain-biking-trail/profil.png",
    gpxFile: "/assets/tracks/mountain-biking-trail/track.gpx",
    mapUrl: "https://mapy.com/s/example3",
    tags: ["cyklistika", "náročné", "hory", "technické"],
    createdAt: "2025-09-28"
  },
  {
    id: "river-run",
    name: "Beh okolo rieky",
    description: "Relaxačná bežecká trasa pozdĺž rieky s krásnymi prírodními scenériami.",
    sport: "running",
    distance: "12.7 km",
    distanceValue: 12.7,
    difficulty: "easy",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "1h 15m",
    elevation: "↑85 m / ↓90 m",
    previewImage: "/assets/tracks/river-run/preview.png",
    profileImage: "/assets/tracks/river-run/profil.png",
    gpxFile: "/assets/tracks/river-run/track.gpx",
    mapUrl: "https://mapy.com/s/example4",
    tags: ["beh", "rieka", "ľahké", "príroda"],
    createdAt: "2025-09-28"
  }
];

// Simple helper functions
export const getTrackById = (trackId) => {
  const track = tracks.find(track => track.id === trackId) || null;
  if (track) {
    // Add fallback image if preview doesn't load
    track.fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18'%3EObrázok sa načítava...%3C/text%3E%3C/svg%3E";
  }
  return track;
};

export const getAllTracks = () => {
  return tracks.map(track => ({
    ...track,
    fallbackImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18'%3EObrázok sa načítava...%3C/text%3E%3C/svg%3E"
  })); // Return a copy with fallback images
};

export default tracks;
