// Dynamic track loader utility
// This utility scans the assets/tracks folder and loads track data dynamically

class TrackLoader {
  constructor() {
    this.tracksCache = null;
    this.baseAssetsPath = '/aktivity-dw-mapy/assets/tracks';
    // Use Vite's import.meta.glob to get all track info files at build time
    this.trackInfoModules = import.meta.glob('../../assets/tracks/*/track-info.json');
  }

  // Get all available track folders from assets
  getAvailableTrackFolders() {
    // Extract track IDs from the glob patterns
    const trackIds = Object.keys(this.trackInfoModules).map(path => {
      // Extract track ID from path like '../../assets/tracks/vrsatec/track-info.json'
      const matches = path.match(/\/tracks\/([^/]+)\/track-info\.json$/);
      return matches ? matches[1] : null;
    }).filter(id => id !== null);
    
    return trackIds;
  }

  // Load track info from a specific track folder
  async loadTrackInfo(trackId) {
    try {
      // Find the correct module for this track ID
      const modulePath = Object.keys(this.trackInfoModules).find(path => 
        path.includes(`/tracks/${trackId}/track-info.json`)
      );
      
      if (!modulePath) {
        throw new Error(`No track-info.json found for ${trackId}`);
      }
      
      // Load the module
      const module = await this.trackInfoModules[modulePath]();
      const trackInfo = module.default;
      
      // Convert relative paths to absolute paths
      trackInfo.previewImage = `${this.baseAssetsPath}/${trackId}/${trackInfo.previewImage.replace('./', '')}`;
      trackInfo.gpxFile = `${this.baseAssetsPath}/${trackId}/${trackInfo.gpxFile.replace('./', '')}`;
      
      return trackInfo;
    } catch (error) {
      console.error(`Error loading track info for ${trackId}:`, error);
      return null;
    }
  }

  // Load all available tracks
  async loadAllTracks() {
    if (this.tracksCache) {
      return this.tracksCache;
    }

    try {
      const trackFolders = this.getAvailableTrackFolders();
      const trackPromises = trackFolders.map(trackId => this.loadTrackInfo(trackId));
      const trackResults = await Promise.all(trackPromises);
      
      // Filter out null results (failed loads)
      this.tracksCache = trackResults.filter(track => track !== null);
      
      return this.tracksCache;
    } catch (error) {
      console.error('Error loading all tracks:', error);
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

  // Add a new track (for when new folders are added)
  async addTrack(trackId) {
    const trackInfo = await this.loadTrackInfo(trackId);
    if (trackInfo && this.tracksCache) {
      // Check if track already exists
      const existingIndex = this.tracksCache.findIndex(track => track.id === trackId);
      if (existingIndex >= 0) {
        // Update existing track
        this.tracksCache[existingIndex] = trackInfo;
      } else {
        // Add new track
        this.tracksCache.push(trackInfo);
      }
    }
    return trackInfo;
  }
}

// Create and export singleton instance
export const trackLoader = new TrackLoader();
export default trackLoader;
