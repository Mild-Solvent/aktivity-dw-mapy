// Simple hardcoded tracks data based on actual JSON files
// All data taken directly from the track-info.json files in assets/tracks

export const tracks = [
  {
    id: "inovec-mitice-ostry-vrch",
    name: "Inovec Mitice Ostrý vrch",
    description: "Náročná cyklistická trasa vedúca cez horské oblasti s úžasnými výhľadmi v regióne Slovensko.",
    sport: "cycling",
    distance: "81.7 km",
    distanceValue: 81.7,
    difficulty: "hard",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "5h 32m",
    elevation: "↑1,735 m / ↓1,728 m",
    previewImage: "/assets/tracks/inovec-mitice-ostry-vrch/preview.png",
    profileImage: "/assets/tracks/inovec-mitice-ostry-vrch/profil.png",
    gpxFile: "/assets/tracks/inovec-mitice-ostry-vrch/track.gpx",
    mapUrl: "https://mapy.com/s/robavalovu",
    tags: ["cyklistika", "bicykel", "náročné", "hory", "vrcholy"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "81.7 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑1,735 m / ↓1,728 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Slovensko"
      }
    }
  },
  {
    id: "kolacin-trail-klepac",
    name: "KOLAČIN TRAIL + KLEPÁČ",
    description: "Náročná turistická trasa s krásnym výhľadom na okolité vrcholy v regióne Slovensko.",
    sport: "hiking",
    distance: "29.3 km",
    distanceValue: 29.3,
    difficulty: "hard",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "8h 24m",
    elevation: "↑844 m / ↓852 m",
    previewImage: "/assets/tracks/kolacin-trail-klepac/preview.png",
    profileImage: "/assets/tracks/kolacin-trail-klepac/profil.png",
    gpxFile: "/assets/tracks/kolacin-trail-klepac/track.gpx",
    mapUrl: "https://mapy.com/s/kovelodoze",
    tags: ["turistika", "pešia túra", "náročné", "vrcholy"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "29.3 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑844 m / ↓852 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Slovensko"
      }
    }
  },
  {
    id: "nedasov-brumov-trencin",
    name: "NEDASOV BRUMOV TRENCIN",
    description: "Náročná a výzyvná cyklistická trasa cez krásnu prirodzenú krajinu v regióne Trenčiansky kraj, Slovensko.",
    sport: "cycling",
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
    mapUrl: "https://mapy.com/s/bumahupumo",
    tags: ["cyklistika", "bicykel", "náročné"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "82.9 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑441 m / ↓390 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Trenčiansky kraj, Slovensko"
      }
    }
  },
  {
    id: "nemsova-ibovka-tn-kolacin",
    name: "NEMSOVA - IBOVKA - TN - KOLAČIN",
    description: "Stredne náročná cyklistická trasa vedúca cez malebné mestečká a dediny v regióne Trenčiansky kraj, Slovensko.",
    sport: "cycling",
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
    mapUrl: "https://mapy.com/s/polenudave",
    tags: ["cyklistika", "bicykel", "stredné"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "51.3 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑306 m / ↓305 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Trenčiansky kraj, Slovensko"
      }
    }
  },
  {
    id: "omsenie-dolna-poruba-iliavka",
    name: "OMSENIE - DOLNÁ PORUBA - HORNÁ PORUBA - ILIAVKA",
    description: "Náročná turistická trasa vedúca cez malebné dediny a kopce v regióne Slovensko.",
    sport: "hiking",
    distance: "40.5 km",
    distanceValue: 40.5,
    difficulty: "hard",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "11h 36m",
    elevation: "↑1,034 m / ↓1,029 m",
    previewImage: "/assets/tracks/omsenie-dolna-poruba-iliavka/preview.png",
    profileImage: "/assets/tracks/omsenie-dolna-poruba-iliavka/profil.png",
    gpxFile: "/assets/tracks/omsenie-dolna-poruba-iliavka/track.gpx",
    mapUrl: "https://mapy.com/s/fahujufute",
    tags: ["turistika", "pešia túra", "náročné", "dediny"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "40.5 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑1,034 m / ↓1,029 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Slovensko"
      }
    }
  },
  {
    id: "soblahov-cez-brezinu",
    name: "SOBLAHOV CEZ BREZINU",
    description: "Náročná a výzyvná turistická trasa cez krásnu prirodzenú krajinu v regióne Slovensko.",
    sport: "hiking",
    distance: "51.7 km",
    distanceValue: 51.7,
    difficulty: "hard",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "13h 12m",
    elevation: "↑524 m / ↓516 m",
    previewImage: "/assets/tracks/soblahov-cez-brezinu/preview.png",
    profileImage: "/assets/tracks/soblahov-cez-brezinu/profil.png",
    gpxFile: "/assets/tracks/soblahov-cez-brezinu/track.gpx",
    mapUrl: "https://mapy.com/s/manuhafeja",
    tags: ["turistika", "pešia túra", "náročné"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "51.7 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑524 m / ↓516 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Slovensko"
      }
    }
  },
  {
    id: "suca-sanov-stitna",
    name: "SUCA SANOV STITNA",
    description: "Náročná a výzyvná turistická trasa cez krásnu prirodzenú krajinu v regióne Slovensko.",
    sport: "hiking",
    distance: "69.8 km",
    distanceValue: 69.8,
    difficulty: "hard",
    location: "Slovensko",
    locationRegion: "slovakia",
    duration: "17h 46m",
    elevation: "↑586 m / ↓592 m",
    previewImage: "/assets/tracks/suca-sanov-stitna/preview.png",
    profileImage: "/assets/tracks/suca-sanov-stitna/profil.png",
    gpxFile: "/assets/tracks/suca-sanov-stitna/track.gpx",
    mapUrl: "https://mapy.com/s/febafafenu",
    tags: ["turistika", "pešia túra", "náročné"],
    createdAt: "2025-09-28",
    stats: {
      distance: {
        icon: "📏",
        label: "Vzdialenosť",
        value: "69.8 km"
      },
      elevation: {
        icon: "⛰️",
        label: "Prevýšenie",
        value: "↑586 m / ↓592 m"
      },
      startPoint: {
        icon: "📍",
        label: "START",
        value: "Slovensko"
      }
    }
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
