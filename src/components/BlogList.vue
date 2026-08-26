<template>
  <div class="blog-page">
    <div class="container">
      <div class="blog-header">
        <h1>Novinky</h1>
        <p>Čo je nové v klube Aktivity DW.</p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">⏳</div>
          <p>Načítavam novinky...</p>
        </div>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <div class="error-icon">❌</div>
          <h3>Ups, niečo sa pokazilo</h3>
          <p>{{ error }}</p>
        </div>
      </div>

      <template v-else>
        <div v-if="!posts.length" class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon">🐜</div>
            <h3>Zatiaľ žiadne novinky</h3>
            <p>Mravce ešte nič nepriniesli — pozrite sa neskôr.</p>
          </div>
        </div>

        <div class="blog-grid">
          <router-link
            v-for="post in posts"
            :key="post.id"
            class="blog-card"
            :to="`/novinky/${post.id}`"
          >
            <div v-if="post.mediaUrl" class="blog-card-image">
              <img :src="post.mediaUrl" :alt="post.text" />
            </div>
            <div class="blog-card-content">
              <h2>{{ post.text }}</h2>
              <p v-if="excerpt(post)" class="blog-card-excerpt">{{ excerpt(post) }}</p>
              <div class="blog-card-meta">
                <span>{{ formatDate(post.createdAt) }}</span>
                <span class="blog-card-more">Čítať viac →</span>
              </div>
            </div>
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { api } from '../lib/api'
import { formatBlogDate } from '../utils/blogDate'

export default {
  name: 'BlogList',
  data() {
    return {
      posts: [],
      loading: true,
      error: null
    }
  },
  async mounted() {
    try {
      const posts = await api.get('/api/announcements')
      this.posts = Array.isArray(posts) ? posts : []
    } catch (error) {
      console.error('Error loading blog posts:', error)
      this.error = 'Nepodarilo sa načítať novinky.'
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatDate: formatBlogDate,
    excerpt(post) {
      const body = (post.body || '').trim()
      if (!body) return ''
      return body.length > 160 ? body.slice(0, 160).trimEnd() + '…' : body
    }
  }
}
</script>
