'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Track } from '@/lib/trackLoader';
import trackLoader from '@/lib/trackLoader';

interface HomePageProps {
  filters: {
    sport: string;
    distance: string;
    difficulty: string;
    location: string;
  };
  searchQuery: string;
}

export default function HomePage({ filters, searchQuery }: HomePageProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const tracksData = await trackLoader.loadAllTracks();
      setTracks(tracksData);
      setError(null);
    } catch (error) {
      console.error('Error loading tracks:', error);
      setError('Chyba pri načítaní trás');
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track => {
    // Apply sport filter
    if (filters.sport && track.sport !== filters.sport) {
      return false;
    }

    // Apply distance filter
    if (filters.distance) {
      const distance = track.distanceValue;
      switch (filters.distance) {
        case 'short':
          if (distance >= 10) return false;
          break;
        case 'medium':
          if (distance < 10 || distance > 20) return false;
          break;
        case 'long':
          if (distance <= 20) return false;
          break;
      }
    }

    // Apply difficulty filter
    if (filters.difficulty && track.difficulty !== filters.difficulty) {
      return false;
    }

    // Apply location filter
    if (filters.location && track.locationRegion !== filters.location) {
      return false;
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !track.name.toLowerCase().includes(query) &&
        !track.description.toLowerCase().includes(query) &&
        !track.location.toLowerCase().includes(query) &&
        !track.tags.some(tag => tag.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    return true;
  });

  const goToTrack = (trackId: string) => {
    router.push(`/track/${trackId}`);
  };

  const getSportIcon = (sport: string) => {
    const icons = {
      cycling: '🚴',
      running: '🏃',
      hiking: '🥾',
    };
    return icons[sport as keyof typeof icons] || '🏃';
  };

  const getSportTitle = (sport: string) => {
    const titles = {
      cycling: 'Cyklistika',
      running: 'Beh',
      hiking: 'Turistika',
    };
    return titles[sport as keyof typeof titles] || 'Šport';
  };

  const getDifficultyIcon = (difficulty: string) => {
    const icons = {
      easy: '🟢',
      moderate: '🟡',
      hard: '🔴',
    };
    return icons[difficulty as keyof typeof icons] || '🟡';
  };

  const getDifficultyTitle = (difficulty: string) => {
    const titles = {
      easy: 'Ľahká',
      moderate: 'Stredná',
      hard: 'Ťažká',
    };
    return titles[difficulty as keyof typeof titles] || 'Stredná';
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <h1 className="hero-title">Objavte Úžasné Trasy</h1>
          <p className="hero-subtitle">
            Nájdite perfektné bežecké, cyklistické alebo turistické trasy vo vašom okolí
          </p>
        </div>

        <div className="container">
          <div className="loading-state">
            <div className="loading-content">
              <div className="loading-spinner">⏳</div>
              <p>Načítavanie trás...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <h1 className="hero-title">Objavte Úžasné Trasy</h1>
          <p className="hero-subtitle">
            Nájdite perfektné bežecké, cyklistické alebo turistické trasy vo vašom okolí
          </p>
        </div>

        <div className="container">
          <div className="error-state">
            <div className="error-content">
              <div className="error-icon">❌</div>
              <h3>Chyba pri načítavaní</h3>
              <p>{error}</p>
              <button onClick={loadTracks} className="retry-button">
                Skúsiť znovu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Objavte Úžasné Trasy</h1>
        <p className="hero-subtitle">
          Nájdite perfektné bežecké, cyklistické alebo turistické trasy vo vašom okolí
        </p>
      </div>

      <div className="container">
        <div className="results-info">
          <p>Výsledkov: {filteredTracks.length}</p>
        </div>

        <div className="tracks-grid">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="track-card"
              onClick={() => goToTrack(track.id)}
            >
              <div className="track-image">
                <Image
                  src={track.previewImage}
                  alt={track.name}
                  width={400}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized
                />
                <div className="track-badges">
                  <span
                    className="sport-badge"
                    title={getSportTitle(track.sport)}
                  >
                    {getSportIcon(track.sport)}
                  </span>
                  <span
                    className="difficulty-badge"
                    title={getDifficultyTitle(track.difficulty)}
                  >
                    {getDifficultyIcon(track.difficulty)}
                  </span>
                </div>
              </div>

              <div className="track-content">
                <h3 className="track-title">{track.name}</h3>
                <p className="track-description">{track.description}</p>

                <div className="track-stats">
                  <div className="stat">
                    <span className="stat-icon">📏</span>
                    <span className="stat-value">{track.distance}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-value">{track.duration}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">⛰️</span>
                    <span className="stat-value">{track.elevation}</span>
                  </div>
                </div>

                <div className="track-location">
                  <span className="location-icon">📍</span>
                  <span className="location-text">{track.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTracks.length === 0 && (
          <div className="no-results">
            <div className="no-results-content">
              <div className="no-results-icon">🔍</div>
              <h3>Neboli nájdené žiadne trasy</h3>
              <p>Skúste upraviť filtre alebo kritériá vyhľadávania</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}