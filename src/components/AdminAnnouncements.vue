<template>
  <div class="admin-page">
    <div class="container">
      <section v-if="!isAdmin" class="admin-access-panel">
        <h1>Iba pre administrátorov</h1>
        <p>Novinky môže spravovať iba administrátor.</p>
      </section>

      <section v-else class="admin-form-shell">
        <div class="admin-form-header">
          <button class="back-button admin-back-button" type="button" @click="$router.push('/')">
            Späť na trasy
          </button>
          <div>
            <h1>Správa noviniek</h1>
            <p>
              Každá novinka je článok na stránke <router-link to="/novinky">Novinky</router-link> —
              a mravce na hlavnej stránke nosia tie, ktoré označíš prepínačom „Mravce“.
            </p>
          </div>
        </div>

        <form class="trail-form" @submit.prevent="submit">
          <div v-if="editingId" class="announcement-editing-note">
            Upravuješ novinku „{{ editingTitle }}“.
            <button class="auth-link-button" type="button" @click="cancelEdit">Zrušiť úpravu</button>
          </div>

          <div v-if="!editingId" class="form-field form-field-wide">
            <label>Typ novinky</label>
            <div class="announcement-kind-toggle">
              <button
                type="button"
                class="admin-inline-button"
                :class="{ 'kind-active': form.kind === 'text' }"
                @click="setKind('text')"
              >
                <Type :size="14" aria-hidden="true" /> Text
              </button>
              <button
                type="button"
                class="admin-inline-button"
                :class="{ 'kind-active': form.kind === 'image' }"
                @click="setKind('image')"
              >
                <ImageIcon :size="14" aria-hidden="true" /> Obrázok
              </button>
            </div>
          </div>

          <div class="form-field form-field-wide">
            <label for="announcement-text">Názov novinky</label>
            <input
              id="announcement-text"
              v-model="form.text"
              type="text"
              maxlength="200"
              required
              placeholder="Napr. V sobotu spoločná vyjazdka o 9:00 z Novej Dubnice"
            />
            <p class="field-hint">
              {{ form.text.length }}/200 znakov. Názov je titulok článku a zároveň to,
              čo mravce nesú v pásiku (pri obrázkovej novinke slúži ako popis obrázka).
              V pásiku sa zobrazuje v jednom riadku — kratší názov sa číta ľahšie.
            </p>
          </div>

          <div class="form-field form-field-wide">
            <label for="announcement-body">Obsah článku (nepovinné)</label>
            <textarea
              id="announcement-body"
              v-model="form.body"
              rows="6"
              maxlength="50000"
              placeholder="Napíš, čo sa deje — celý text sa zobrazí na stránke novinky."
            ></textarea>
            <p class="field-hint">Zobrazí sa na samostatnej stránke novinky. Odseky zostanú zachované.</p>
          </div>

          <div v-if="form.kind === 'image' && !editingId" class="form-field form-field-wide">
            <label for="announcement-file">Obrázok</label>
            <input
              id="announcement-file"
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="onFileChange"
            />
            <div class="announcement-guidelines">
              <strong>Aby sa obrázok vždy zobrazil správne:</strong>
              <ul>
                <li>Pomer strán (šírka : výška) medzi <strong>1:1 a 5:1</strong> — širšie obrázky sa orežú, band má výšku pásika.</li>
                <li>Výška aspoň <strong>120 px</strong> (zobrazuje sa ~64 px, dvojnásobok kvôli ostrosti na retina displejoch).</li>
                <li>Šírka najviac <strong>2000 px</strong> — väčšie sa automaticky zmenšia.</li>
                <li>Formáty JPG, PNG, WebP alebo GIF (animácia GIF-u sa zachová), max 25 MB.</li>
                <li>Ideál: banner ~<strong>600 × 150 px</strong> (4:1) alebo štvorec ~<strong>200 × 200 px</strong>.</li>
              </ul>
            </div>
            <p v-if="fileError" class="field-error">{{ fileError }}</p>
            <div v-if="filePreview" class="announcement-preview-band">
              <img class="ticker-media announcement-preview-img" :src="filePreview" alt="Náhľad novinky" />
              <span class="field-hint">Takto vysoký bude obrázok v pásiku noviniek.</span>
            </div>
          </div>

          <div class="form-field form-field-wide">
            <label for="announcement-link">Odkaz (nepovinné)</label>
            <input
              id="announcement-link"
              v-model.trim="form.linkUrl"
              type="text"
              maxlength="500"
              placeholder="https://… alebo /track/nazov-trasy"
            />
            <p class="field-hint">
              Bez odkazu vedie novinka v pásiku na svoju vlastnú stránku;
              odkaz to prepíše (napr. priamo na trasu).
            </p>
          </div>

          <div class="form-field form-field-wide">
            <label class="announcement-check">
              <input v-model="form.inTicker" type="checkbox" />
              Nosia ju mravce na hlavnej stránke
            </label>
            <p class="field-hint">Článok bude na stránke Novinky tak či tak — toto rozhoduje len o pásiku.</p>
          </div>

          <div class="form-actions">
            <button class="admin-inline-button" type="submit" :disabled="saving">
              {{ saving ? 'Ukladám...' : (editingId ? 'Uložiť zmeny' : 'Pridať novinku') }}
            </button>
          </div>
        </form>

        <div class="admin-list announcement-list">
          <p v-if="!announcements.length" class="empty-admin-state">
            Zatiaľ žiadne novinky — mravce pochodujú naprázdno.
          </p>

          <article
            v-for="(item, index) in announcements"
            :key="item.id"
            class="admin-list-item announcement-item"
            :class="{ 'announcement-item--hidden': !item.active }"
          >
            <img
              v-if="item.kind === 'image'"
              :src="item.mediaUrl"
              :alt="item.text || 'Novinka'"
            />
            <div>
              <h2>{{ item.text }}</h2>
              <p class="admin-list-id">/novinky/{{ item.id }}</p>
              <p>
                <span
                  v-if="item.active"
                  class="status-badge status-badge--published"
                ><Megaphone :size="12" aria-hidden="true" /> Zverejnená</span>
                <span
                  v-else
                  class="status-badge status-badge--draft"
                ><EyeOff :size="12" aria-hidden="true" /> Skrytá</span>
                <span
                  v-if="item.inTicker"
                  class="status-badge status-badge--published"
                >🐜 V pásiku</span>
                <span v-if="item.linkUrl" class="announcement-link-note">→ {{ item.linkUrl }}</span>
              </p>
            </div>
            <div class="admin-item-actions">
              <button
                class="admin-inline-button"
                type="button"
                :disabled="busyId === item.id || index === 0"
                title="Posunúť vyššie"
                @click="move(index, -1)"
              >↑</button>
              <button
                class="admin-inline-button"
                type="button"
                :disabled="busyId === item.id || index === announcements.length - 1"
                title="Posunúť nižšie"
                @click="move(index, 1)"
              >↓</button>
              <button
                class="admin-inline-button"
                type="button"
                :disabled="busyId === item.id"
                @click="startEdit(item)"
              >
                Upraviť
              </button>
              <button
                class="admin-inline-button"
                type="button"
                :disabled="busyId === item.id"
                @click="toggleField(item, 'active')"
              >
                {{ item.active ? 'Skryť' : 'Zverejniť' }}
              </button>
              <button
                class="admin-inline-button"
                type="button"
                :disabled="busyId === item.id"
                :title="item.inTicker ? 'Stiahnuť z pásika mravcov' : 'Pridať do pásika mravcov'"
                @click="toggleField(item, 'inTicker')"
              >
                {{ item.inTicker ? '🐜 Odobrať' : '🐜 Pridať' }}
              </button>
              <button
                class="admin-inline-button danger"
                type="button"
                :disabled="busyId === item.id"
                @click="remove(item)"
              >
                {{ busyId === item.id ? 'Pracujem...' : 'Odstrániť' }}
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
import { EyeOff, Image as ImageIcon, Megaphone, Type } from 'lucide-vue-next'
import { api } from '../lib/api'
import { compressImageToWebp } from '../utils/imageCompressor'

// Must match the reserved folder in api/_lib/announcements.php.
const STORAGE_ID = 'announcements'

const emptyForm = () => ({
  kind: 'text',
  text: '',
  body: '',
  linkUrl: '',
  inTicker: true
})

export default {
  name: 'AdminAnnouncements',
  components: { EyeOff, ImageIcon, Megaphone, Type },
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      announcements: [],
      form: emptyForm(),
      editingId: 0,
      editingTitle: '',
      file: null,
      filePreview: '',
      fileError: '',
      saving: false,
      busyId: 0,
      message: '',
      error: ''
    }
  },
  async mounted() {
    if (this.isAdmin) {
      await this.load()
    }
  },
  watch: {
    // isAdmin arrives async (session bootstrap); load once it does.
    async isAdmin(value) {
      if (value && !this.announcements.length) {
        await this.load()
      }
    }
  },
  methods: {
    async load() {
      try {
        this.announcements = (await api.get('/api/announcements?all=1')) || []
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa načítať novinky.'
      }
    },
    setKind(kind) {
      this.form.kind = kind
      this.fileError = ''
    },
    startEdit(item) {
      this.editingId = item.id
      this.editingTitle = item.text
      this.form = {
        kind: item.kind,
        text: item.text,
        body: item.body || '',
        linkUrl: item.linkUrl || '',
        inTicker: Boolean(item.inTicker)
      }
      this.file = null
      this.filePreview = ''
      this.fileError = ''
      this.message = ''
      this.error = ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    cancelEdit() {
      this.editingId = 0
      this.editingTitle = ''
      this.form = emptyForm()
    },
    onFileChange(event) {
      this.fileError = ''
      this.file = null
      this.filePreview = ''

      const file = event.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        this.fileError = 'Vyber obrázok (JPG, PNG, WebP alebo GIF).'
        return
      }
      if (file.size > 25 * 1024 * 1024) {
        this.fileError = 'Obrázok presahuje limit 25 MB.'
        return
      }

      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        if (img.height < 60) {
          this.fileError = `Obrázok je príliš nízky (${img.height} px). Minimálna výška je 120 px, inak bude v pásiku rozmazaný.`
        } else if (ratio > 6) {
          this.fileError = `Obrázok je príliš široký (pomer ${ratio.toFixed(1)}:1). Maximálny pomer strán je 5:1 — širší by sa v pásiku orezal.`
        } else if (ratio < 0.5) {
          this.fileError = `Obrázok je príliš vysoký (pomer 1:${(1 / ratio).toFixed(1)}). Na výšku môže byť najviac 1:2.`
        } else {
          this.file = file
          this.filePreview = url
          return
        }
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        this.fileError = 'Obrázok sa nepodarilo prečítať.'
      }
      img.src = url
    },
    async uploadMedia() {
      // GIFs keep their animation only if they skip the canvas re-encode.
      let blob = this.file
      if (this.file.type !== 'image/gif') {
        blob = await compressImageToWebp(this.file, 0.85, 2000)
      }
      const extension = (blob.type && blob.type.split('/')[1]) || 'webp'
      const path = `news-${Date.now()}.${extension}`

      const formData = new FormData()
      formData.append('file', blob, path)
      formData.append('path', path)
      formData.append('trailId', STORAGE_ID)
      formData.append('contentType', blob.type || 'image/webp')

      const { url } = await api.upload('/api/upload', formData)
      return url
    },
    async submit() {
      this.message = ''
      this.error = ''

      if (!this.editingId && this.form.kind === 'image' && !this.file) {
        this.fileError = this.fileError || 'Vyber obrázok novinky.'
        return
      }

      this.saving = true
      try {
        if (this.editingId) {
          await api.put(`/api/announcements/${this.editingId}`, {
            text: this.form.text.trim(),
            body: this.form.body,
            linkUrl: this.form.linkUrl,
            inTicker: this.form.inTicker
          })
          this.message = 'Novinka bola upravená.'
        } else {
          let mediaUrl = ''
          if (this.form.kind === 'image') {
            mediaUrl = await this.uploadMedia()
          }
          await api.post('/api/announcements', {
            kind: this.form.kind,
            text: this.form.text.trim(),
            body: this.form.body,
            mediaUrl,
            linkUrl: this.form.linkUrl,
            active: true,
            inTicker: this.form.inTicker
          })
          this.message = 'Novinka bola pridaná.'
        }
        this.cancelEdit()
        this.file = null
        this.filePreview = ''
        if (this.$refs.fileInput) this.$refs.fileInput.value = ''
        await this.load()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa uložiť novinku.'
      } finally {
        this.saving = false
      }
    },
    async toggleField(item, field) {
      this.message = ''
      this.error = ''
      this.busyId = item.id
      try {
        await api.put(`/api/announcements/${item.id}`, { [field]: !item[field] })
        await this.load()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa upraviť novinku.'
      } finally {
        this.busyId = 0
      }
    },
    async move(index, delta) {
      const a = this.announcements[index]
      const b = this.announcements[index + delta]
      if (!a || !b) return

      this.message = ''
      this.error = ''
      this.busyId = a.id
      try {
        // Swap sort orders. Equal values would make the swap a no-op (ties
        // fall back to id order), so nudge apart via the list index instead.
        const orderA = a.sortOrder !== b.sortOrder ? b.sortOrder : index + delta + 1
        const orderB = a.sortOrder !== b.sortOrder ? a.sortOrder : index + 1
        await api.put(`/api/announcements/${a.id}`, { sortOrder: orderA })
        await api.put(`/api/announcements/${b.id}`, { sortOrder: orderB })
        await this.load()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa zmeniť poradie.'
      } finally {
        this.busyId = 0
      }
    },
    async remove(item) {
      this.message = ''
      this.error = ''

      if (!window.confirm(`Naozaj chceš odstrániť novinku „${item.text}“?`)) {
        return
      }

      this.busyId = item.id
      try {
        await api.delete(`/api/announcements/${item.id}`)
        this.message = 'Novinka bola odstránená.'
        if (this.editingId === item.id) this.cancelEdit()
        await this.load()
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa odstrániť novinku.'
      } finally {
        this.busyId = 0
      }
    }
  }
}
</script>
