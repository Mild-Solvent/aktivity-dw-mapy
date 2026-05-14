<template>
  <div class="admin-page">
    <div class="container">
      <section v-if="!isAdmin" class="admin-access-panel">
        <h1>Iba pre administrátora</h1>
        <p>Všetky trasy môže spravovať iba administrátor.</p>
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
            <router-link class="admin-inline-button" :to="`/admin/trails/${trail.id}/edit`">
              Upraviť
            </router-link>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { getAllTracks } from '../data/tracks'
import { getAdminTrails } from '../data/customTrails'

export default {
  name: 'AdminManageTrails',
  props: {
    isAdmin: {
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
    const adminTrails = await getAdminTrails()
    const adminIds = new Set(adminTrails.map(trail => trail.id))
    this.trails = [
      ...adminTrails,
      ...getAllTracks().filter(trail => !adminIds.has(trail.id))
    ]
  }
}
</script>
