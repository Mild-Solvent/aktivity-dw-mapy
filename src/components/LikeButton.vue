<template>
  <button
    class="like-button"
    :class="{ 'is-liked': liked, 'like-button-compact': compact }"
    type="button"
    :disabled="busy"
    :title="title"
    :aria-pressed="liked ? 'true' : 'false'"
    :aria-label="title"
    @click.stop="toggle"
  >
    <Heart class="like-icon" :size="compact ? 16 : 18" :fill="liked ? 'currentColor' : 'none'" aria-hidden="true" />
    <span class="like-count">{{ count }}</span>
  </button>
</template>

<script>
import { Heart } from 'lucide-vue-next'
import { setTrailLike } from '../data/customTrails'

export default {
  name: 'LikeButton',
  components: { Heart },
  props: {
    trailId: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
    likedByMe: { type: Boolean, default: false },
    // Null when nobody is signed in.
    authUser: { type: Object, default: null },
    // Card variant: smaller, sits among the stats.
    compact: { type: Boolean, default: false }
  },
  emits: ['changed', 'needs-auth'],
  data() {
    return {
      // Mirrored locally so the button responds immediately and keeps working
      // when the parent list is not re-fetched.
      liked: this.likedByMe,
      count: this.likeCount,
      busy: false
    }
  },
  computed: {
    title() {
      if (!this.authUser) return 'Prihláste sa, aby ste mohli pridať trasu medzi obľúbené'
      return this.liked ? 'Odobrať z obľúbených' : 'Pridať medzi obľúbené'
    }
  },
  watch: {
    // The parent may reload trails underneath us.
    likedByMe(v) { this.liked = v },
    likeCount(v) { this.count = v }
  },
  methods: {
    async toggle() {
      if (!this.authUser) {
        this.$emit('needs-auth')
        return
      }
      if (this.busy) return

      const previousLiked = this.liked
      const previousCount = this.count

      // Optimistic: the server is authoritative, but waiting on a round trip
      // for a heart makes the whole grid feel broken.
      this.liked = !previousLiked
      this.count = previousCount + (this.liked ? 1 : -1)
      this.busy = true

      try {
        const res = await setTrailLike(this.trailId, this.liked)
        if (res && typeof res.likeCount === 'number') {
          this.count = res.likeCount
          this.liked = Boolean(res.likedByMe)
        }
        this.$emit('changed', { trailId: this.trailId, likeCount: this.count, likedByMe: this.liked })
      } catch (err) {
        // Roll back so the UI never claims something the server rejected.
        this.liked = previousLiked
        this.count = previousCount
        if (err?.status === 401) this.$emit('needs-auth')
      } finally {
        this.busy = false
      }
    }
  }
}
</script>

<style scoped>
.like-button {
  align-items: center;
  background: none;
  border: none;
  border-radius: 999px;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  transition: color 0.15s ease, background 0.15s ease;
}

.like-button:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
}

.like-button.is-liked {
  color: #dc2626;
}

.like-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.like-count {
  font-size: 0.9rem;
  font-weight: 600;
}

.like-button-compact .like-count {
  font-size: 0.85rem;
}
</style>
