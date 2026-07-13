<template>
  <!--
    Unified sport icon for cycling / hiking / running.
    Thin wrapper around lucide-vue-next so every sport reads in the same
    line-icon style and inherits color via currentColor
    (filters, cards, detail badges, admin picker).
  -->
  <component
    :is="iconComponent"
    class="sport-svg"
    :size="pixelSize"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>

<script>
import { Bike, Footprints, Mountain, Route } from 'lucide-vue-next'

const SIZES = { xs: 16, sm: 20, md: 28, lg: 40 }
const ICONS = { cycling: Bike, hiking: Mountain, running: Footprints }

export default {
  name: 'SportIcon',
  props: {
    sport: {
      type: String,
      default: 'cycling',
      validator: (v) => ['cycling', 'hiking', 'running', ''].includes(v),
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => Object.keys(SIZES).includes(v),
    },
    strokeWidth: {
      type: [Number, String],
      default: 2,
    },
  },
  computed: {
    iconComponent() {
      // '' = "all sports" → generic route icon
      return ICONS[this.sport] || Route
    },
    pixelSize() {
      return SIZES[this.size] || SIZES.md
    },
  },
}
</script>

<style scoped>
.sport-svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
