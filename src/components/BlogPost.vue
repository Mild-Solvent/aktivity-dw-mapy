<template>
  <div class="blog-page">
    <div class="container">
      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">⏳</div>
          <p>Načítavam novinku...</p>
        </div>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <div class="error-icon">🐜</div>
          <h3>Novinka nebola nájdená</h3>
          <p>{{ error }}</p>
          <router-link class="admin-inline-button" to="/novinky">Späť na novinky</router-link>
        </div>
      </div>

      <article v-else class="blog-post">
        <router-link class="back-button blog-back-button" to="/novinky">
          ← Všetky novinky
        </router-link>

        <h1>{{ post.text }}</h1>
        <p class="blog-post-meta">{{ formatDate(post.createdAt) }}</p>

        <img
          v-if="post.mediaUrl"
          class="blog-post-image"
          :src="post.mediaUrl"
          :alt="post.text"
        />

        <!-- Plain text written by the admin; pre-line keeps their paragraphs. -->
        <div v-if="post.body" class="blog-post-body">{{ post.body }}</div>

        <a
          v-if="isExternalLink(post.linkUrl)"
          class="admin-inline-button blog-post-link"
          :href="post.linkUrl"
          target="_blank"
          rel="noopener noreferrer"
        >Otvoriť odkaz →</a>
        <router-link
          v-else-if="post.linkUrl"
          class="admin-inline-button blog-post-link"
          :to="post.linkUrl"
        >Otvoriť odkaz →</router-link>
      </article>
    </div>
  </div>
</template>

<script>
import { api } from '../lib/api'
import { formatBlogDate } from '../utils/blogDate'

export default {
  name: 'BlogPost',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      post: null,
      loading: true,
      error: null
    }
  },
  async mounted() {
    await this.load()
  },
  watch: {
    // Ticker cards can navigate between posts while this page is mounted.
    async id() {
      await this.load()
    }
  },
  methods: {
    formatDate: formatBlogDate,
    isExternalLink(url) {
      return typeof url === 'string' && /^https?:\/\//.test(url)
    },
    async load() {
      this.loading = true
      this.error = null
      try {
        this.post = await api.get(`/api/announcements/${encodeURIComponent(this.id)}`)
      } catch (error) {
        this.error = error.message || 'Skúste to znova neskôr.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
