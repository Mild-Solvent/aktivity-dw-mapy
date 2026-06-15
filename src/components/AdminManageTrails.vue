<template>
  <div class="admin-page">
    <div class="container">
      <section v-if="!canAddTrails" class="admin-access-panel">
        <h1>Iba pre editorov trás</h1>
        <p>Trasy môže spravovať iba administrátor alebo editor trás.</p>
      </section>

      <section v-else class="admin-form-shell">
        <div class="admin-form-header">
          <button class="back-button admin-back-button" type="button" @click="$router.push('/')">
            Späť na trasy
          </button>
          <div>
            <h1>Správa trás</h1>
            <p>Vyber trasu, ktorú chceš upraviť alebo odstrániť.</p>
          </div>
        </div>

        <div class="admin-list">
          <article v-for="trail in trails" :key="trail.id" class="admin-list-item">
            <img :src="trail.previewImage" :alt="trail.name" />
            <div>
              <h2>{{ trail.name }}</h2>
              <p>
                {{ trail.distance }} · {{ trail.duration }}
                <span
                  v-if="trail.status === 'draft'"
                  class="status-badge status-badge--draft"
                >📝 Koncept</span>
                <span
                  v-else
                  class="status-badge status-badge--published"
                >📢 Zverejnená</span>
              </p>
            </div>
            <div class="admin-item-actions">
              <router-link class="admin-inline-button" :to="`/admin/trails/${trail.id}/edit`">
                Upraviť
              </router-link>
              <button
                class="admin-inline-button danger"
                type="button"
                :disabled="deletingId === trail.id"
                @click="deleteTrail(trail)"
              >
                {{ deletingId === trail.id ? 'Odstraňujem...' : 'Odstrániť' }}
              </button>
            </div>
          </article>
        </div>

        <p v-if="message" class="auth-message auth-message-success">{{ message }}</p>
        <p v-if="error" class="auth-message auth-message-error">{{ error }}</p>
      </section>
    </div>
  </div>
</template>

<script>
import { getAdminTrailState, removeAdminTrail } from '../data/customTrails'

export default {
  name: 'AdminManageTrails',
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    },
    canAddTrails: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      trails: [],
      deletingId: '',
      message: '',
      error: ''
    }
  },
  async mounted() {
    await this.loadTrails()
  },
  methods: {
    async loadTrails() {
      const { trails } = await getAdminTrailState()
      this.trails = trails
    },
    async deleteTrail(trail) {
      this.message = ''
      this.error = ''

      if (!window.confirm(`Naozaj chceš odstrániť trasu "${trail.name || trail.id}"?`)) {
        return
      }

      this.deletingId = trail.id

      try {
        await removeAdminTrail({ trailId: trail.id })
        this.message = `Trasa "${trail.name}" bola odstránená.`
        await this.loadTrails()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa odstrániť trasu.'
      } finally {
        this.deletingId = ''
      }
    }
  }
}
</script>
