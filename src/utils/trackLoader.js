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
      // Use the imported static data and adjust paths
      const tracks = tracksData.tracks || [];
      
      // Detect environment more reliably
      const isDev = import.meta.env.DEV;
      const currentPath = window?.location?.pathname || '';
      const isGitHubPages = currentPath.includes('/aktivity-dw-mapy/') || !isDev;
      
      console.log('Environment detection:', {
        isDev,
        currentPath,
        isGitHubPages
      });
      
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
      
      // Filter tracks to only include those with existing assets
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
          
          // Use different base paths based on deployment
          const basePath = isGitHubPages ? '/aktivity-dw-mapy' : '';
          
          const adjustedTrack = {
            ...track,
            previewImage: `${basePath}/assets/tracks/${mappedId}/preview.png`,
            gpxFile: `${basePath}/assets/tracks/${mappedId}/track.gpx`
          };
          
          console.log('Track processed:', {
            original: track.id,
            mapped: mappedId,
            previewPath: adjustedTrack.previewImage
          });
          
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
