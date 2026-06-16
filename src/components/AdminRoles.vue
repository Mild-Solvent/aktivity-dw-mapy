<template>
<div class="admin-page">
  <div class="container">
    <section v-if="!isAdmin" class="admin-access-panel">
      <h1>Iba pre administrátora</h1>
      <p>Roly používateľov môže meniť iba administrátor.</p>
    </section>

    <section v-else class="admin-form-shell">
      <div class="admin-form-header">
        <button class="back-button admin-back-button" type="button" @click="$router.push('/')">
          Späť na trasy
        </button>
        <div>
          <h1>Správa rolí</h1>
          <p>Priraď alebo odober roly registrovaným používateľom.</p>
        </div>
      </div>

      <form class="role-form" @submit.prevent="saveRole">
        <label class="form-field">
          <span>Email používateľa</span>
          <input v-model.trim="email" required type="email" placeholder="pouzivatel@example.com" />
        </label>
        <label class="form-field">
          <span>Rola</span>
          <select v-model="role">
            <option value="user">Používateľ</option>
            <option value="trails_adder">Pridávateľ trás</option>
            <option value="admin">Administrátor</option>
          </select>
        </label>
        <button class="admin-inline-button" type="submit">Uložiť rolu</button>
      </form>

      <div class="admin-list">
        <article v-for="item in users" :key="item.email" class="admin-list-item">
          <div>
            <h2>{{ item.email }}</h2>
            <p>{{ labels[item.role] || item.role }}</p>
          </div>
          <div class="admin-item-actions">
            <button
              class="admin-inline-button danger"
              type="button"
              :disabled="removingEmail === item.email"
              @click="removeRole(item.email)"
            >
              {{ removingEmail === item.email ? 'Odstraňujem...' : 'Odobrať' }}
            </button>
          </div>
        </article>
      </div>

      <p v-if="message" class="auth-message auth-message-success">{{ message }}</p>
      <p v-if="error" class="auth-message auth-message-error">{{ error }}</p>
    </section>
  </div>
</div>
</template>

<script>
import { ROLE_LABELS, ROLES } from '../config/admin'
import { getAllRoles, saveRemoteRole, deleteRemoteRole } from '../data/roles'

export default {
  name: 'AdminRoles',
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      email: '',
      role: ROLES.TRAILS_ADDER,
      users: [],
      labels: ROLE_LABELS,
      removingEmail: '',
      message: '',
      error: ''
    }
  },
  async mounted() {
    await this.loadRoles()
  },
  methods: {
    async loadRoles() {
      this.users = await getAllRoles()
    },
    async saveRole() {
      this.message = ''
      this.error = ''

      try {
        await saveRemoteRole(this.email, this.role)
        this.message = 'Rola bola uložená.'
        this.email = ''
        await this.loadRoles()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa uložiť rolu.'
      }
    },
    async removeRole(email) {
      this.message = ''
      this.error = ''

      if (!window.confirm(`Naozaj chceš odobrať rolu pre ${email}?`)) {
        return
      }

      this.removingEmail = email

      try {
        await deleteRemoteRole(email)
        this.message = `Rola pre ${email} bola odobraná.`
        await this.loadRoles()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa odobrať rolu.'
      } finally {
        this.removingEmail = ''
      }
    }
  }
}
</script>
