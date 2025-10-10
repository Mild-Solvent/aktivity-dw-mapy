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
                  🏠 Domov
                </router-link>
                <router-link to="/terms" @click="closeMenu" class="menu-item">
                  📋 Všeobecné podmienky
                </router-link>
                <router-link to="/privacy" @click="closeMenu" class="menu-item">
                  🔒 Ochrana súkromia
                </router-link>
              </div>
              
              <!-- Filters (only show on home page) -->
              <div v-if="$route.name === 'Home'" class="filters">
                <h3>Filtre</h3>
                <div class="filter-group">
                  <label>Šport</label>
                  <select v-model="filters.sport" @change="applyFilters">
                    <option value="">Všetky športy</option>
                    <option value="cycling">🚴 Cyklistika</option>
                    <option value="running">🏃 Beh</option>
                    <option value="hiking">🥾 Turistika</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label>Vzdialenosť</label>
                  <select v-model="filters.distance" @change="applyFilters">
                    <option value="">Akákoľvek vzdialenosť</option>
                    <option value="short">< 10 km</option>
                    <option value="medium">10–20 km</option>
                    <option value="long">> 20 km</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label>Náročnosť</label>
                  <select v-model="filters.difficulty" @change="applyFilters">
                    <option value="">Akákoľvek náročnosť</option>
                    <option value="easy">🟢 Ľahká</option>
                    <option value="moderate">🟡 Stredná</option>
                    <option value="hard">🔴 Ťažká</option>
                  </select>
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
            🏃 ACTIVITY DW Club
          </router-link>
        </div>

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
          >
            🔍
          </button>
        </div>
      </div>
    </header>

    <!-- Menu Overlay -->
    <div 
      v-if="isMenuOpen" 
      class="menu-overlay"
    ></div>

    <main class="main-content">
      <router-view 
        :filters="filters" 
        :search-query="searchQuery"
        @update-filters="updateFilters"
      />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-links">
            <router-link to="/" class="footer-link">
              🏠 Domov
            </router-link>
            <router-link to="/terms" class="footer-link">
              📋 Všeobecné podmienky
            </router-link>
            <router-link to="/privacy" class="footer-link">
              🔒 Ochrana súkromia
            </router-link>
          </div>
          
          <div class="footer-info">
            <div class="footer-image">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
              <img src="/assets/shared/mravce.png" alt="Mravce Logo" class="footer-logo">
            </div>
            <div class="copyright">
              Vytvorené v spolupráci s <a href="https://new.ceaeurope.sk/" target="_blank" rel="noopener" class="support-link">ceaeurope.sk</a>
            </div>
            <div class="developer">
              Development a design od <a href="https://mild-solvent.github.io/Portfolio/" target="_blank" rel="noopener" class="developer-link">Mild Solvent</a>
            </div>
            <div class="footer-cea-flower">
              <img src="/assets/shared/cea-flower.png" alt="CEA Flower" class="cea-flower-logo">
            </div>
          </div>
        </div>
      </div>
    </footer>
    
    <!-- Cookie Banner -->
    <CookieBanner />
  </div>
</template>

<script>
import CookieBanner from './components/CookieBanner.vue'

export default {
  name: 'App',
  components: {
    CookieBanner
  },
  data() {
    return {
      isMenuOpen: false,
      isSearchExpanded: false,
      searchQuery: '',
      filters: {
        sport: '',
        distance: '',
        difficulty: '',
        location: ''
      }
    }
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      this.isMenuOpen = false
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
    handleGlobalClick(event) {
      // Close menu if clicking outside of burger menu area
      if (this.isMenuOpen && !this.$refs.burgerMenu?.contains(event.target)) {
        this.closeMenu()
      }
      
      // Collapse search if clicking outside of search container on mobile
      if (this.isSearchExpanded && !this.$refs.searchContainer?.contains(event.target)) {
        this.collapseSearch()
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleGlobalClick)
  },
  unmounted() {
    document.removeEventListener('click', this.handleGlobalClick)
  },
  watch: {
    $route() {
      this.closeMenu()
    }
  }
}
</script>
