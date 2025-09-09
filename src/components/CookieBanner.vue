<template>
  <div v-if="showBanner" class="cookie-banner">
    <div class="cookie-content">
      <div class="cookie-text">
        <p>
          <strong>🍪 Informácie o súboroch cookies</strong><br>
          Táto stránka nezbiera žiadne používateľské údaje a je hostovaná na GitHub Pages. 
          Nepoužívame sledovacie cookies ani analytické nástroje. 
          Váša súkromie je pre nás dôležité.
        </p>
      </div>
      <div class="cookie-actions">
        <button @click="acceptCookies" class="accept-btn">
          ✓ Rozumiem
        </button>
        <router-link to="/privacy" class="privacy-link" @click="acceptCookies">
          Viac informácií
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CookieBanner',
  data() {
    return {
      showBanner: false
    }
  },
  methods: {
    acceptCookies() {
      this.showBanner = false
      localStorage.setItem('cookiesAccepted', 'true')
    },
    checkCookieConsent() {
      const cookiesAccepted = localStorage.getItem('cookiesAccepted')
      if (!cookiesAccepted) {
        this.showBanner = true
      }
    }
  },
  mounted() {
    this.checkCookieConsent()
  }
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 1rem;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cookie-text {
  flex: 1;
}

.cookie-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.cookie-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-shrink: 0;
}

.accept-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.accept-btn:hover {
  background: #45a049;
}

.privacy-link {
  color: #81C784;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem;
}

.privacy-link:hover {
  color: #A5D6A7;
  text-decoration: underline;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .cookie-content {
    flex-direction: column;
    text-align: center;
  }
  
  .cookie-actions {
    width: 100%;
    justify-content: center;
  }
  
  .cookie-text p {
    font-size: 0.85rem;
  }
}
</style>
