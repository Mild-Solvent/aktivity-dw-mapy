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
      // Use the imported static data
      this.tracksCache = tracksData.tracks || [];
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
