<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <!-- Desktop layout - logos on sides -->
        <img src="/assets/icons/aktivity-dw-logo.png" alt="Aktivity DW Logo" class="hero-logo hero-logo-left hero-logo-desktop">
        <div class="hero-text">
          <h1 class="hero-title">Objavte úžasné trasy</h1>
          <p class="hero-subtitle">Nájdite perfektnú bežeckú, cyklistickú alebo turistickú trasu vo vašom okolí</p>
        </div>
        <a href="https://www.ceaeurope.sk/" target="_blank" rel="noopener noreferrer" class="hero-logo-link hero-logo-desktop">
          <img src="/assets/icons/logo-cea.png" alt="CEA Logo" class="hero-logo hero-logo-right">
        </a>

        <!-- Mobile layout - logos together -->
        <div class="hero-logos-container hero-logo-mobile">
          <img src="/assets/icons/aktivity-dw-logo.png" alt="Aktivity DW Logo" class="hero-logo hero-logo-left">
          <a href="https://www.ceaeurope.sk/" target="_blank" rel="noopener noreferrer" class="hero-logo-link">
            <img src="/assets/icons/logo-cea.png" alt="CEA Logo" class="hero-logo hero-logo-right">
          </a>
        </div>
      </div>
      <!-- The ant parade doubles as the news channel: ants march left and
           tow the announcements maintained in /admin/announcements. -->
      <NewsTicker />
    </div>

    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">⏳</div>
          <p>Načítavam trasy...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <div class="error-icon">❌</div>
          <h3>Ups, niečo sa pokazilo</h3>
          <p>{{ error }}</p>
          <button @click="loadTracks" class="retry-button">Skúsiť znova</button>
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
                v-if="track.previewImage"
                :src="track.previewImage"
                :alt="track.name"
                :class="{ 'generated-map-preview': track.isGeneratedMapPreview }"
                @error="handleImageError($event, track)"
              />
              <div v-else class="track-image-placeholder">
                <span class="track-image-placeholder-icon">🗺</span>
                <span class="track-image-placeholder-label">Bez náhľadu</span>
              </div>
              <div class="track-location">
                <MapPin class="location-icon" :size="14" aria-hidden="true" />
                <span class="location-text">{{ track.location }}</span>
              </div>
            </div>

            <div class="track-content">
              <div class="track-badges">
                <span class="sport-icon-wrap" :title="getSportTitle(track)">
                  <SportIcon :sport="track.sport" size="sm" />
                </span>
                <DifficultyBadge :difficulty="track.difficulty" size="sm" />
              </div>
              <h3 class="track-title">{{ track.name }}</h3>
              <p class="track-description">{{ track.description }}</p>

              <div class="track-stats">
                <div class="stat" title="Vzdialenosť">
                  <Ruler class="stat-icon" :size="16" aria-hidden="true" />
                  <span class="stat-value">{{ track.distance }}</span>
                </div>
                <div class="stat" title="Trvanie">
                  <Clock class="stat-icon" :size="16" aria-hidden="true" />
                  <span class="stat-value">{{ track.duration }}</span>
                </div>
                <div class="stat" title="Prevýšenie">
                  <TrendingUp class="stat-icon" :size="16" aria-hidden="true" />
                  <span class="stat-value">{{ track.elevation }}</span>
                </div>
                <LikeButton
                  class="stat stat-like"
                  compact
                  :trail-id="track.id"
                  :like-count="track.likeCount || 0"
                  :liked-by-me="Boolean(track.likedByMe)"
                  :auth-user="authUser"
                  @changed="applyLikeChange"
                  @needs-auth="promptSignIn"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredTracks.length === 0" class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon">🔍</div>
            <h3>Nenašli sme žiadne trasy</h3>
            <p>Skúste zmeniť filtre alebo hľadaný výraz</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Clock, MapPin, Ruler, TrendingUp } from 'lucide-vue-next'
import DifficultyBadge from './DifficultyBadge.vue'
import LikeButton from './LikeButton.vue'
import NewsTicker from './NewsTicker.vue'
import SportIcon from './SportIcon.vue'
import { getAdminTrailState } from '../data/customTrails'

export default {
  name: 'HomePage',
  components: { Clock, DifficultyBadge, LikeButton, MapPin, NewsTicker, Ruler, SportIcon, TrendingUp },
  props: {
    filters: {
      type: Object,
      default: () => ({})
    },
    searchQuery: {
      type: String,
      default: ''
    },
    // Passed down by <router-view> in App.vue; needed to decide whether the
    // like button acts or asks the visitor to sign in.
    authUser: {
      type: Object,
      default: null
    }
  },
  emits: ['request-sign-in'],
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
      if (this.filters.maxDistance && this.filters.maxDistance < 1000) {
        filtered = filtered.filter(track => {
          const distance = track.distanceValue
          return distance <= this.filters.maxDistance
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
          (track.tags || []).some(tag => tag.toLowerCase().includes(query))
        )
      }

      // Popularity sort, applied last so it orders whatever survived the
      // filters. Ties keep their existing (id) order.
      if (this.filters.sort === 'popular') {
        filtered = [...filtered].sort(
          (a, b) => (b.likeCount || 0) - (a.likeCount || 0)
        )
      }

      return filtered
    }
  },
  methods: {
    // Keep the local copy in step so the count survives re-filtering and
    // re-sorting without another round trip.
    applyLikeChange({ trailId, likeCount, likedByMe }) {
      const track = this.tracks.find(t => t.id === trailId)
      if (track) {
        track.likeCount = likeCount
        track.likedByMe = likedByMe
      }
    },
    promptSignIn() {
      this.$emit('request-sign-in')
    },
    async loadTracks() {
      this.loading = true
      this.error = null

      try {
        const { trails } = await getAdminTrailState()
        this.tracks = trails
        this.error = null
      } catch (error) {
        console.error('Error loading trails:', error)
        this.error = 'Nepodarilo sa načítať trasy.'
        this.tracks = []
      } finally {
        this.loading = false
      }
    },
    goToTrack(trackId) {
      this.$router.push({ name: 'TrackDetail', params: { id: trackId } })
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
    handleImageError(event, track) {
      // Use fallback image if main image fails to load
      if (track.fallbackImage) {
        event.target.src = track.fallbackImage
      }
    }
  }
}
</script>
