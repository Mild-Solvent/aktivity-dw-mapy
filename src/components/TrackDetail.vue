<template>
  <!-- Loading State -->
  <div v-if="loading" class="track-loading">
    <div class="loading-content">
      <div class="loading-spinner">⏳</div>
      <p>Načítavam trasu...</p>
    </div>
  </div>
  
  <!-- Error State -->
  <div v-else-if="error" class="track-error">
    <div class="error-content">
      <div class="error-icon">❌</div>
      <h2>{{ error }}</h2>
      <button @click="goBack" class="back-button">
← Späť na zoznam trás
      </button>
    </div>
  </div>
  
  <!-- Track Content -->
  <div class="track-detail" v-else-if="track">
    <div class="track-header">
      <button @click="goBack" class="back-button">
← Späť na zoznam trás
      </button>
      <div class="track-title-section">
        <h1 class="track-title">{{ track.name }}</h1>
        <div class="track-meta-badges">
          <span class="meta-badge sport-meta" :title="getSportTitle(track)">
            <img class="meta-icon" :src="getSportIcon(track)" :alt="getSportTitle(track)" /> {{ getSportTitle(track) }}
          </span>
          <span class="meta-badge difficulty-meta" :title="getDifficultyTitle(track.difficulty)">
            <img class="meta-icon" :src="getDifficultyIcon(track.difficulty)" :alt="getDifficultyTitle(track.difficulty)" /> {{ getDifficultyTitle(track.difficulty) }}
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
          
          <div class="track-stats-unified">
            <div class="unified-stat-item">
              <img class="stat-icon" src="/assets/icons/lenght-of-track.jpg" alt="Vzdialenosť" />
              <div class="stat-content">
                <div class="stat-label">Vzdialenosť</div>
                <div class="stat-value">{{ track.distance }}</div>
              </div>
            </div>
            <div class="stat-separator"></div>
            <div class="unified-stat-item">
              <img class="stat-icon" src="/assets/icons/duration.jpg" alt="Trvanie" />
              <div class="stat-content">
                <div class="stat-label">Trvanie</div>
                <div class="stat-value">{{ track.duration }}</div>
              </div>
            </div>
            <div class="stat-separator"></div>
            <div class="unified-stat-item">
              <img class="stat-icon" src="/assets/icons/profil-elevation.jpg" alt="Prevýšenie" />
              <div class="stat-content">
                <div class="stat-label">Prevýšenie</div>
                <div class="stat-value">{{ track.elevation }}</div>
              </div>
            </div>
          </div>

          <div class="track-map-action" v-if="track.mapUrl">
            <a
              :href="track.mapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="action-button primary"
            >
              Otvoriť trasu na Mapy.com
            </a>
          </div>

        </div>
      </div>
      
      <!-- Tlačidlo na stiahnutie GPX -->
      <div class="action-buttons" v-if="track.gpxFile">
        <button 
          @click="downloadGPX" 
          class="action-button secondary"
        >
📥 Stiahnúť GPX
        </button>
      </div>


      <!-- Profile Image Section -->
      <div class="profile-section" v-if="track.profileImage && showProfileImage">
        <h3>Profil trasy</h3>
        <div class="profile-image-container">
          <img 
            :src="track.profileImage" 
            :alt="`Profil trasy ${track.name}`" 
            class="profile-image"
            @error="handleProfileImageError"
          />
        </div>
      </div>

      <!-- Gallery Section -->
      <div class="gallery-section">
        <h3>Galéria obrázkov</h3>
        <div class="gallery-container" v-if="validGalleryImages.length > 0">
          <div 
            v-for="(image, index) in validGalleryImages" 
            :key="index" 
            class="gallery-item"
            @click="openImageModal(image, index)"
          >
            <img 
              :src="image" 
              :alt="`Obrázok z trasy ${track.name} ${index + 1}`" 
              class="gallery-image"
            />
          </div>
        </div>
        <div class="no-images-message" v-else>
          <p>Žiadne fotografie z tejto trasy</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { getTrackById } from '../data/tracks.js'
import { getAdminTrailById } from '../data/customTrails'

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
      error: null,
      validGalleryImages: [],
      showProfileImage: true,
      imageModal: {
        show: false,
        currentImage: null,
        currentIndex: 0
      }
    }
  },
  mounted() {
    this.loadTrack()
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
        this.track = getTrackById(this.id) || await getAdminTrailById(this.id)
        if (!this.track) {
          this.error = 'Trasu sa nepodarilo nájsť'
        } else {
          this.error = null
          this.validGalleryImages = this.track.galleryImages || []
        }
      } catch (error) {
        console.error('Error loading track:', error)
        this.error = 'Nepodarilo sa načítať trasu'
      } finally {
        this.loading = false
      }
    },
    goBack() {
      this.$router.push('/')
    },
    getSportIcon(track) {
      // All tracks are MTB tracks now
      return '/assets/icons/icon-for-mtb.jpg'
    },
    getDifficultyIcon(difficulty) {
      const icons = {
        beginner: '/assets/icons/easy bike-track.jpg',
        easy: '/assets/icons/easy bike-track.jpg',
        moderate: '/assets/icons/medium-bike-track.jpg',
        hard: '/assets/icons/harb-bike-track.jpg',
        expert: '/assets/icons/harb-bike-track.jpg'
      }
      return icons[difficulty] || '/assets/icons/medium-bike-track.jpg'
    },
    getSportTitle(track) {
      const titles = {
        mtb: 'MTB trasa',
        'cross-country': 'Cross-country / XC',
        enduro: 'Enduro',
        downhill: 'Zjazd',
        gravel: 'Gravel',
        road: 'Cestná cyklistika',
        trekking: 'Trek / turistická',
        'e-bike': 'E-bike'
      }

      return titles[track?.bikeType] || 'MTB Cyklistika'
    },
    getDifficultyTitle(difficulty) {
      const titles = {
        beginner: 'Začiatočník',
        easy: 'Ľahká',
        moderate: 'Stredná',
        hard: 'Ťažká',
        expert: 'Expertná'
      }
      return titles[difficulty] || 'Náročnosť'
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
    async downloadGPX() {
      if (this.track && this.track.gpxFile) {
        const fileName = this.track.gpxFileName || `${this.track.name}.gpx`
        const link = document.createElement('a')
        let objectUrl = ''

        try {
          const response = await fetch(this.track.gpxFile)
          if (!response.ok) {
            throw new Error('Download failed')
          }

          const blob = await response.blob()
          objectUrl = window.URL.createObjectURL(blob)
          link.href = objectUrl
        } catch (error) {
          link.href = this.track.gpxFile
        } finally {
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          if (objectUrl) {
            window.URL.revokeObjectURL(objectUrl)
          }
        }
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
    },
    handleProfileImageError() {
      // Hide profile image section if image fails to load
      this.showProfileImage = false
    },
    openImageModal(image, index) {
      this.imageModal = {
        show: true,
        currentImage: image,
        currentIndex: index
      }
    },
    closeImageModal() {
      this.imageModal.show = false
    },
    nextImage() {
      if (this.imageModal.currentIndex < this.validGalleryImages.length - 1) {
        this.imageModal.currentIndex++
        this.imageModal.currentImage = this.validGalleryImages[this.imageModal.currentIndex]
      }
    },
    prevImage() {
      if (this.imageModal.currentIndex > 0) {
        this.imageModal.currentIndex--
        this.imageModal.currentImage = this.validGalleryImages[this.imageModal.currentIndex]
      }
    }
  }
}
</script>
