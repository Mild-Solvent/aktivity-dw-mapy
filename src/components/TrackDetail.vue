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
      <div class="container">
        <div class="header-nav-line">
          <button @click="goBack" class="back-button">
            ← Späť na zoznam trás
          </button>
          <button 
            v-if="track.gpxFile"
            @click="downloadGPX" 
            class="header-gpx-button"
          >
            📥 Stiahnuť GPX
          </button>
        </div>
        <div class="track-title-section">
          <h1 class="track-title">{{ track.name }}</h1>
          <div class="track-meta-badges">
            <span class="meta-badge sport-meta" :title="getSportTitle(track)">
              <img
                v-if="track.sport === 'cycling' || !track.sport"
                class="meta-icon"
                :src="getSportIcon(track)"
                :alt="getSportTitle(track)"
              />
              <span v-else class="meta-icon sport-icon--emoji">{{ getSportEmoji(track) }}</span>
              {{ getSportTitle(track) }}
            </span>
            <span class="meta-badge difficulty-meta" :title="getDifficultyTitle(track.difficulty)">
              <img class="meta-icon" :src="getDifficultyIcon(track.difficulty)" :alt="getDifficultyTitle(track.difficulty)" /> {{ getDifficultyTitle(track.difficulty) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="track-content">
        <!-- LEFT COLUMN: Visuals (Map Preview, GPX Download, Elevation Profile) -->
        <div class="track-visuals-column">
          <!-- Map Preview Card -->
          <div class="track-image-section">
            <a 
              :href="track.mapUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="track-image-link"
              title="Otvoriť trasu na Mapy.com"
            >
              <img :src="track.previewImage" :alt="track.name" class="track-main-image" />
              <div class="map-image-overlay">
                <span class="overlay-text">🗺️ Zobraziť na Mapy.com</span>
              </div>
            </a>
          </div>

          <!-- Profile Image Section (Stacked under Map/GPX) -->
          <div class="profile-section" v-if="track.profileImage && showProfileImage">
            <h3>📈 Profil trasy</h3>
            <div class="profile-image-container">
              <img 
                :src="track.profileImage" 
                :alt="`Profil trasy ${track.name}`" 
                class="profile-image"
                @error="handleProfileImageError"
              />
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Info & Stats & Actions -->
        <div class="track-info-column">
          <!-- Description Card -->
          <div class="track-description-section">
            <h3>📝 O trase</h3>
            <p class="track-description">{{ track.description }}</p>
          </div>

          <!-- Stats Dashboard -->
          <div class="track-stats-section">
            <h3>📊 Parametre</h3>
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
          </div>

          <!-- Map Action Button -->
          <div class="track-map-action" v-if="track.mapUrl">
            <a
              :href="track.mapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="action-button primary map-link-btn"
            >
              🗺️ Otvoriť trasu na Mapy.com
            </a>
          </div>
        </div>
      </div>

      <!-- GALLERY SECTION: Always bottom, full width -->
      <div class="gallery-section">
        <h3>📸 Galéria obrázkov</h3>
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
            <div class="gallery-item-overlay">
              <span class="zoom-icon">🔍 Zväčšiť</span>
            </div>
          </div>
        </div>
        <div class="no-images-message" v-else>
          <p>Žiadne fotografie z tejto trasy</p>
        </div>
      </div>

      <!-- Image Modal / Lightbox -->
      <div v-if="imageModal.show" class="image-modal-overlay" @click.self="closeImageModal">
        <button class="modal-close" @click="closeImageModal" type="button">✕</button>
        <button v-if="imageModal.currentIndex > 0" class="modal-nav prev" @click="prevImage" type="button">‹</button>
        <div class="modal-content">
          <img :src="imageModal.currentImage" :alt="`Obrázok ${imageModal.currentIndex + 1}`" class="modal-image" />
        </div>
        <button v-if="imageModal.currentIndex < validGalleryImages.length - 1" class="modal-nav next" @click="nextImage" type="button">›</button>
      </div>

    </div>
  </div>
</template>

<script>
import { getAdminTrailById, getAdminTrailState } from '../data/customTrails'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

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
        const { deletedTrailIds } = await getAdminTrailState()
        this.track = deletedTrailIds.has(this.id)
          ? null
          : await getAdminTrailById(this.id)
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
      const sport = track?.sport || 'cycling'
      if (sport === 'cycling') return '/assets/icons/icon-for-mtb.jpg'
      return '' // hiking and running use emoji spans instead
    },
    getSportEmoji(track) {
      const emojis = { hiking: '🥾', running: '🏃' }
      return emojis[track?.sport] || '🚵'
    },
    getSportTitle(track) {
      const cyclingTitles = {
        mtb: 'MTB trasa',
        'cross-country': 'Cross-country / XC',
        enduro: 'Enduro',
        downhill: 'Zjazd',
        gravel: 'Gravel',
        road: 'Cestná cyklistika',
        trekking: 'Trek / turistická',
        'e-bike': 'E-bike'
      }
      const hikingTitles = {
        hiking: 'Pešia turistika',
        'mountain-hiking': 'Horská turistika',
        'via-ferrata': 'Via ferrata',
        snowshoeing: 'Snehová chôdza'
      }
      const runningTitles = {
        'road-running': 'Cestný beh',
        'trail-running': 'Trail beh',
        ultramarathon: 'Ultramaratón',
        track: 'Beh na dráhe'
      }
      const sportLabels = {
        cycling: 'Cyklistika',
        hiking: 'Turistika',
        running: 'Beh'
      }

      const sub = track?.activityType || track?.bikeType
      return cyclingTitles[sub] || hikingTitles[sub] || runningTitles[sub]
        || sportLabels[track?.sport]
        || 'Trasa'
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
    getTrailStorageId() {
      return String(this.track?.id || this.id || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    },
    async findStoredGpxUrl() {
      if (!isSupabaseConfigured || !supabase) {
        return ''
      }

      const storageTrailId = this.getTrailStorageId()
      if (!storageTrailId) {
        return ''
      }

      const { data, error } = await supabase.storage
        .from('trail-files')
        .list(storageTrailId, {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        return ''
      }

      const gpxFile = (data || []).find(file => file.name?.toLowerCase().endsWith('.gpx'))
      if (!gpxFile) {
        return ''
      }

      const { data: publicUrlData } = supabase.storage
        .from('trail-files')
        .getPublicUrl(`${storageTrailId}/${gpxFile.name}`)

      return publicUrlData.publicUrl || ''
    },
    async downloadGPX() {
      if (this.track && this.track.gpxFile) {
        const fileName = this.track.gpxFileName || `${this.track.name}.gpx`
        const link = document.createElement('a')
        let objectUrl = ''
        let gpxUrl = this.track.gpxFile

        try {
          let response = await fetch(gpxUrl)
          if (!response.ok) {
            const storedGpxUrl = await this.findStoredGpxUrl()
            if (storedGpxUrl) {
              gpxUrl = storedGpxUrl
              response = await fetch(gpxUrl)
            }
          }

          if (!response.ok) {
            throw new Error('Download failed')
          }

          const blob = await response.blob()
          objectUrl = window.URL.createObjectURL(blob)
          link.href = objectUrl
        } catch (error) {
          link.href = gpxUrl
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
