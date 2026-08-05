<template>
  <div class="reset-page">
    <section class="reset-card">
      <h1>Nastavenie nového hesla</h1>

      <!-- `&& !done` matters: the token is cleared once it has been redeemed,
           so without it a successful reset also renders "link is incomplete"
           directly above its own success message. -->
      <p v-if="!token && !done" class="auth-message auth-message-error">
        Odkaz je neúplný. Otvorte ho prosím presne tak, ako prišiel v e-maile.
      </p>

      <template v-else-if="!done">
        <p class="reset-hint">
          Zadajte nové heslo pre svoj účet. Po zmene vás odhlásime zo všetkých zariadení.
        </p>

        <form class="auth-form" @submit.prevent="submit">
          <label class="auth-field">
            <span>Nové heslo</span>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              placeholder="Minimálne 8 znakov"
            />
          </label>

          <label class="auth-field">
            <span>Nové heslo znova</span>
            <input
              v-model="confirmation"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
            />
          </label>

          <button class="auth-option-button" type="submit" :disabled="loading">
            {{ loading ? 'Pracujem...' : 'Nastaviť heslo' }}
          </button>
        </form>
      </template>

      <p v-if="done" class="auth-message auth-message-success">
        {{ message }}
      </p>
      <p v-if="error" class="auth-message auth-message-error">
        {{ error }}
      </p>

      <router-link class="reset-back" to="/">Späť na zoznam trás</router-link>
    </section>
  </div>
</template>

<script>
import { api } from '../lib/api'

export default {
  name: 'ResetPassword',
  data() {
    return {
      token: '',
      password: '',
      confirmation: '',
      loading: false,
      done: false,
      message: '',
      error: ''
    }
  },
  mounted() {
    this.token = String(this.$route.query.token || '')

    // Take the token out of the address bar as soon as it has been read. It
    // stays in this component's state for the submit, but it no longer sits in
    // the URL where it would end up in browser history, or in a Referer header
    // if the page ever loads anything external.
    if (this.token) {
      const clean = this.$route.path
      window.history.replaceState(window.history.state, '', clean)
    }
  },
  methods: {
    async submit() {
      this.error = ''

      if (this.password !== this.confirmation) {
        this.error = 'Heslá sa nezhodujú.'
        return
      }

      this.loading = true
      try {
        const res = await api.post('/api/auth/reset-password', {
          token: this.token,
          password: this.password
        })
        this.message = res?.message || 'Heslo bolo zmenené. Teraz sa môžete prihlásiť.'
        this.done = true
        this.password = ''
        this.confirmation = ''
        this.token = ''
      } catch (err) {
        this.error = err.message || 'Nepodarilo sa zmeniť heslo. Skúste to znova.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.reset-page {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.reset-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  max-width: 420px;
  padding: 2rem;
  width: 100%;
}

.reset-card h1 {
  font-size: 1.35rem;
  margin: 0 0 0.75rem;
}

.reset-hint {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0 0 1.25rem;
}

.reset-back {
  color: #6b7280;
  display: inline-block;
  font-size: 0.85rem;
  margin-top: 1.25rem;
}
</style>
