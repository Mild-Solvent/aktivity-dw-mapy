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
  /* Ensure banner doesn't exceed viewport width */
  max-width: 100vw;
  width: 100%;
  box-sizing: border-box;
  /* Prevent horizontal scrolling */
  overflow-x: hidden;
  /* Ensure banner is contained within viewport */
  margin: 0;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  /* Prevent content from overflowing */
  width: 100%;
  box-sizing: border-box;
}

.cookie-text {
  flex: 1;
  /* Prevent text from growing too much on mobile */
  min-width: 0;
}

.cookie-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  /* Ensure text wraps properly */
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.cookie-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-shrink: 0;
  /* Prevent actions from being too narrow */
  min-width: fit-content;
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
  /* Prevent button from shrinking too much */
  flex-shrink: 0;
  white-space: nowrap;
  /* Ensure button stays within bounds */
  max-width: 100%;
  box-sizing: border-box;
}

.accept-btn:hover {
  background: #45a049;
}

.privacy-link {
  color: #81C784;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem;
  /* Prevent link from shrinking too much */
  flex-shrink: 0;
  white-space: nowrap;
  /* Ensure link stays within bounds */
  max-width: 100%;
  box-sizing: border-box;
  /* Better text handling */
  overflow: hidden;
  text-overflow: ellipsis;
}

.privacy-link:hover {
  color: #A5D6A7;
  text-decoration: underline;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .cookie-banner {
    padding: 0.75rem;
  }
  
  .cookie-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .cookie-text {
    width: 100%;
  }
  
  .cookie-text p {
    font-size: 0.85rem;
    line-height: 1.5;
  }
  
  .cookie-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
}

/* Extra small mobile devices */
@media (max-width: 480px) {
  .cookie-banner {
    padding: 0.5rem;
  }
  
  .cookie-content {
    gap: 0.75rem;
  }
  
  .cookie-text p {
    font-size: 0.8rem;
  }
  
  .cookie-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .accept-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .privacy-link {
    width: 100%;
    text-align: center;
    padding: 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
