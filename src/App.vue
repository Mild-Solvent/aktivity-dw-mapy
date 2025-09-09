<template>
  <div id="app">
    <header class="header">
      <div class="header-container">
        <!-- Burger Menu -->
        <div class="burger-menu">
          <button 
            class="burger-button"
            @click="toggleMenu"
            :class="{ active: isMenuOpen }"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav class="menu" :class="{ open: isMenuOpen }">
            <div class="menu-content">
              <div class="menu-main">
                <router-link to="/" @click="closeMenu" class="menu-item">
                  🏠 Home
                </router-link>
                <router-link to="/terms" @click="closeMenu" class="menu-item">
                  📋 Terms & Conditions
                </router-link>
                <router-link to="/privacy" @click="closeMenu" class="menu-item">
                  🔒 Privacy Policy
                </router-link>
              </div>
              
              <!-- Filters (only show on home page) -->
              <div v-if="$route.name === 'Home'" class="filters">
                <h3>Filters</h3>
                <div class="filter-group">
                  <label>Sport</label>
                  <select v-model="filters.sport" @change="applyFilters">
                    <option value="">All Sports</option>
                    <option value="cycling">🚴 Cycling</option>
                    <option value="running">🏃 Running</option>
                    <option value="hiking">🥾 Hiking</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label>Distance</label>
                  <select v-model="filters.distance" @change="applyFilters">
                    <option value="">Any Distance</option>
                    <option value="short">< 10 km</option>
                    <option value="medium">10-20 km</option>
                    <option value="long">> 20 km</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label>Difficulty</label>
                  <select v-model="filters.difficulty" @change="applyFilters">
                    <option value="">Any Difficulty</option>
                    <option value="easy">🟢 Easy</option>
                    <option value="moderate">🟡 Moderate</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label>Location</label>
                  <select v-model="filters.location" @change="applyFilters">
                    <option value="">Any Location</option>
                    <option value="slovakia">🇸🇰 Slovakia</option>
                  </select>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <!-- Logo -->
        <div class="logo">
          <router-link to="/" class="logo-link">
            🗺️ TrackFinder
          </router-link>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search tracks..."
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
      @click="closeMenu"
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
    handleSearch() {
      // Search will be handled by components listening to this prop
    },
    applyFilters() {
      // Filters will be passed down to components
    },
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    }
  },
  watch: {
    $route() {
      this.closeMenu()
    }
  }
}
</script>
