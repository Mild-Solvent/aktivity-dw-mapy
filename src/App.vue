<template>
  <div id="app">
    <header class="header">
      <div class="header-container">
        <!-- Burger Menu -->
        <div class="burger-menu" ref="burgerMenu">
          <button 
            class="burger-button"
            @click="toggleMenu"
            :class="{ active: isMenuOpen }"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav class="menu" :class="{ open: isMenuOpen }" @click="handleMenuClick">
            <div class="menu-content">
              <div class="menu-main">
                <router-link to="/" @click="closeMenu" class="menu-item">
                  <House class="section-icon" :size="16" aria-hidden="true" /> Domov
                </router-link>
                <router-link to="/terms" @click="closeMenu" class="menu-item">
                  <ScrollText class="section-icon" :size="16" aria-hidden="true" /> Všeobecné podmienky
                </router-link>
                <router-link to="/privacy" @click="closeMenu" class="menu-item">
                  <Lock class="section-icon" :size="16" aria-hidden="true" /> Ochrana súkromia
                </router-link>
              </div>
              
              <div v-if="canAddTrails || isAdmin" class="menu-admin">
                <router-link v-if="canAddTrails" to="/admin/trails/new" @click="closeMenu" class="menu-item">
                  + Pridať trasu
                </router-link>

                <router-link v-if="canAddTrails" to="/admin/manage-trails" @click="closeMenu" class="menu-item">
                  Správa trás
                </router-link>
                <router-link v-if="isAdmin" to="/admin/roles" @click="closeMenu" class="menu-item">
                  Správa rolí
                </router-link>
              </div>

              <!-- Filters (only show on home page) -->
              <div v-if="$route.name === 'Home'" class="filters">
                <h3>Filtre</h3>
                <div class="filter-group">
                  <label>Šport</label>
                  <div class="sport-options">
                    <button
                      class="sport-button"
                      :class="{ active: filters.sport === '' }"
                      :aria-pressed="filters.sport === ''"
                      @click="setSport('')"
                      title="Všetky športy"
                      aria-label="Všetky športy"
                    >
                      <SportIcon sport="" size="md" />
                    </button>
                    <button
                      class="sport-button"
                      :class="{ active: filters.sport === 'cycling' }"
                      :aria-pressed="filters.sport === 'cycling'"
                      @click="setSport('cycling')"
                      title="Cyklistika"
                      aria-label="Cyklistika"
                    >
                      <SportIcon sport="cycling" size="md" />
                    </button>
                    <button
                      class="sport-button"
                      :class="{ active: filters.sport === 'hiking' }"
                      :aria-pressed="filters.sport === 'hiking'"
                      @click="setSport('hiking')"
                      title="Turistika"
                      aria-label="Turistika"
                    >
                      <SportIcon sport="hiking" size="md" />
                    </button>
                    <button
                      class="sport-button"
                      :class="{ active: filters.sport === 'running' }"
                      :aria-pressed="filters.sport === 'running'"
                      @click="setSport('running')"
                      title="Beh"
                      aria-label="Beh"
                    >
                      <SportIcon sport="running" size="md" />
                    </button>
                  </div>
                </div>
                
                <div class="filter-group">
                  <label>Vzdialenosť ({{ filters.maxDistance }} km)</label>
                  <input 
                    type="range" 
                    v-model.number="filters.maxDistance" 
                    @input="applyFilters"
                    min="0" 
                    max="1000" 
                    step="10"
                    class="distance-slider"
                  />
                  <div class="slider-labels">
                    <span>0 km</span>
                    <span>1000 km</span>
                  </div>
                </div>
                
                <div class="filter-group">
                  <label>Náročnosť</label>
                  <div class="difficulty-options">
                    <button
                      class="difficulty-button"
                      :class="{ active: filters.difficulty === '' }"
                      :aria-pressed="filters.difficulty === ''"
                      @click="setDifficulty('')"
                      title="Všetky náročnosti"
                    >
                      <span>Všetky</span>
                    </button>
                    <button
                      v-for="level in difficultyLevels"
                      :key="level"
                      class="difficulty-button"
                      :class="[`diff--${level}`, { active: filters.difficulty === level }]"
                      :aria-pressed="filters.difficulty === level"
                      @click="setDifficulty(level)"
                    >
                      <DifficultyBadge :difficulty="level" size="sm" />
                    </button>
                  </div>
                </div>
                
                <div class="filter-group">
                  <label>START</label>
                  <select v-model="filters.location" @change="applyFilters">
                    <option value="">Akákoľvek lokalita</option>
                    <option value="slovakia">🇸🇰 Slovensko</option>
                  </select>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <!-- Logo -->
        <div class="logo" :class="{ 'logo-hidden': isSearchExpanded }">
          <router-link to="/" class="logo-link">
            ACTIVITY DW Club
          </router-link>
        </div>

        <div class="header-actions" ref="authMenu">
          <!-- Search Bar -->
          <div 
            class="search-container" 
            :class="{ 'search-expanded': isSearchExpanded }"
            ref="searchContainer"
          >
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Hľadať trasy..."
            class="search-input"
            ref="searchInput"
          />
          <button 
            class="search-icon"
            @click="toggleSearch"
            :class="{ 'search-icon-active': isSearchExpanded }"
            aria-label="Search"
          >
            🔍
          </button>
          </div>

          <router-link
            v-if="canAddTrails"
            to="/admin/trails/new"
            class="admin-add-button"
            title="Pridať trasu"
            aria-label="Pridať trasu"
            @click="closeMenu"
          >
            + Trasa
          </router-link>

          <button
            class="login-button"
            type="button"
            @click="toggleAuthMenu"
            :aria-expanded="isAuthMenuOpen"
            aria-controls="auth-menu"
          >
            {{ authUser ? 'Účet' : 'Prihlásiť' }}
          </button>

        </div>
      </div>
    </header>

    <div
      v-if="isAuthMenuOpen"
      class="auth-popup-overlay"
      @click="closeAuthMenu"
    >
      <section
        id="auth-menu"
        class="auth-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-popup-title"
        @click.stop
      >
        <div class="auth-menu-header">
          <h2 id="auth-popup-title">{{ authPopupTitle }}</h2>
          <button
            class="auth-close"
            type="button"
            @click="closeAuthMenu"
            aria-label="Close login menu"
          >
            x
          </button>
        </div>

        <div v-if="authUser" class="auth-account">
          <p class="auth-user-email">{{ authUser.email }}</p>
          <p v-if="roleLabel" class="auth-admin-badge">{{ roleLabel }}</p>
          <button class="auth-option-button auth-option-secondary" type="button" @click="signOut" :disabled="authLoading">
            Odhlásiť sa
          </button>
        </div>

        <template v-else>
          <div class="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              class="auth-tab"
              type="button"
              :class="{ active: authMode === 'login' }"
              @click="setAuthMode('login')"
            >
              Prihlásenie
            </button>
            <button
              class="auth-tab"
              type="button"
              :class="{ active: authMode === 'register' }"
              @click="setAuthMode('register')"
            >
              Registrácia
            </button>
          </div>

          <form class="auth-form" @submit.prevent="submitAuth">
            <label class="auth-field">
              <span>Email</span>
              <input
                v-model.trim="authEmail"
                type="email"
                autocomplete="email"
                required
                placeholder="you@example.com"
              />
            </label>

            <label class="auth-field">
              <span>Password</span>
              <input
                v-model="authPassword"
                type="password"
                :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'"
                required
                minlength="6"
                placeholder="Minimálne 6 znakov"
              />
            </label>

            <button class="auth-option-button" type="submit" :disabled="authLoading">
              {{ authLoading ? 'Pracujem...' : authSubmitLabel }}
            </button>
          </form>
        </template>

        <p v-if="authError" class="auth-message auth-message-error">
          {{ authError }}
        </p>
        <p v-if="authMessage" class="auth-message auth-message-success">
          {{ authMessage }}
        </p>
      </section>
    </div>

    <!-- Menu Overlay -->
    <div 
      v-if="isMenuOpen" 
      class="menu-overlay"
    ></div>

    <main class="main-content">
      <router-view 
        :filters="filters" 
        :search-query="searchQuery"
        :auth-user="authUser"
        :is-admin="isAdmin"
        :can-add-trails="canAddTrails"
        :user-role="userRole"
        @update-filters="updateFilters"
      />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-links">
            <router-link to="/" class="footer-link">
              <House class="section-icon" :size="14" aria-hidden="true" /> Domov
            </router-link>
            <router-link to="/terms" class="footer-link">
              <ScrollText class="section-icon" :size="14" aria-hidden="true" /> Všeobecné podmienky
            </router-link>
            <router-link to="/privacy" class="footer-link">
              <Lock class="section-icon" :size="14" aria-hidden="true" /> Ochrana súkromia
            </router-link>
          </div>
          
          <div class="footer-info">
            <div class="copyright">
              Vytvorené v spolupráci s <a href="https://new.ceaeurope.sk/" target="_blank" rel="noopener" class="support-link">ceaeurope.sk</a>
            </div>
            <div class="developer">
              Development a design od <a href="https://mild-solvent.github.io/Portfolio/" target="_blank" rel="noopener" class="developer-link">Mild Solvent</a>
            </div>
            <a href="https://new.ceaeurope.sk/" target="_blank" rel="noopener" class="footer-cea-flower">
              <img src="/assets/shared/cea-flower.png" alt="CEA Flower" class="cea-flower-logo">
            </a>
          </div>
        </div>
      </div>
    </footer>
    
    <!-- Cookie Banner -->
    <CookieBanner />
  </div>
</template>

<script>
import { House, Lock, ScrollText } from 'lucide-vue-next'
import CookieBanner from './components/CookieBanner.vue'
import DifficultyBadge from './components/DifficultyBadge.vue'
import SportIcon from './components/SportIcon.vue'
import { ROLE_LABELS, ROLES, canAddTrails as roleCanAddTrails } from './config/admin'
import { api } from './lib/api'

export default {
  name: 'App',
  components: {
    CookieBanner,
    DifficultyBadge,
    House,
    Lock,
    ScrollText,
    SportIcon
  },
  data() {
    return {
      isMenuOpen: false,
      isAuthMenuOpen: false,
      isSearchExpanded: false,
      authMode: 'login',
      authEmail: '',
      authPassword: '',
      authLoading: false,
      authMessage: '',
      authError: '',
      authUser: null,
      userRole: ROLES.USER,
      searchQuery: '',
      difficultyLevels: ['beginner', 'easy', 'moderate', 'hard', 'expert'],
      filters: {
        sport: '',
        maxDistance: 1000,
        difficulty: '',
        location: ''
      }
    }
  },
  computed: {
    authPopupTitle() {
      if (this.authUser) {
        return 'Účet'
      }

      return this.authMode === 'register' ? 'Vytvoriť účet' : 'Prihlásenie'
    },
    authSubmitLabel() {
      return this.authMode === 'register' ? 'Vytvoriť účet' : 'Prihlásiť emailom'
    },
    isAdmin() {
      return this.userRole === ROLES.ADMIN
    },
    canAddTrails() {
      return roleCanAddTrails(this.userRole)
    },
    roleLabel() {
      return this.authUser ? ROLE_LABELS[this.userRole] : ''
    }
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      this.isMenuOpen = false
    },
    toggleAuthMenu() {
      this.isAuthMenuOpen = !this.isAuthMenuOpen
      if (this.isAuthMenuOpen) {
        this.closeMenu()
        this.collapseSearch()
      }
    },
    closeAuthMenu() {
      this.isAuthMenuOpen = false
    },
    setAuthMode(mode) {
      this.authMode = mode
      this.authError = ''
      this.authMessage = ''
    },
    async submitAuth() {
      this.authError = ''
      this.authMessage = ''
      this.authLoading = true

      try {
        const path = this.authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
        const me = await api.post(path, {
          email: this.authEmail,
          password: this.authPassword
        })

        this.authUser = { email: me.email }
        this.userRole = me.role || ROLES.USER
        this.authMessage = this.authMode === 'register' ? 'Účet bol vytvorený.' : 'Prihlásenie prebehlo úspešne.'
        this.authPassword = ''
        this.closeAuthMenu()
      } catch (error) {
        this.authError = error.message || 'Prihlásenie zlyhalo. Skús to znova.'
      } finally {
        this.authLoading = false
      }
    },
    async signOut() {
      this.authError = ''
      this.authMessage = ''
      this.authLoading = true

      try {
        await api.post('/api/auth/logout')
        this.authUser = null
        this.userRole = ROLES.USER
        this.authEmail = ''
        this.authPassword = ''
        this.authMessage = 'Odhlásenie prebehlo úspešne.'
      } catch (error) {
        this.authError = error.message || 'Odhlásenie zlyhalo. Skús to znova.'
      } finally {
        this.authLoading = false
      }
    },
    handleMenuClick(event) {
      // Prevent the menu from closing when clicking inside it
      event.stopPropagation()
    },
    handleSearch() {
      // Search will be handled by components listening to this prop
    },
    toggleSearch() {
      this.isSearchExpanded = !this.isSearchExpanded
      if (this.isSearchExpanded) {
        // Focus the input when expanded
        this.$nextTick(() => {
          const searchInput = this.$refs.searchInput
          if (searchInput) {
            searchInput.focus()
          }
        })
      }
    },
    collapseSearch() {
      this.isSearchExpanded = false
    },
    applyFilters() {
      // Filters will be passed down to components
    },
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },
    setDifficulty(difficulty) {
      this.filters.difficulty = difficulty
      this.applyFilters()
    },
    setSport(sport) {
      this.filters.sport = sport
      this.applyFilters()
    },
    handleGlobalClick(event) {
      // Close menu if clicking outside of burger menu area
      if (this.isMenuOpen && !this.$refs.burgerMenu?.contains(event.target)) {
        this.closeMenu()
      }

      // Collapse search if clicking outside of search container on mobile
      if (this.isSearchExpanded && !this.$refs.searchContainer?.contains(event.target)) {
        this.collapseSearch()
      }

    },
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeAuthMenu()
      }
    },
    async bootstrapSession() {
      // Replaces supabase.auth.getSession(). The httpOnly cookie is sent
      // automatically; the server returns the current user or 401.
      try {
        const me = await api.get('/api/auth/me')
        this.authUser = { email: me.email }
        this.userRole = me.role || ROLES.USER
      } catch (err) {
        // 401 just means anonymous — clear state.
        this.authUser = null
        this.userRole = ROLES.USER
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleGlobalClick)
    document.addEventListener('keydown', this.handleKeydown)
    this.bootstrapSession()
  },
  unmounted() {
    document.removeEventListener('click', this.handleGlobalClick)
    document.removeEventListener('keydown', this.handleKeydown)
  },
  watch: {
    $route() {
      this.closeMenu()
      this.closeAuthMenu()
    }
  }
}
</script>
