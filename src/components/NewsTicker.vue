<template>
  <div
    class="news-ticker"
    aria-label="Novinky"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div ref="track" class="news-ticker-track">
      <!-- Identical repeated groups; the JS marquee wraps its offset modulo
           one group's width for a seamless endless loop, so everything inside
           must be deterministic per index (all copies pixel-identical).
           `copies` is however many groups it takes to cover the viewport
           plus one — with only two, a screen wider than one group would see
           a blank stretch sweep past before the "start" scrolled back in.
           Copies beyond the first are decoration only. -->
      <div
        v-for="copy in copies"
        :key="copy"
        ref="groups"
        class="news-ticker-group"
        :aria-hidden="copy > 1 ? 'true' : undefined"
      >
        <div v-for="(item, i) in units" :key="`${copy}-${i}`" class="ticker-unit">
          <!-- The towing crew: each ant is a sprite-sheet walk cycle (8
               frames, tripod gait) on its own wavy drift line, with its own
               stride rhythm — a marching ant trail, not sprites on a string.
               Crew size varies per unit (deterministically, so every group
               copy stays identical). -->
          <span class="ticker-ant-row">
            <span
              v-for="a in crewSize(i)"
              :key="a"
              class="ticker-ant-wave"
              :style="antStyle(i, a)"
            >
              <span class="ticker-ant"></span>
            </span>
          </span>
          <component
            v-if="item"
            :is="cardTag(item)"
            class="ticker-card"
            :class="`ticker-card--${item.kind}`"
            v-bind="cardAttrs(item)"
          >
            <img
              v-if="item.kind === 'image'"
              class="ticker-media"
              :src="item.mediaUrl"
              :alt="item.text || 'Novinka'"
            />
            <template v-else>{{ item.text }}</template>
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { RouterLink } from 'vue-router'
import { api } from '../lib/api'

// Walk-cycle sprite sheets (8 frames each, generated top-view ants facing
// left), bundled + hashed by Vite.
const sheetModules = import.meta.glob('../../assets/shared/ants/walk/ant-walk-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
})
const SHEET_URLS = Object.keys(sheetModules).sort().map(key => sheetModules[key])

// Marching pace of the whole trail, in CSS pixels per second. Kept slow
// enough that a gait cycle moves the ant about one stride length — the legs
// and the ground speed have to agree or the ants look like they're skating.
const PX_PER_SECOND = 30

// Ant display size must mirror .ticker-ant in news-ticker.css:
// height clamp(24px, 3.5vw, 36px) × aspect 1.3333. The stride math below
// only needs a good approximation — a few px of foot slip is invisible.
const ANT_BASE_WIDTH = 32 * 1.3333
// Fraction of body length one gait cycle carries a real ant forward.
const STRIDE_FRACTION = 0.32

// Deterministic "randomness": same index → same value in both group copies,
// which the seamless loop depends on. Golden-ratio-ish scatter spreads the
// phases so no two ants stride or bob in step.
const scatter = (n, salt) => {
  const v = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453
  return v - Math.floor(v)
}

export default {
  name: 'NewsTicker',
  data() {
    return {
      items: [],
      paused: false,
      copies: 2
    }
  },
  computed: {
    // With no announcements the ants still march, just with nothing in tow —
    // the hero keeps its ant parade either way.
    units() {
      return this.items.length ? this.items : Array(3).fill(null)
    }
  },
  async mounted() {
    try {
      const items = await api.get('/api/announcements?ticker=1')
      this.items = Array.isArray(items) ? items : []
    } catch (error) {
      // Anonymous endpoint failing just means no news; the ants march on.
      console.error('Error loading announcements:', error)
    }
    this.$nextTick(() => this.startMarquee())
  },
  unmounted() {
    if (this.rafId) cancelAnimationFrame(this.rafId)
  },
  methods: {
    syncCopies() {
      const refs = this.$refs.groups
      const group = Array.isArray(refs) ? refs[0] : refs
      const gw = group ? group.offsetWidth : 0
      if (gw > 0 && this.$el) {
        this.copies = Math.max(2, Math.ceil(this.$el.offsetWidth / gw) + 1)
      }
    },
    // How many ants tow this unit: 3–6, varying between news items.
    crewSize(unitIndex) {
      // salt 9 chosen so the first few units land on visibly different sizes
      return 3 + Math.floor(scatter(unitIndex, 9) * 4)
    },
    // Per-ant personality: which sprite sheet, gait phase, a phase-shifted
    // slow drift wave (the meandering trail line), and a touch of size
    // variance. Stride tempo is DERIVED from the trail speed and the ant's
    // own size — bigger ant, longer stride, slower cadence — so every ant's
    // legs stay in sync with the ground passing beneath it. Index stride
    // 8 > max crew size keeps every ant's seed unique across units.
    antStyle(unitIndex, antIndex) {
      const n = unitIndex * 8 + antIndex
      const scale = 0.85 + scatter(n, 5) * 0.3
      const stridePx = ANT_BASE_WIDTH * scale * STRIDE_FRACTION
      const walkDur = (stridePx / PX_PER_SECOND) * (0.95 + scatter(n, 1) * 0.1)
      return {
        '--ant-sheet': `url("${SHEET_URLS[n % SHEET_URLS.length]}")`,
        '--walk-dur': walkDur.toFixed(3) + 's',
        '--walk-delay': (-scatter(n, 2) * 2).toFixed(2) + 's',
        '--wave-dur': (5 + scatter(n, 3) * 3).toFixed(2) + 's',
        '--wave-delay': (-scatter(n, 4) * 8).toFixed(2) + 's',
        '--ant-scale': scale.toFixed(2),
        '--ant-gap': (0.3 + scatter(n, 6) * 0.9).toFixed(2) + 'rem'
      }
    },
    // A post's card leads to its blog page unless the admin set an explicit
    // link. Internal targets stay inside the SPA via router-link.
    cardTag(item) {
      return this.isExternalLink(item.linkUrl) ? 'a' : RouterLink
    },
    cardAttrs(item) {
      if (this.isExternalLink(item.linkUrl)) {
        return { href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer' }
      }
      return { to: item.linkUrl || `/novinky/${item.id}` }
    },
    isExternalLink(url) {
      return typeof url === 'string' && /^https?:\/\//.test(url)
    },
    // requestAnimationFrame marquee instead of a CSS animation: a CSS
    // animation restarts (visible jump) whenever its duration is retuned for
    // new content width, and a wrong width means a hiccup at every loop.
    // Here the offset just wraps modulo the group's live width, so the trail
    // runs forever with no reset — even while images are still loading.
    //
    // Width and copy count are re-read every frame (writing transform never
    // invalidates layout, so these reads are cheap): images finishing to load
    // or a window resize immediately retune the wrap point and how many
    // copies the viewport needs, with no observers to fall out of sync.
    startMarquee() {
      // Fill the viewport before the first frame paints — layout metrics are
      // available even when rAF isn't (hidden tab, reduced motion), and the
      // static reduced-motion view must be gap-free too.
      this.syncCopies()

      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      let offset = 0
      let last = performance.now()
      const tick = (now) => {
        // Clamp dt so a background tab doesn't fast-forward on return.
        const dt = Math.min((now - last) / 1000, 0.1)
        last = now

        const track = this.$refs.track
        const refs = this.$refs.groups
        const group = Array.isArray(refs) ? refs[0] : refs
        if (track && group) {
          const groupWidth = group.offsetWidth
          if (groupWidth > 0) {
            const needed = Math.max(2, Math.ceil(this.$el.offsetWidth / groupWidth) + 1)
            if (needed !== this.copies) {
              this.copies = needed
            }
            if (!this.paused) {
              offset = (offset + PX_PER_SECOND * dt) % groupWidth
              track.style.transform = `translate3d(${-offset}px, 0, 0)`
            }
          }
        }
        this.rafId = requestAnimationFrame(tick)
      }
      this.rafId = requestAnimationFrame(tick)
    }
  }
}
</script>
