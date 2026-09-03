<template>
  <!-- Loading State -->
  <div v-if="loading" class="track-loading">
    <div class="loading-content">
      <LoaderCircle class="loading-spinner" :size="48" aria-hidden="true" />
      <p>Načítavam trasu...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="track-error">
    <div class="error-content">
      <CircleAlert class="error-icon" :size="48" aria-hidden="true" />
      <h2>{{ error }}</h2>
      <button @click="goBack" class="back-button">
        <ArrowLeft class="section-icon" :size="16" aria-hidden="true" /> Späť na zoznam trás
      </button>
    </div>
  </div>
  
  <!-- Track Content -->
  <div class="track-detail" v-else-if="track">
    <div class="track-header">
      <div class="container">
        <div class="header-nav-line">
          <button @click="goBack" class="back-button">
            <ArrowLeft class="section-icon" :size="16" aria-hidden="true" /> Späť na zoznam trás
          </button>
        </div>
        <div class="track-title-section">
          <h1 class="track-title">{{ track.name }}</h1>
          <div class="track-meta-badges">
            <span class="meta-badge sport-meta" :title="getSportTitle(track)">
              <SportIcon :sport="track.sport" size="xs" />
              {{ getSportTitle(track) }}
            </span>
            <DifficultyBadge :difficulty="track.difficulty" size="md" />
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
              title="Otvoriť online"
            >
              <img :src="track.previewImage" :alt="track.name" class="track-main-image" />
              <div class="map-image-overlay">
                <span class="overlay-text"><MapIcon class="section-icon" :size="16" aria-hidden="true" /> Otvoriť online</span>
              </div>
            </a>
          </div>

          <!-- Profile Image Section (Stacked under Map/GPX) -->
          <!-- <div class="profile-section" v-if="track.profileImage && showProfileImage">
            <h3>📈 Profil trasy</h3>
            <div class="profile-image-container">
              <img 
                :src="track.profileImage" 
                :alt="`Profil trasy ${track.name}`" 
                class="profile-image"
                @error="handleProfileImageError"
              />
            </div>
          </div> -->
        </div>

        <!-- RIGHT COLUMN: Info & Stats & Actions -->
        <div class="track-info-column">
          <!-- Description Card -->
          <div class="track-description-section">
            <h3><FileText class="section-icon" :size="18" aria-hidden="true" /> O trase</h3>
            <p class="track-description">{{ track.description }}</p>
          </div>

          <!-- Stats Dashboard -->
          <div class="track-stats-section">
            <h3><ChartColumn class="section-icon" :size="18" aria-hidden="true" /> Parametre</h3>
            <div class="track-stats-unified">
              <div class="unified-stat-item">
                <span class="stat-chip"><Ruler :size="20" aria-hidden="true" /></span>
                <div class="stat-content">
                  <div class="stat-label">Vzdialenosť</div>
                  <div class="stat-value">{{ track.distance }}</div>
                </div>
              </div>
              <div class="stat-separator"></div>
              <div class="unified-stat-item">
                <span class="stat-chip"><Clock :size="20" aria-hidden="true" /></span>
                <div class="stat-content">
                  <div class="stat-label">Trvanie</div>
                  <div class="stat-value">{{ track.duration }}</div>
                </div>
              </div>
              <div class="stat-separator"></div>
              <div class="unified-stat-item">
                <span class="stat-chip"><TrendingUp :size="20" aria-hidden="true" /></span>
                <div class="stat-content">
                  <div class="stat-label">Prevýšenie</div>
                  <div class="stat-value">{{ track.elevation }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons (Separate but placed next to each other) -->
          <div class="track-actions-container">
            <div class="track-map-action" v-if="track.mapUrl">
              <a
                :href="track.mapUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="action-button primary map-link-btn"
              >
                <MapIcon :size="18" aria-hidden="true" /> Otvoriť online
              </a>
            </div>
            <div class="track-gpx-action" v-if="track.gpxFile">
              <button
                @click="downloadGPX"
                class="action-button secondary gpx-download-btn"
              >
                <Download :size="18" aria-hidden="true" /> Stiahnuť GPX
              </button>
            </div>
            <div class="track-like-action">
              <LikeButton
                :trail-id="track.id"
                :like-count="track.likeCount || 0"
                :liked-by-me="Boolean(track.likedByMe)"
                :auth-user="authUser"
                @changed="applyLikeChange"
                @needs-auth="$emit('request-sign-in')"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="track-content">
        <!-- GALLERY SECTION: Always bottom, full width -->
        <div class="gallery-section">
          <h3><Images class="section-icon" :size="18" aria-hidden="true" /> Galéria obrázkov</h3>
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
              <span class="zoom-icon"><ZoomIn :size="14" aria-hidden="true" /> Zväčšiť</span>
            </div>
          </div>
        </div>
        <div class="no-images-message" v-else>
          <p>Žiadne fotografie z tejto trasy</p>
        </div>
       </div>
      </div>
      <!-- Image Modal / Lightbox -->
      <div v-if="imageModal.show" class="image-modal-overlay" @click.self="closeImageModal">
        <button class="modal-close" @click="closeImageModal" type="button" aria-label="Zavrieť"><X :size="22" aria-hidden="true" /></button>
        <button v-if="imageModal.currentIndex > 0" class="modal-nav prev" @click="prevImage" type="button" aria-label="Predchádzajúci obrázok"><ChevronLeft :size="28" aria-hidden="true" /></button>
        <div class="modal-content">
          <img :src="imageModal.currentImage" :alt="`Obrázok ${imageModal.currentIndex + 1}`" class="modal-image" />
        </div>
        <button v-if="imageModal.currentIndex < validGalleryImages.length - 1" class="modal-nav next" @click="nextImage" type="button" aria-label="Ďalší obrázok"><ChevronRight :size="28" aria-hidden="true" /></button>
      </div>

    </div>
  </div>
</template>

<script>
import {
  ArrowLeft,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Download,
  FileText,
  Images,
  LoaderCircle,
  Map as MapIcon,
  Ruler,
  TrendingUp,
  X,
  ZoomIn
} from 'lucide-vue-next'
import DifficultyBadge from './DifficultyBadge.vue'
import SportIcon from './SportIcon.vue'
import { getAdminTrailById, getAdminTrailState } from '../data/customTrails'
import { getStorageTrailId } from '../utils/slug'
import LikeButton from './LikeButton.vue'
import { api } from '../lib/api'
import { absoluteUrl, breadcrumbNode, organizationNode, setHead, summarize } from '../utils/head'

export default {
  name: 'TrackDetail',
  components: {
    ArrowLeft,
    ChartColumn,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock,
    DifficultyBadge,
    Download,
    FileText,
    Images,
    LikeButton,
    LoaderCircle,
    MapIcon,
    Ruler,
    SportIcon,
    TrendingUp,
    X,
    ZoomIn
  },
  props: {
    id: {
      type: String,
      required: true
    },
    // From <router-view> in App.vue — decides whether the like button acts or
    // asks the visitor to sign in.
    authUser: {
      type: Object,
      default: null
    }
  },
  emits: ['request-sign-in'],
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
    applyLikeChange({ likeCount, likedByMe }) {
      if (!this.track) return
      this.track.likeCount = likeCount
      this.track.likedByMe = likedByMe
    },
    async loadTrack() {
      try {
        this.loading = true
        const { deletedTrailIds } = await getAdminTrailState()
        this.track = deletedTrailIds.has(this.id)
          ? null
          : await getAdminTrailById(this.id)
        if (!this.track) {
          this.error = 'Trasu sa nepodarilo nájsť'
          // A direct hit already got a 404 from the server; this covers the
          // in-app case, where the status line is long since sent.
          setHead({ title: 'Stránka sa nenašla', path: this.$route.path, noindex: true })
        } else {
          this.error = null
          this.validGalleryImages = this.track.galleryImages || []
          this.applyHead()
          console.log('Loaded track object:', this.track)
        }
      } catch (error) {
        console.error('Error loading track:', error)
        this.error = 'Nepodarilo sa načítať trasu'
      } finally {
        this.loading = false
      }
    },
    /**
     * This page's head, once the trail is loaded.
     *
     * api/_lib/seo.php::seo_meta_trail() produces the same thing server-side
     * for a direct hit; this keeps it correct after an in-app navigation,
     * where no new document is fetched and the head would otherwise still
     * describe the page the visitor arrived on.
     */
    applyHead() {
      const t = this.track
      if (!t) return

      const sport = { running: 'bežecká', cycling: 'cyklistická', hiking: 'turistická' }[t.sport] || 'outdoorová'
      const kind = `${t.distance ? `${t.distance} ` : ''}${sport} trasa`
      // Lead the snippet with the numbers — they are what a searcher scans
      // for, and most descriptions open with prose.
      const difficulty = {
        beginner: 'pre začiatočníkov',
        easy: 'ľahká',
        moderate: 'stredne náročná',
        intermediate: 'stredne náročná',
        hard: 'náročná',
        expert: 'veľmi náročná'
      }[t.difficulty]
      const facts = [t.distance, t.elevation && `prevýšenie ${t.elevation}`, difficulty, t.location]
        .filter(Boolean)
        .join(' · ')
      const path = `/track/${t.id}`

      setHead({
        title: [t.name, kind].filter(Boolean).join(' – '),
        description: `${facts ? `${facts}. ` : ''}${t.description || ''}`,
        path,
        image: t.previewImage,
        jsonld: [
          {
            '@type': 'TouristTrip',
            '@id': `${absoluteUrl(path)}#trip`,
            name: t.name,
            description: summarize(t.description || '', 500),
            url: absoluteUrl(path),
            ...(t.previewImage ? { image: absoluteUrl(t.previewImage) } : {}),
            provider: { '@id': `${absoluteUrl('/')}#organization` },
            ...(t.location
              ? {
                  itinerary: {
                    '@type': 'Place',
                    name: t.location,
                    address: {
                      '@type': 'PostalAddress',
                      addressLocality: t.location,
                      addressCountry: 'SK'
                    }
                  }
                }
              : {})
          },
          breadcrumbNode([['Domov', '/'], [t.name, path]]),
          organizationNode()
        ]
      })
    },
    goBack() {
      this.$router.push('/')
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
      return getStorageTrailId(this.track?.id || this.id)
    },
    async findStoredGpxUrl() {
      // Called as a fallback when the trail's stored gpxFile URL 404s.
      // Re-fetch metadata from the API — it always has the current Blob URL.
      try {
        const trail = await api.get(`/api/trails/${encodeURIComponent(this.id)}`)
        if (trail?.gpxFile) return trail.gpxFile
      } catch {
        // ignore — downloadGPX will use the original URL as last resort
      }
      return ''
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
