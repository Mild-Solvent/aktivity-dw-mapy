<template>
  <div class="home-page">
    <div class="container liked-container">
      <div class="liked-header">
        <h1>Obľúbené trasy</h1>
        <router-link class="liked-back" to="/">Späť na všetky trasy</router-link>
      </div>

      <div v-if="!authUser" class="no-results">
        <div class="no-results-content">
          <h3>Nie ste prihlásený</h3>
          <p>Prihláste sa a uvidíte trasy, ktoré ste si označili ako obľúbené.</p>
          <button class="retry-button" type="button" @click="$emit('request-sign-in')">
            Prihlásiť sa
          </button>
        </div>
      </div>

      <div v-else-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">⏳</div>
          <p>Načítavam obľúbené trasy...</p>
        </div>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <div class="error-icon">❌</div>
          <h3>Ups, niečo sa pokazilo</h3>
          <p>{{ error }}</p>
          <button @click="load" class="retry-button">Skúsiť znova</button>
        </div>
      </div>

      <div v-else>
        <div class="results-info">
          <p>Výsledkov: {{ tracks.length }}</p>
        </div>

        <div v-if="tracks.length" class="tracks-grid">
          <div
            v-for="track in tracks"
            :key="track.id"
            class="track-card"
            @click="goToTrack(track.id)"
          >
            <div class="track-image">
              <img
                v-if="track.previewImage"
                :src="track.previewImage"
                :alt="track.name"
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
                <span class="sport-icon-wrap">
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
                <LikeButton
                  class="stat stat-like"
                  compact
                  :trail-id="track.id"
                  :like-count="track.likeCount || 0"
                  :liked-by-me="Boolean(track.likedByMe)"
                  :auth-user="authUser"
                  @changed="onLikeChanged"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon">🤍</div>
            <h3>Zatiaľ nemáte žiadne obľúbené trasy</h3>
            <p>Pri každej trase nájdete srdiečko — kliknutím si ju uložíte sem.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Clock, MapPin, Ruler } from 'lucide-vue-next'
import DifficultyBadge from './DifficultyBadge.vue'
import LikeButton from './LikeButton.vue'
import SportIcon from './SportIcon.vue'
import { getLikedTrails } from '../data/customTrails'

export default {
  name: 'MyLikedTrails',
  components: { Clock, DifficultyBadge, LikeButton, MapPin, Ruler, SportIcon },
  props: {
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
  watch: {
    // App.vue resolves the session after mount, so this page can render before
    // authUser is known. Load as soon as it arrives.
    authUser: {
      immediate: true,
      handler(user) {
        if (user) this.load()
        else this.loading = false
      }
    }
  },
  methods: {
    async load() {
      this.loading = true
      this.error = null
      try {
        this.tracks = await getLikedTrails()
      } catch (err) {
        this.error = err.message || 'Nepodarilo sa načítať obľúbené trasy.'
        this.tracks = []
      } finally {
        this.loading = false
      }
    },
    onLikeChanged({ trailId, likedByMe }) {
      // Unliking here should remove the card — this list is defined by likes.
      if (!likedByMe) {
        this.tracks = this.tracks.filter(t => t.id !== trailId)
      }
    },
    goToTrack(id) {
      this.$router.push(`/track/${id}`)
    }
  }
}
</script>

<style scoped>
.liked-container {
  padding-top: 2rem;
}

.liked-header {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.liked-header h1 {
  font-size: 1.6rem;
  margin: 0;
}

.liked-back {
  color: #6b7280;
  font-size: 0.9rem;
}
</style>
