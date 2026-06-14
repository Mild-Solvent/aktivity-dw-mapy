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
            <p>Vyber trasu, ktorú chceš upraviť.</p>
          </div>
        </div>

        <div class="admin-list">
          <article v-for="trail in trails" :key="trail.id" class="admin-list-item">
            <img :src="trail.previewImage" :alt="trail.name" />
            <div>
              <h2>{{ trail.name }}</h2>
              <p>{{ trail.distance }} · {{ trail.duration }}</p>
            </div>
            <div class="admin-item-actions">
              <router-link class="admin-inline-button" :to="`/admin/trails/${trail.id}/edit`">
                Upraviť
              </router-link>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { getAdminTrailState } from '../data/customTrails'

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
      trails: []
    }
  },
  async mounted() {
    const { trails } = await getAdminTrailState()
    this.trails = trails
  }
}
</script>
