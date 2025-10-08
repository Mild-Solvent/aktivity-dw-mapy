// Track loader utility
// This utility loads track data from the static tracks.json file

import tracksData from '../data/tracks.json';

class TrackLoader {
  constructor() {
    this.tracksCache = null;
  }

  // Load all available tracks from static data
  async loadAllTracks() {
    if (this.tracksCache) {
      return this.tracksCache;
    }

    try {
      // Use the imported static data and adjust paths for dev vs prod
      const tracks = tracksData.tracks || [];
      
      // In development, remove the /aktivity-dw-mapy prefix from paths
      const isDev = import.meta.env.DEV;
      
      // Available track folders that actually have assets
      const availableTrackIds = [
        'inovec-mitice-ostry-vrch',
        'kolacin-trail-klepac',
        'nedasov-brumov-trencin',
        'nemsova-ibovka-tn-kolacin',
        'omsenie-dolna-poruba-iliavka',
        'soblahov-cez-brezinu',
        'suca-sanov-stitna'
      ];
      
      // Filter tracks to only include those with existing assets and map track IDs
      const trackIdMapping = {
        'kolačin-trail-klepáč': 'kolacin-trail-klepac',
        'nemsova---ibovka---tn---kolačin': 'nemsova-ibovka-tn-kolacin',
        'omsenie---dolna-poruba---iliavka': 'omsenie-dolna-poruba-iliavka'
      };
      
      this.tracksCache = tracks
        .filter(track => {
          const mappedId = trackIdMapping[track.id] || track.id;
          return availableTrackIds.includes(mappedId);
        })
        .map(track => {
          const mappedId = trackIdMapping[track.id] || track.id;
          const adjustedTrack = {
            ...track,
            previewImage: isDev 
              ? `/assets/tracks/${mappedId}/preview.png`
              : `/aktivity-dw-mapy/assets/tracks/${mappedId}/preview.png`,
            gpxFile: isDev 
              ? `/assets/tracks/${mappedId}/track.gpx`
              : `/aktivity-dw-mapy/assets/tracks/${mappedId}/track.gpx`
          };
          
          // Debug logging
          if (isDev) {
            console.log('Track:', track.id, '-> mapped to:', mappedId);
            console.log('Preview path:', adjustedTrack.previewImage);
          }
          
          return adjustedTrack;
        });
      
      return this.tracksCache;
    } catch (error) {
      console.error('Error loading tracks:', error);
      return [];
    }
  }

  // Get a specific track by ID
  async getTrackById(trackId) {
    const tracks = await this.loadAllTracks();
    return tracks.find(track => track.id === trackId) || null;
  }

  // Clear cache to force reload
  clearCache() {
    this.tracksCache = null;
  }
}

// Create and export singleton instance
export const trackLoader = new TrackLoader();
export default trackLoader;
