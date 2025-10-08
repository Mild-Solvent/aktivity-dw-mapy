export interface Track {
  id: string;
  name: string;
  description: string;
  sport: 'cycling' | 'running' | 'hiking';
  distance: string;
  distanceValue: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  location: string;
  locationRegion: string;
  duration: string;
  elevation: string;
  previewImage: string;
  gpxFile: string;
  mapUrl: string;
  tags: string[];
  createdAt: string;
}

class TrackLoader {
  private tracksCache: Track[] | null = null;

  // Available track IDs that have assets in public/tracks folder
  private readonly availableTrackIds = [
    'inovec-mitice-ostry-vrch',
    'kolacin-trail-klepac', 
    'nedasov-brumov-trencin',
    'nemsova-ibovka-tn-kolacin',
    'omsenie-dolna-poruba-iliavka',
    'soblahov-cez-brezinu',
    'suca-sanov-stitna'
  ];

  // Load all available tracks from static data in public/tracks folder
  async loadAllTracks(): Promise<Track[]> {
    if (this.tracksCache) {
      return this.tracksCache;
    }

    try {
      // Detect environment
      const isDev = process.env.NODE_ENV !== 'production';
      const basePath = isDev ? '' : '/aktivity-dw-mapy';
      
      console.log('Loading tracks from public folder:', {
        isDev,
        basePath,
        nodeEnv: process.env.NODE_ENV
      });
      
      // Load track data from individual track-info.json files
      const tracks: Track[] = [];
      
      for (const trackId of this.availableTrackIds) {
        try {
          // In production, we can't use fs, so we need to have the data available
          // We'll import the track info statically
          const trackInfo = await this.loadTrackInfo(trackId, basePath);
          if (trackInfo) {
            tracks.push(trackInfo);
          }
        } catch (error) {
          console.error(`Error loading track ${trackId}:`, error);
        }
      }
      
      this.tracksCache = tracks;
      console.log(`Loaded ${tracks.length} tracks successfully`);
      return this.tracksCache;
    } catch (error) {
      console.error('Error loading tracks:', error);
      return [];
    }
  }

  private async loadTrackInfo(trackId: string, basePath: string): Promise<Track | null> {
    try {
      // For static export, we need to have the track data available at build time
      // We'll create a static mapping of the track data
      const trackData = this.getStaticTrackData(trackId);
      
      if (!trackData) {
        return null;
      }

      // Create full track object with correct paths
      const track: Track = {
        ...trackData,
        previewImage: `${basePath}/tracks/${trackId}/preview.png`,
        gpxFile: `${basePath}/tracks/${trackId}/track.gpx`
      };

      return track;
    } catch (error) {
      console.error(`Error loading track info for ${trackId}:`, error);
      return null;
    }
  }

  private getStaticTrackData(trackId: string): Omit<Track, 'previewImage' | 'gpxFile'> | null {
    const tracksData: Record<string, Omit<Track, 'previewImage' | 'gpxFile'>> = {
      'inovec-mitice-ostry-vrch': {
        id: 'inovec-mitice-ostry-vrch',
        name: 'Inovec Mitice Ostrý vrch',
        description: 'Náročná turistická trasa vedúca cez horské oblasti s úžasnými výhľadmi v regióne Inovec, Slovensko.',
        sport: 'hiking',
        distance: '81.7 km',
        distanceValue: 81.7,
        difficulty: 'hard',
        location: 'Inovec, Slovensko',
        locationRegion: 'slovakia',
        duration: '21h 23m',
        elevation: '↑1,735 m / ↓1,728 m',
        mapUrl: 'https://mapy.com/s/robavalovu',
        tags: ['turistika', 'pešia túra', 'náročné', 'hory', 'vrchol'],
        createdAt: '2025-09-28'
      },
      'kolacin-trail-klepac': {
        id: 'kolacin-trail-klepac',
        name: 'KOLAČIN TRAIL + KLEPÁČ',
        description: 'Stredne náročná cyklistická trasa cez technický terén v regióne Kolačín, Slovensko.',
        sport: 'cycling',
        distance: '29.3 km',
        distanceValue: 29.3,
        difficulty: 'moderate',
        location: 'Kolačín, Slovensko',
        locationRegion: 'slovakia',
        duration: '2h 05m',
        elevation: '↑844 m / ↓852 m',
        mapUrl: 'https://mapy.com/s/kovelodoze',
        tags: ['cyklistika', 'bicykel', 'stredné', 'trail'],
        createdAt: '2025-09-28'
      },
      'nedasov-brumov-trencin': {
        id: 'nedasov-brumov-trencin',
        name: 'NEDAŠOV - BRUMOV TRENČÍN',
        description: 'Stredne náročná turistická trasa cez krásnu prirodzenú krajinu v regióne Trenčín, Slovensko.',
        sport: 'hiking',
        distance: '41.8 km',
        distanceValue: 41.8,
        difficulty: 'moderate',
        location: 'Trenčín, Slovensko',
        locationRegion: 'slovakia',
        duration: '10h 48m',
        elevation: '↑1,092 m / ↓1,096 m',
        mapUrl: 'https://mapy.com/s/nabavukese',
        tags: ['turistika', 'pešia túra', 'stredné'],
        createdAt: '2025-09-28'
      },
      'nemsova-ibovka-tn-kolacin': {
        id: 'nemsova-ibovka-tn-kolacin',
        name: 'NEMSOVA - IBOVKA - TN - KOLAČIN',
        description: 'Stredne náročná cyklistická trasa vedúca cez viaceré obce v regióne Slovensko.',
        sport: 'cycling',
        distance: '49.7 km',
        distanceValue: 49.7,
        difficulty: 'moderate',
        location: 'Slovensko',
        locationRegion: 'slovakia',
        duration: '3h 31m',
        elevation: '↑893 m / ↓896 m',
        mapUrl: 'https://mapy.com/s/gozuneboce',
        tags: ['cyklistika', 'bicykel', 'stredné'],
        createdAt: '2025-09-28'
      },
      'omsenie-dolna-poruba-iliavka': {
        id: 'omsenie-dolna-poruba-iliavka',
        name: 'ONŠENIE - DOLNÁ PORUBA - HORNBÁ PORUBA - ILIAVKA',
        description: 'Stredne náročná turistická trasa cez viaceré obce v regióne Slovensko.',
        sport: 'hiking',
        distance: '81.6 km',
        distanceValue: 81.6,
        difficulty: 'moderate',
        location: 'Slovensko',
        locationRegion: 'slovakia',
        duration: '21h 21m',
        elevation: '↑1,474 m / ↓1,474 m',
        mapUrl: 'https://mapy.com/s/memaferoza',
        tags: ['turistika', 'pešia túra', 'stredné'],
        createdAt: '2025-09-28'
      },
      'soblahov-cez-brezinu': {
        id: 'soblahov-cez-brezinu',
        name: 'SOBLAHOV CEZ BREZINU',
        description: 'Stredne náročná cyklistická trasa cez krásnu prirodzenú krajinu v regióne Slovensko.',
        sport: 'cycling',
        distance: '67.8 km',
        distanceValue: 67.8,
        difficulty: 'moderate',
        location: 'Slovensko',
        locationRegion: 'slovakia',
        duration: '4h 48m',
        elevation: '↑1,346 m / ↓1,346 m',
        mapUrl: 'https://mapy.com/s/lefapaloro',
        tags: ['cyklistika', 'bicykel', 'stredné'],
        createdAt: '2025-09-28'
      },
      'suca-sanov-stitna': {
        id: 'suca-sanov-stitna',
        name: 'SÚČA - ŠANOV - ŠTÍTNÁ',
        description: 'Jednoduchá cyklistická trasa cez krásnu prirodzenú krajinu v regióne Slovensko.',
        sport: 'cycling',
        distance: '34.3 km',
        distanceValue: 34.3,
        difficulty: 'easy',
        location: 'Slovensko',
        locationRegion: 'slovakia',
        duration: '2h 27m',
        elevation: '↑339 m / ↓339 m',
        mapUrl: 'https://mapy.com/s/rurekozale',
        tags: ['cyklistika', 'bicykel', 'ľahké'],
        createdAt: '2025-09-28'
      }
    };

    return tracksData[trackId] || null;
  }

  // Get a specific track by ID
  async getTrackById(trackId: string): Promise<Track | null> {
    const tracks = await this.loadAllTracks();
    return tracks.find(track => track.id === trackId) || null;
  }

  // Clear cache to force reload
  clearCache(): void {
    this.tracksCache = null;
  }
}

// Create and export singleton instance
export const trackLoader = new TrackLoader();
export default trackLoader;