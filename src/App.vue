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
                  <label>Lokalita</label>
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
        <div class="logo">
          <router-link to="/" class="logo-link">
            🗺️ Hľadač Trás
          </router-link>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Hľadať trasy..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
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
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isMenuOpen: false,
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
