<template>
  <!--
    Color-coded difficulty pill (ski-slope semantics):
    beginner/easy = green, moderate = blue, hard = orange, expert = near-black.
    Single source of truth for difficulty labels + colors across the app.
  -->
  <span
    v-if="variant === 'pill'"
    class="diff-badge"
    :class="badgeClasses"
    :title="label"
  >
    <component :is="icon" class="diff-badge-icon" :size="iconSize" aria-hidden="true" />
    {{ label }}
  </span>
  <span
    v-else
    class="diff-badge diff-badge--compact"
    :class="badgeClasses"
    role="img"
    :aria-label="label"
    :title="label"
  >
    <component :is="icon" class="diff-badge-icon" :size="iconSize" aria-hidden="true" />
  </span>
</template>

<script>
import { Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-vue-next'

const LABELS = {
  beginner: 'Začiatočník',
  easy: 'Ľahká',
  moderate: 'Stredná',
  hard: 'Ťažká',
  expert: 'Expertná',
}

const ICONS = {
  beginner: SignalLow,
  easy: SignalMedium,
  moderate: SignalHigh,
  hard: Signal,
  expert: Signal,
}

export default {
  name: 'DifficultyBadge',
  props: {
    difficulty: {
      type: String,
      required: true,
      validator: (v) => Object.keys(LABELS).includes(v),
    },
    variant: {
      type: String,
      default: 'pill',
      validator: (v) => ['pill', 'compact'].includes(v),
    },
    size: {
      type: String,
      default: 'sm',
      validator: (v) => ['sm', 'md'].includes(v),
    },
  },
  computed: {
    label() {
      return LABELS[this.difficulty] || 'Náročnosť'
    },
    icon() {
      return ICONS[this.difficulty] || SignalHigh
    },
    iconSize() {
      return this.size === 'md' ? 16 : 14
    },
    badgeClasses() {
      return [`diff-badge--${this.difficulty}`, `diff-badge--${this.size}`]
    },
  },
}
</script>

<style scoped>
.diff-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--chip-radius);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
}

.diff-badge--sm {
  font-size: 0.8rem;
  padding: 0.3rem 0.65rem;
}

.diff-badge--md {
  font-size: 0.9rem;
  padding: 0.45rem 0.9rem;
}

.diff-badge--compact {
  padding: 0.3rem;
  border-radius: 8px;
}

.diff-badge-icon {
  flex-shrink: 0;
}

.diff-badge--beginner {
  color: var(--diff-beginner);
  background: var(--diff-beginner-bg);
  border-color: var(--diff-beginner-border);
}

.diff-badge--easy {
  color: var(--diff-easy);
  background: var(--diff-easy-bg);
  border-color: var(--diff-easy-border);
}

.diff-badge--moderate {
  color: var(--diff-moderate);
  background: var(--diff-moderate-bg);
  border-color: var(--diff-moderate-border);
}

.diff-badge--hard {
  color: var(--diff-hard);
  background: var(--diff-hard-bg);
  border-color: var(--diff-hard-border);
}

.diff-badge--expert {
  color: var(--diff-expert);
  background: var(--diff-expert-bg);
  border-color: var(--diff-expert-border);
}
</style>
