<template>
  <div class="home-page">
    <div class="hero-section">
      <h1 class="hero-title">Discover Amazing Tracks</h1>
      <p class="hero-subtitle">Find the perfect running, cycling, or hiking routes near you</p>
    </div>

    <div class="container">
      <div class="results-info">
        <p>{{ filteredTracks.length }} tracks found</p>
      </div>

      <div class="tracks-grid">
        <div 
          v-for="track in filteredTracks" 
          :key="track.id"
          class="track-card"
          @click="goToTrack(track.id)"
        >
          <div class="track-image">
            <img :src="track.previewImage" :alt="track.name" />
            <div class="track-badges">
              <span class="sport-badge" :class="track.sport">
                {{ getSportIcon(track.sport) }} {{ track.sport }}
              </span>
              <span class="difficulty-badge" :class="track.difficulty">
                {{ getDifficultyIcon(track.difficulty) }} {{ track.difficulty }}
              </span>
            </div>
          </div>
          
          <div class="track-content">
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
          <h3>No tracks found</h3>
          <p>Try adjusting your filters or search criteria</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import tracksData from '../data/tracks.json'

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
      tracks: tracksData.tracks
    }
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
    getDifficultyIcon(difficulty) {
      const icons = {
        easy: '🟢',
        moderate: '🟡',
        hard: '🔴'
      }
      return icons[difficulty] || '🟡'
    }
  }
}
</script>
