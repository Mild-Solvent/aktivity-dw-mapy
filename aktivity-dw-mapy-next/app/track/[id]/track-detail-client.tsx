'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Track } from '@/lib/trackLoader';
import trackLoader from '@/lib/trackLoader';

export default function TrackDetailClient() {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const trackId = params.id as string;

  useEffect(() => {
    loadTrack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  const loadTrack = async () => {
    try {
      setLoading(true);
      const trackData = await trackLoader.getTrackById(trackId);
      if (trackData) {
        setTrack(trackData);
        setError(null);
      } else {
        setError('Trasa nebola nájdená');
      }
    } catch (error) {
      console.error('Error loading track:', error);
      setError('Chyba pri načítaní trasy');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
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
      <div id="app">
        <Header 
          filters={{ sport: '', distance: '', difficulty: '', location: '' }}
          searchQuery=""
          onFiltersChange={() => {}}
          onSearchChange={() => {}}
        />
        
        <main className="main-content">
          <div className="container">
            <div className="loading-state">
              <div className="loading-content">
                <div className="loading-spinner">⏳</div>
                <p>Načítavanie trasy...</p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (error || !track) {
    return (
      <div id="app">
        <Header 
          filters={{ sport: '', distance: '', difficulty: '', location: '' }}
          searchQuery=""
          onFiltersChange={() => {}}
          onSearchChange={() => {}}
        />
        
        <main className="main-content">
          <div className="container">
            <div className="error-state">
              <div className="error-content">
                <div className="error-icon">❌</div>
                <h3>Chyba pri načítavaní</h3>
                <p>{error}</p>
                <button onClick={loadTrack} className="retry-button">
                  Skúsiť znovu
                </button>
                <button onClick={goBack} className="retry-button" style={{ marginTop: '1rem', background: '#666' }}>
                  ← Späť
                </button>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div id="app">
      <Header 
        filters={{ sport: '', distance: '', difficulty: '', location: '' }}
        searchQuery=""
        onFiltersChange={() => {}}
        onSearchChange={() => {}}
      />
      
      <main className="main-content">
        <div className="track-detail">
          <div className="track-header" style={{ 
            background: 'var(--primary)',
            color: 'var(--text-white)',
            padding: '2rem 0',
            position: 'relative'
          }}>
            <div className="container">
              <button onClick={goBack} className="back-button" style={{ 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                marginBottom: '2rem',
                transition: 'all 0.3s ease'
              }}>
                ← Späť
              </button>
              
              <div className="track-title-section">
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                  {track.name}
                </h1>
                <p style={{ fontSize: '1.1rem', opacity: '0.9', marginBottom: '2rem' }}>
                  {track.description}
                </p>
                
                <div className="track-meta-badges" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '1rem', 
                  flexWrap: 'wrap' 
                }}>
                  <span className="meta-badge" style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {getSportIcon(track.sport)} {getSportTitle(track.sport)}
                  </span>
                  <span className="meta-badge" style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {getDifficultyIcon(track.difficulty)} {getDifficultyTitle(track.difficulty)}
                  </span>
                  <span className="meta-badge" style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📏 {track.distance}
                  </span>
                  <span className="meta-badge" style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ⏱️ {track.duration}
                  </span>
                  <span className="meta-badge" style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ⛰️ {track.elevation}
                  </span>
                  <span className="meta-badge" style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📍 {track.location}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="container" style={{ padding: '3rem 1rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr',
              gap: '3rem',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              <div className="track-image-section">
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  Náhľad trasy
                </h2>
                <div style={{ 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  marginBottom: '2rem'
                }}>
                  <Image
                    src={track.previewImage}
                    alt={track.name}
                    width={1000}
                    height={600}
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>
              </div>

              <div className="track-actions" style={{ 
                display: 'flex', 
                gap: '1rem', 
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <a
                  href={track.gpxFile}
                  download
                  className="action-button"
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  📥 Stiahnuť GPX
                </a>
                <a
                  href={track.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button"
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  🗺️ Otvoriť mapu
                </a>
              </div>

              {track.tags && track.tags.length > 0 && (
                <div className="track-tags">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Štítky
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {track.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}