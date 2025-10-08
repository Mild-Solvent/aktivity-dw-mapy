<template>
  <div class="home-page">
    <div class="hero-section">
      <h1 class="hero-title">Objavte Úžasné Trasy</h1>
      <p class="hero-subtitle">Nájdite perfektné bežecké, cyklistické alebo turistické trasy vo vašom okolí</p>
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
                <span class="sport-badge" :title="getSportTitle(track.sport)">
                  {{ getSportIcon(track.sport) }}
                </span>
                <span class="difficulty-badge" :title="getDifficultyTitle(track.difficulty)">
                  {{ getDifficultyIcon(track.difficulty) }}
                </span>
              </div>
              <h3 class="track-title">{{ track.name }}</h3>
              <p class="track-description">{{ track.description }}</p>
              
              <div class="track-stats">
                <div class="stat">
                  <span class="stat-icon">📏</span>
                  <span class="stat-value">{{ track.distance }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-value">{{ track.duration }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⛰️</span>
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
      const icons = {
        cycling: '🚴',
        running: '🏃',
        hiking: '🥾'
      }
      return icons[sport] || '🏃'
    },
    getSportTitle(sport) {
      const titles = {
        cycling: 'Cyklistika',
        running: 'Beh',
        hiking: 'Turistika'
      }
      return titles[sport] || 'Šport'
    },
    getDifficultyIcon(difficulty) {
      const icons = {
        easy: '🟢',
        moderate: '🟡',
        hard: '🔴'
      }
      return icons[difficulty] || '🟡'
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
