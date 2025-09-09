<template>
  <!-- Loading State -->
  <div v-if="loading" class="track-loading">
    <div class="loading-content">
      <div class="loading-spinner">⏳</div>
      <p>Načítavanie trasy...</p>
    </div>
  </div>
  
  <!-- Error State -->
  <div v-else-if="error" class="track-error">
    <div class="error-content">
      <div class="error-icon">❌</div>
      <h2>{{ error }}</h2>
      <button @click="goBack" class="back-button">
← Späť na trasy
      </button>
    </div>
  </div>
  
  <!-- Track Content -->
  <div class="track-detail" v-else-if="track">
    <div class="track-header">
      <button @click="goBack" class="back-button">
← Späť na trasy
      </button>
      <div class="track-title-section">
        <h1 class="track-title">{{ track.name }}</h1>
        <div class="track-badges">
          <span class="sport-badge" :class="track.sport">
            {{ getSportIcon(track.sport) }} {{ track.sport }}
          </span>
          <span class="difficulty-badge" :class="track.difficulty">
            {{ getDifficultyIcon(track.difficulty) }} {{ track.difficulty }}
          </span>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="track-content">
        <div class="track-image-section">
          <a 
            :href="track.mapUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="track-image-link"
          >
            <img :src="track.previewImage" :alt="track.name" class="track-main-image" />
          </a>
        </div>

        <div class="track-info">
          <p class="track-description">{{ track.description }}</p>
          
          <div class="track-stats-grid">
            <div class="stat-item" v-if="track.stats?.distance">
              <div class="stat-icon">{{ track.stats.distance.icon }}</div>
              <div class="stat-content">
                <div class="stat-label">{{ track.stats.distance.label }}</div>
                <div class="stat-value">{{ track.stats.distance.value }}</div>
              </div>
            </div>
            <div class="stat-item" v-if="track.stats?.duration">
              <div class="stat-icon">{{ track.stats.duration.icon }}</div>
              <div class="stat-content">
                <div class="stat-label">{{ track.stats.duration.label }}</div>
                <div class="stat-value">{{ track.stats.duration.value }}</div>
              </div>
            </div>
            <div class="stat-item" v-if="track.stats?.elevation">
              <div class="stat-icon">{{ track.stats.elevation.icon }}</div>
              <div class="stat-content">
                <div class="stat-label">{{ track.stats.elevation.label }}</div>
                <div class="stat-value">{{ track.stats.elevation.value }}</div>
              </div>
            </div>
            <div class="stat-item" v-if="track.stats?.startPoint">
              <div class="stat-icon">{{ track.stats.startPoint.icon }}</div>
              <div class="stat-content">
                <div class="stat-label">{{ track.stats.startPoint.label }}</div>
                <div class="stat-value">{{ track.stats.startPoint.value }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>


      <div class="action-buttons">
        <button 
          @click="downloadGPX" 
          class="action-button secondary"
        >
📥 Stiahnúť GPX
        </button>
      </div>

      <div class="additional-info">
        <div class="info-section">
          <h3>{{ track.about?.title || 'O tejto trase' }}</h3>
          <p>{{ track.about?.createdText || ('Vytvorené dňa ' + formatDate(track.createdAt)) }}</p>
          <p>{{ track.about?.experienceText || ('Táto trasa ponúka zážitok ' + getDifficultyText(track.difficulty) + ' úrovne, ideálny pre nadšencov ' + getSportText(track.sport) + '.') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import trackLoader from '../utils/trackLoader.js'

export default {
  name: 'TrackDetail',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      track: null,
      loading: true,
      error: null
    }
  },
  async mounted() {
    await this.loadTrack()
  },
  watch: {
    id: {
      handler: 'loadTrack',
      immediate: false
    }
  },
  methods: {
    async loadTrack() {
      try {
        this.loading = true
        this.track = await trackLoader.getTrackById(this.id)
        if (!this.track) {
          this.error = 'Trasa nebola nájdená'
        } else {
          this.error = null
        }
      } catch (error) {
        console.error('Error loading track:', error)
        this.error = 'Chyba pri načítaní trasy'
      } finally {
        this.loading = false
      }
    },
    goBack() {
      this.$router.push('/')
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
    },
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString(undefined, options)
    },
    getEmbedMapUrl() {
      // For demo purposes, we'll use the main map URL
      // In a real implementation, you'd want to use the embed URL
      return this.track?.mapUrl || 'https://mapy.com/s/gokolovofa'
    },
    downloadGPX() {
      if (this.track && this.track.gpxFile) {
        // Create a temporary anchor element for download
        const link = document.createElement('a')
        link.href = this.track.gpxFile
        link.download = `${this.track.name}.gpx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    getDifficultyText(difficulty) {
      const translations = {
        easy: 'ľahkej',
        moderate: 'strednej',
        hard: 'ťažkej'
      }
      return translations[difficulty] || 'strednej'
    },
    getSportText(sport) {
      const translations = {
        cycling: 'cyklistiky',
        running: 'behu',
        hiking: 'turistiky'
      }
      return translations[sport] || 'sportu'
    }
  }
}
</script>
