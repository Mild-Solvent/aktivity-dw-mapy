<template>
  <div class="admin-page">
    <div class="container">
      <section v-if="!canAddTrails" class="admin-access-panel">
        <h1>Iba pre editorov trás</h1>
        <p>Rozpracované trasy sú dostupné po prihlásení ako administrátor alebo pridávateľ trás.</p>
      </section>

      <section v-else class="admin-form-shell">
        <div class="admin-form-header">
          <button class="back-button admin-back-button" type="button" @click="$router.push('/')">
            Späť na trasy
          </button>
          <div>
            <h1>Rozpracované trasy</h1>
            <p>Lokálne návrhy a uložené úpravy z tohto prehliadača.</p>
          </div>
        </div>

        <div v-if="drafts.length" class="admin-list">
          <article v-for="trail in drafts" :key="trail.id" class="admin-list-item">
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
        <p v-else class="empty-admin-state">Zatiaľ nie sú uložené žiadne rozpracované trasy.</p>
      </section>
    </div>
  </div>
</template>

<script>
import { getLocalAdminTrails } from '../data/customTrails'

export default {
  name: 'AdminTrailDrafts',
  props: {
    canAddTrails: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      drafts: []
    }
  },
  mounted() {
    this.drafts = getLocalAdminTrails()
  }
}
</script>
