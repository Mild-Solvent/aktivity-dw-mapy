<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <!-- Desktop layout - logos on sides -->
        <img src="/assets/icons/aktivity-dw-logo.png" alt="Activity DW Logo" class="hero-logo hero-logo-left hero-logo-desktop">
        <div class="hero-text">
          <h1 class="hero-title">Objavte Úžasné Trasy</h1>
          <p class="hero-subtitle">Nájdite perfektné bežecké, cyklistické alebo turistické trasy vo vašom okolí</p>
        </div>
        <a href="https://www.ceaeurope.sk/" target="_blank" rel="noopener noreferrer" class="hero-logo-link hero-logo-desktop">
          <img src="/assets/icons/logo-cea.png" alt="CEA Logo" class="hero-logo hero-logo-right">
        </a>
        
        <!-- Mobile layout - logos together -->
        <div class="hero-logos-container hero-logo-mobile">
          <img src="/assets/icons/aktivity-dw-logo.png" alt="Activity DW Logo" class="hero-logo hero-logo-left">
          <a href="https://www.ceaeurope.sk/" target="_blank" rel="noopener noreferrer" class="hero-logo-link">
            <img src="/assets/icons/logo-cea.png" alt="CEA Logo" class="hero-logo hero-logo-right">
          </a>
        </div>
      </div>
      <div class="footer-image">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
            </div>
    </div>

    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">⏳</div>
          <p>Načítavanie trás...</p>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <div class="error-icon">❌</div>
          <h3>Chyba pri načítavaní</h3>
          <p>{{ error }}</p>
          <button @click="loadTracks" class="retry-button">Skúsiť znovu</button>
        </div>
      </div>
      
      <!-- Main Content -->
      <div v-else>
        <div class="results-info">
          <p>Výsledkov: {{ filteredTracks.length }}</p>
        </div>

        <div class="tracks-grid">
          <div 
            v-for="track in filteredTracks" 
            :key="track.id"
            class="track-card"
            @click="goToTrack(track.id)"
          >
            <div class="track-image">
              <img 
                :src="track.previewImage" 
                :alt="track.name" 
                @error="handleImageError($event, track)"
              />
            </div>
            
            <div class="track-content">
              <div class="track-badges">
                <img class="sport-icon" :src="getSportIcon(track.sport)" :alt="getSportTitle(track.sport)" :title="getSportTitle(track.sport)" />
                <img class="difficulty-icon" :src="getDifficultyIcon(track.difficulty)" :alt="getDifficultyTitle(track.difficulty)" :title="getDifficultyTitle(track.difficulty)" />
              </div>
              <h3 class="track-title">{{ track.name }}</h3>
              <p class="track-description">{{ track.description }}</p>
              
              <div class="track-stats">
                <div class="stat">
                  <img class="stat-icon" src="/assets/icons/lenght-of-track.jpg" alt="Length" />
                  <span class="stat-value">{{ track.distance }}</span>
                </div>
                <div class="stat">
                  <img class="stat-icon" src="/assets/icons/duration.jpg" alt="Duration" />
                  <span class="stat-value">{{ track.duration }}</span>
                </div>
                <div class="stat">
                  <img class="stat-icon" src="/assets/icons/profil-elevation.jpg" alt="Elevation" />
                  <span class="stat-value">{{ track.elevation }}</span>
                </div>
              </div>
              
              <div class="track-location">
                <span class="location-icon">📍</span>
                <span class="location-text">{{ track.location }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredTracks.length === 0" class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon">🔍</div>
            <h3>Neboli nájdené žiadne trasy</h3>
            <p>Skúste upraviť filtre alebo kritériá vyhľadávania</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllTracks } from '../data/tracks.js'

export default {
  name: 'HomePage',
  props: {
    filters: {
      type: Object,
      default: () => ({})
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      tracks: [],
      loading: true,
      error: null
    }
  },
  mounted() {
    this.loadTracks()
  },
  computed: {
    filteredTracks() {
      let filtered = this.tracks

      // Apply sport filter
      if (this.filters.sport) {
        filtered = filtered.filter(track => track.sport === this.filters.sport)
      }

      // Apply distance filter
      if (this.filters.distance) {
        filtered = filtered.filter(track => {
          const distance = track.distanceValue
          switch (this.filters.distance) {
            case 'short': return distance < 10
            case 'medium': return distance >= 10 && distance <= 20
            case 'long': return distance > 20
            default: return true
          }
        })
      }

      // Apply difficulty filter
      if (this.filters.difficulty) {
        filtered = filtered.filter(track => track.difficulty === this.filters.difficulty)
      }

      // Apply location filter
      if (this.filters.location) {
        filtered = filtered.filter(track => track.locationRegion === this.filters.location)
      }

      // Apply search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(track => 
          track.name.toLowerCase().includes(query) ||
          track.description.toLowerCase().includes(query) ||
          track.location.toLowerCase().includes(query) ||
          track.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }

      return filtered
    }
  },
  methods: {
    loadTracks() {
      try {
        this.loading = true
        this.tracks = getAllTracks()
        this.error = null
      } catch (error) {
        console.error('Error loading tracks:', error)
        this.error = 'Chyba pri načítaní trás'
      } finally {
        this.loading = false
      }
    },
    goToTrack(trackId) {
      this.$router.push({ name: 'TrackDetail', params: { id: trackId } })
    },
    getSportIcon(sport) {
      // All tracks are MTB tracks now
      return '/assets/icons/icon-for-mtb.jpg'
    },
    getSportTitle(sport) {
      // All tracks are MTB tracks now
      return 'MTB Cyklistika'
    },
    getDifficultyIcon(difficulty) {
      const icons = {
        easy: '/assets/icons/easy bike-track.jpg',
        moderate: '/assets/icons/medium-bike-track.jpg',
        hard: '/assets/icons/harb-bike-track.jpg'
      }
      return icons[difficulty] || '/assets/icons/medium-bike-track.jpg'
    },
    getDifficultyTitle(difficulty) {
      const titles = {
        easy: 'Ľahká',
        moderate: 'Stredná',
        hard: 'Náročná'
      }
      return titles[difficulty] || 'Náročnosť'
    },
    handleImageError(event, track) {
      // Use fallback image if main image fails to load
      if (track.fallbackImage) {
        event.target.src = track.fallbackImage
      }
    }
  }
}
</script>
