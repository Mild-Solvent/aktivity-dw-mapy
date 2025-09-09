<template>
  <div class="track-detail" v-if="track">
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
          <img :src="track.previewImage" :alt="track.name" class="track-main-image" />
        </div>

        <div class="track-info">
          <p class="track-description">{{ track.description }}</p>
          
          <div class="track-stats-grid">
            <div class="stat-item">
              <div class="stat-icon">📏</div>
              <div class="stat-content">
                <div class="stat-label">Vzdialenosť</div>
                <div class="stat-value">{{ track.distance }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏱️</div>
              <div class="stat-content">
                <div class="stat-label">Trvanie</div>
                <div class="stat-value">{{ track.duration }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⛰️</div>
              <div class="stat-content">
                <div class="stat-label">Prevýšenie</div>
                <div class="stat-value">{{ track.elevation }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📍</div>
              <div class="stat-content">
                <div class="stat-label">Lokalita</div>
                <div class="stat-value">{{ track.location }}</div>
              </div>
            </div>
          </div>

          <div class="track-tags">
            <h3>Značky</h3>
            <div class="tags-list">
              <span v-for="tag in track.tags" :key="tag" class="tag">
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="map-section">
        <h2>Interaktívna mapa</h2>
        <div class="map-container">
          <iframe 
            :src="getEmbedMapUrl()" 
            width="100%" 
            height="400" 
            frameborder="0" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
          <div class="map-overlay">
            <p>📍 Interaktívny pohľad na mapu trasy</p>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <a 
          :href="track.mapUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="action-button primary"
        >
🗺️ Zobraziť na Mapy.com
        </a>
        <button 
          @click="downloadGPX" 
          class="action-button secondary"
        >
📥 Stiahnuť GPX
        </button>
      </div>

      <div class="additional-info">
        <div class="info-section">
          <h3>O tejto trase</h3>
          <p>Vytvorené dňa {{ formatDate(track.createdAt) }}</p>
          <p>Táto trasa ponúka zážitok {{ getDifficultyText(track.difficulty) }} úrovne, ideálny pre nadšencov {{ getSportText(track.sport) }}.</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="track-not-found">
    <div class="not-found-content">
      <div class="not-found-icon">❌</div>
      <h2>Trasa nebola nájdená</h2>
      <p>Požadovanú trasu sa nepodarilo nájsť.</p>
      <button @click="goBack" class="back-button">
← Späť na trasy
      </button>
    </div>
  </div>
</template>

<script>
import tracksData from '../data/tracks.json'

export default {
  name: 'TrackDetail',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  computed: {
    track() {
      return tracksData.tracks.find(track => track.id === this.id)
    }
  },
  methods: {
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
