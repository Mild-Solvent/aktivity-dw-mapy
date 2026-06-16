<template>
  <div class="admin-page">
    <div class="container">
      <section v-if="!canAddTrails" class="admin-access-panel">
        <h1>Iba pre editorov trás</h1>
        <p>Prihlás sa ako admin alebo pridávateľ trás.</p>
        <button class="action-button secondary" type="button" @click="goHome">
          Späť na trasy
        </button>
      </section>

      <section v-else class="admin-form-shell">
        <div class="admin-form-header">
          <button class="back-button admin-back-button" type="button" @click="goHome">
            Späť na trasy
          </button>
          <div>
            <h1>{{ isEditing ? 'Upraviť trasu' : 'Pridať trasu' }}</h1>
            <p>{{ authUser.email }}</p>
          </div>
        </div>

        <form class="trail-form" @submit.prevent="submitTrail">
          <div class="form-grid">
            <label class="form-field">
              <span>Názov</span>
              <input v-model.trim="form.name" required type="text" placeholder="KOLACIN TRAIL" />
            </label>

            <label class="form-field">
              <span>ID / názov priečinka</span>
              <input v-model.trim="form.id" required type="text" placeholder="kolacin-trail" />
            </label>

            <label class="form-field form-field-wide">
              <span>Popis</span>
              <textarea v-model.trim="form.description" required rows="4" placeholder="Krátky popis trasy"></textarea>
            </label>

            <div class="form-field form-field-wide">
              <span>Šport</span>
              <div class="sport-picker">
                <button
                  type="button"
                  class="sport-picker-btn"
                  :class="{ active: form.sport === 'cycling' }"
                  @click="setSport('cycling')"
                >
                  🚵 Cyklistika
                </button>
                <button
                  type="button"
                  class="sport-picker-btn"
                  :class="{ active: form.sport === 'hiking' }"
                  @click="setSport('hiking')"
                >
                  🥾 Turistika
                </button>
                <button
                  type="button"
                  class="sport-picker-btn"
                  :class="{ active: form.sport === 'running' }"
                  @click="setSport('running')"
                >
                  🏃 Beh
                </button>
              </div>
            </div>

            <label class="form-field">
              <span>{{ activityTypeLabel }}</span>
              <select v-model="form.activityType">
                <template v-if="form.sport === 'cycling'">
                  <option value="mtb">MTB trasa</option>
                  <option value="cross-country">Cross-country / XC</option>
                  <option value="enduro">Enduro</option>
                  <option value="downhill">Zjazd</option>
                  <option value="gravel">Gravel</option>
                  <option value="road">Cestná cyklistika</option>
                  <option value="trekking">Trek / turistická</option>
                  <option value="e-bike">E-bike</option>
                </template>
                <template v-if="form.sport === 'hiking'">
                  <option value="hiking">Pešia turistika</option>
                  <option value="mountain-hiking">Horská turistika</option>
                  <option value="via-ferrata">Via ferrata</option>
                  <option value="snowshoeing">Snehová chôdza</option>
                </template>
                <template v-if="form.sport === 'running'">
                  <option value="road-running">Cestný beh</option>
                  <option value="trail-running">Trail beh</option>
                  <option value="ultramarathon">Ultramaratón</option>
                  <option value="track">Beh na dráhe</option>
                </template>
              </select>
            </label>

            <label class="form-field">
              <span>Náročnosť</span>
              <select v-model="form.difficulty">
                <option value="beginner">Začiatočník</option>
                <option value="easy">Ľahká</option>
                <option value="moderate">Stredná</option>
                <option value="hard">Ťažká</option>
                <option value="expert">Expertná</option>
              </select>
            </label>

            <label class="form-field">
              <span>Lokalita</span>
              <input v-model.trim="form.location" required type="text" />
            </label>

            <label class="form-field">
              <span>Región</span>
              <select v-model="form.locationRegion">
                <option value="slovakia">Slovensko</option>
              </select>
            </label>

            <label class="form-field">
              <span>Vzdialenosť</span>
              <div class="unit-input">
                <input
                  v-model="form.distanceKm"
                  required
                  inputmode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  type="text"
                  placeholder="29.3"
                  @input="sanitizeDecimal('distanceKm')"
                />
                <span>km</span>
              </div>
            </label>

            <fieldset class="form-field grouped-field">
              <legend>Trvanie</legend>
              <div class="split-inputs">
                <label>
                  <span>Hodiny</span>
                  <input v-model="form.durationHours" required min="0" step="1" type="number" @input="sanitizeInteger('durationHours')" />
                </label>
                <label>
                  <span>Minúty</span>
                  <input v-model="form.durationMinutes" required max="59" min="0" step="1" type="number" @input="sanitizeInteger('durationMinutes', 59)" />
                </label>
              </div>
            </fieldset>

            <fieldset class="form-field grouped-field">
              <legend>Prevýšenie</legend>
              <div class="split-inputs">
                <label>
                  <span>Stúpanie</span>
                  <div class="unit-input">
                    <input v-model="form.elevationUp" required min="0" step="1" type="number" @input="sanitizeInteger('elevationUp')" />
                    <span>m</span>
                  </div>
                </label>
                <label>
                  <span>Klesanie</span>
                  <div class="unit-input">
                    <input v-model="form.elevationDown" required min="0" step="1" type="number" @input="sanitizeInteger('elevationDown')" />
                    <span>m</span>
                  </div>
                </label>
              </div>
            </fieldset>

            <label class="form-field form-field-wide">
              <span>Odkaz na Mapy</span>
              <input v-model.trim="form.mapUrl" type="url" placeholder="https://mapy.com/s/..." />
            </label>

            <!-- GPX Upload — three-state banner -->
            <div class="form-field form-field-wide gpx-section">
              <span>GPX súbor trasy</span>

              <!-- State 1: no GPX yet -->
              <div v-if="!gpxFile && !gpxSkipped" class="gpx-banner gpx-banner--warn">
                <span class="gpx-banner-text">🗺 GPX súbor je potrebný na automatické generovanie náhľadu mapy trasy.</span>
                <div class="gpx-banner-actions">
                  <label class="gpx-action-btn gpx-action-btn--primary">
                    Nahrať GPX
                    <input type="file" accept=".gpx" @change="handleGpxSelected" hidden />
                  </label>
                  <button type="button" class="gpx-action-btn gpx-action-btn--skip" @click="skipGpx">
                    Nevadí mi to
                  </button>
                </div>
              </div>

              <!-- State 2: GPX loaded -->
              <div v-if="gpxFile" class="gpx-banner gpx-banner--loaded">
                <span class="gpx-banner-text">✅ {{ gpxFile.name }}</span>
                <div class="gpx-banner-actions">
                  <label class="gpx-action-btn gpx-action-btn--secondary">
                    Zmeniť GPX
                    <input type="file" accept=".gpx" @change="handleGpxSelected" hidden />
                  </label>
                  <button
                    v-if="gpxPreview && !gpxGenerating"
                    type="button"
                    class="gpx-action-btn gpx-action-btn--secondary"
                    @click="regenerateGpxPreview"
                  >
                    🔄 Regenerovať
                  </button>
                </div>
                <p v-if="gpxGenerating" class="gpx-status">⏳ Generujem náhľad mapy...</p>
                <p v-if="gpxError" class="gpx-status gpx-status--error">⚠ {{ gpxError }}</p>
              </div>

              <!-- State 3: skipped -->
              <div v-if="gpxSkipped && !gpxFile" class="gpx-banner gpx-banner--skipped">
                <span class="gpx-banner-text">⚠ Bez GPX — trasa bude bez náhľadu mapy.</span>
                <label class="gpx-action-btn gpx-action-btn--secondary">
                  Pridať GPX
                  <input type="file" accept=".gpx" @change="handleGpxSelected" hidden />
                </label>
              </div>
            </div>

            <!-- Manual photo upload (optional override) -->
            <div class="form-field form-field-wide">
              <span>Fotka trasy <em class="field-hint">(nepovinné — prepíše GPX náhľad)</em></span>
              <label class="photo-dropzone">
                <input accept="image/*" type="file" @change="handlePhotoSelected" />
                <span>{{ photoFile ? photoFile.name : 'Vybrať fotku z počítača' }}</span>
              </label>
              <p class="file-status">Náhľad sa vytvorí z GPX súboru. Vybraná fotka prepíše GPX náhľad.</p>
              <img v-if="photoPreview" :src="photoPreview" alt="Vybraná fotka trasy" class="photo-preview" />
            </div>

            <label class="form-field">
              <span>Štítky</span>
              <input v-model.trim="tagText" type="text" placeholder="cyklistika, narocne, trail" />
            </label>

            <div class="form-field form-field-wide">
              <span>Stav trasy</span>
              <div class="sport-picker">
                <button
                  type="button"
                  class="sport-picker-btn"
                  :class="{ active: form.status === 'published' }"
                  @click="form.status = 'published'"
                >
                  📢 Zverejnená
                </button>
                <button
                  type="button"
                  class="sport-picker-btn"
                  :class="{ active: form.status === 'draft' }"
                  @click="form.status = 'draft'"
                >
                  📝 Koncept (draft)
                </button>
              </div>
              <p class="file-status" v-if="form.status === 'draft'">⚠ Trasa nebude verejne viditeľná, kým ju nezverejníš.</p>
            </div>
          </div>

          <div class="trail-preview-card">
            <div>
              <span class="preview-label">Náhľad</span>
              <h2>{{ form.name || 'Nová trasa' }}</h2>
              <p>{{ form.description || 'Tu sa zobrazí popis trasy.' }}</p>
            </div>
            <img v-if="photoPreview" :src="photoPreview" alt="Vybraná fotka trasy" class="trail-preview-image" />
            <div class="track-stats">
              <div class="stat">
                <img class="stat-icon" src="/assets/icons/lenght-of-track.jpg" alt="Dĺžka" />
                <span class="stat-value">{{ formattedDistance }}</span>
              </div>
              <div class="stat">
                <img class="stat-icon" src="/assets/icons/duration.jpg" alt="Trvanie" />
                <span class="stat-value">{{ formattedDuration }}</span>
              </div>
              <div class="stat">
                <img class="stat-icon" src="/assets/icons/profil-elevation.jpg" alt="Prevýšenie" />
                <span class="stat-value">{{ formattedElevation }}</span>
              </div>
            </div>
          </div>

          <p v-if="message" class="auth-message auth-message-success">{{ message }}</p>
          <p v-if="error" class="auth-message auth-message-error">{{ error }}</p>

          <div class="form-actions">
            <button
              v-if="isEditing"
              class="action-button danger"
              type="button"
              :disabled="saving"
              @click="removeTrail"
            >
              Remove
            </button>
            <button class="action-button primary" type="submit" :disabled="saving">
              {{ submitButtonLabel }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script>
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getAdminTrailById, removeAdminTrail, saveAdminTrail } from '../data/customTrails'
import { gpxFileToPreviewPng, dataUrlToBlob } from '../utils/gpxMapCapture'

const defaultActivityType = (sport) => {
  if (sport === 'hiking') return 'hiking'
  if (sport === 'running') return 'road-running'
  return 'mtb'
}

const emptyForm = () => ({
  id: '',
  name: '',
  description: '',
  sport: 'cycling',
  bikeType: 'mtb',
  activityType: 'mtb',
  distanceKm: '',
  difficulty: 'moderate',
  location: 'Trenciansky kraj, Slovensko',
  locationRegion: 'slovakia',
  durationHours: '',
  durationMinutes: '',
  elevationUp: '',
  elevationDown: '',
  mapUrl: '',
  gpxFile: '',
  gpxFileName: '',
  status: 'published',
  createdAt: new Date().toISOString().slice(0, 10)
})

export default {
  name: 'AdminAddTrail',
  props: {
    authUser: {
      type: Object,
      default: null
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    canAddTrails: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      form: emptyForm(),
      tagText: '',
      photoFile: null,
      gpxFile: null,
      photoPreview: '',
      gpxPreview: '',
      gpxGenerating: false,
      gpxError: '',
      gpxSkipped: false,
      saving: false,
      savingStep: '',
      message: '',
      error: ''
    }
  },
  computed: {
    isEditing() {
      return Boolean(this.id)
    },
    formattedDistance() {
      return this.form.distanceKm ? `${this.form.distanceKm} km` : '0 km'
    },
    formattedDuration() {
      const hours = Number(this.form.durationHours) || 0
      const minutes = Number(this.form.durationMinutes) || 0
      return `${hours}h ${String(minutes).padStart(2, '0')}m`
    },
    formattedElevation() {
      const up = Number(this.form.elevationUp) || 0
      const down = Number(this.form.elevationDown) || 0
      return `up ${up} m / down ${down} m`
    },
    submitButtonLabel() {
      if (this.savingStep) {
        return this.savingStep
      }

      return this.isEditing ? 'Uložiť trasu' : 'Pridať trasu'
    },
    activityTypeLabel() {
      if (this.form.sport === 'hiking') return 'Typ turistiky'
      if (this.form.sport === 'running') return 'Typ behu'
      return 'Typ cyklotrasy'
    }
  },
  methods: {
    goHome() {
      this.$router.push('/')
    },
    setSport(sport) {
      this.form.sport = sport
      this.form.activityType = defaultActivityType(sport)
    },
    sanitizeDecimal(field) {
      const value = String(this.form[field] || '')
        .replace(/,/g, '.')
        .replace(/[^0-9.]/g, '')
      const parts = value.split('.')
      this.form[field] = parts.length > 1
        ? `${parts.shift()}.${parts.join('')}`
        : value
    },
    sanitizeInteger(field, max = null) {
      const value = String(this.form[field] || '').replace(/\D/g, '')
      const numberValue = value === '' ? '' : Number(value)
      this.form[field] = max !== null && numberValue > max ? String(max) : String(numberValue)
    },
    handlePhotoSelected(event) {
      const [file] = event.target.files || []
      this.photoFile = file || null
      this.photoPreview = ''

      if (!file) {
        return
      }

      this.readFileAsDataUrl(file).then((dataUrl) => {
        this.photoPreview = dataUrl
      })
    },
    async handleGpxSelected(event) {
      const [file] = event.target.files || []
      this.gpxFile = file || null

      if (!file) {
        this.form.gpxFile = ''
        this.form.gpxFileName = ''
        this.gpxPreview = ''
        return
      }

      if (!file.name.toLowerCase().endsWith('.gpx')) {
        this.error = 'Vyber súbor vo formáte .gpx.'
        this.gpxFile = null
        this.gpxPreview = ''
        event.target.value = ''
        return
      }

      this.error = ''
      this.gpxError = ''
      this.gpxSkipped = false
      this.form.gpxFileName = file.name
      await this.generateGpxPreview()
    },
    readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
    },
    skipGpx() {
      this.gpxSkipped = true
      this.gpxFile = null
      this.gpxPreview = ''
      if (!this.photoFile) {
        this.photoPreview = ''
      }
    },
    async regenerateGpxPreview() {
      if (!this.gpxFile) return
      await this.generateGpxPreview()
    },
    async generateGpxPreview() {
      this.gpxGenerating = true
      this.gpxError = ''
      try {
        const dataUrl = await gpxFileToPreviewPng(this.gpxFile)
        this.gpxPreview = dataUrl
        if (!this.photoFile) {
          this.photoPreview = dataUrl
        }
      } catch (err) {
        this.gpxError = err.message || 'Nepodarilo sa vygenerovať náhľad.'
        this.gpxPreview = ''
      } finally {
        this.gpxGenerating = false
      }
    },
    getTrailStorageId() {
      return String(this.form.id || this.form.name || `trail-${Date.now()}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `trail-${Date.now()}`
    },
    async uploadPhoto() {
      if (!this.photoFile && !this.gpxPreview && this.form.previewImage) {
        return this.form.previewImage
      }

      const hasManualPhoto = Boolean(this.photoFile)
      const hasGpxPreview = Boolean(this.gpxPreview)

      if (!hasManualPhoto && !hasGpxPreview) {
        return ''
      }

      if (!isSupabaseConfigured || !supabase) {
        if (hasManualPhoto) {
          return this.photoPreview || await this.readFileAsDataUrl(this.photoFile)
        }
        return this.gpxPreview
      }

      const fileBlob = hasManualPhoto ? this.photoFile : dataUrlToBlob(this.gpxPreview)
      const extension = hasManualPhoto ? this.photoFile.name.split('.').pop() || 'jpg' : 'png'
      const filePath = `${this.getTrailStorageId()}/preview-${Date.now()}.${extension}`
      const { error } = await this.withTimeout(
        supabase.storage
          .from('trail-photos')
          .upload(filePath, fileBlob, {
            cacheControl: '3600',
            upsert: true
          }),
        120000,
        'Nahrávanie fotky trvá príliš dlho.'
      )

      if (error) {
        throw new Error(error.message === 'Bucket not found'
          ? 'Chýba Supabase Storage bucket "trail-photos".'
          : error.message)
      }

      const { data } = supabase.storage
        .from('trail-photos')
        .getPublicUrl(filePath)

      return data.publicUrl
    },
    async uploadGpx() {
      // User deliberately skipped GPX — return empty gracefully (no throw)
      if (this.gpxSkipped && !this.gpxFile && !this.form.gpxFile) {
        return { url: '', name: '' }
      }

      if (!this.gpxFile && this.form.gpxFile) {
        return {
          url: this.form.gpxFile,
          name: this.form.gpxFileName
        }
      }

      if (!this.gpxFile) {
        throw new Error('Najprv vyber GPX súbor trasy.')
      }

      if (!isSupabaseConfigured || !supabase) {
        return {
          url: await this.readFileAsDataUrl(this.gpxFile),
          name: this.gpxFile.name
        }
      }

      const filePath = `${this.getTrailStorageId()}/track.gpx`
      const { error } = await this.withTimeout(
        supabase.storage
          .from('trail-files')
          .upload(filePath, this.gpxFile, {
            cacheControl: '3600',
            contentType: 'application/gpx+xml',
            upsert: true
          }),
        120000,
        'Nahrávanie GPX súboru trvá príliš dlho.'
      )

      if (error) {
        throw new Error(error.message === 'Bucket not found'
          ? 'Chýba Supabase Storage bucket "trail-files".'
          : error.message)
      }

      const { data } = supabase.storage
        .from('trail-files')
        .getPublicUrl(filePath)

      return {
        url: data.publicUrl,
        name: this.gpxFile.name
      }
    },
    withTimeout(promise, timeoutMs, message) {
      let timeoutId
      const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
      })

      return Promise.race([promise, timeout]).finally(() => {
        window.clearTimeout(timeoutId)
      })
    },
    buildTrail(photoUrl, gpx = {}) {
      const tags = this.tagText
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)

      // When editing, always keep the original id so the upsert targets the
      // same DB row even if the user changed the "ID / slug" field in the form.
      const trailId = this.isEditing ? this.id : this.form.id

      return {
        ...this.form,
        id: trailId,
        activityType: this.form.activityType,
        // Keep bikeType on cycling trails so existing data stays compatible
        bikeType: this.form.sport === 'cycling' ? this.form.activityType : undefined,
        status: this.form.status || 'published',
        previewImage: photoUrl,
        galleryImages: photoUrl ? [photoUrl] : [],
        gpxFile: gpx.url || this.form.gpxFile || '',
        gpxFileName: gpx.name || this.form.gpxFileName || '',
        distance: this.formattedDistance,
        distanceValue: Number(this.form.distanceKm),
        duration: this.formattedDuration,
        elevation: this.formattedElevation,
        tags,
        createdBy: this.authUser?.email || null,
        stats: {
          distance: {
            icon: 'distance',
            label: 'Vzdialenost',
            value: this.formattedDistance
          },
          elevation: {
            icon: 'elevation',
            label: 'Prevysenie',
            value: this.formattedElevation
          },
          startPoint: {
            icon: 'location',
            label: 'START',
            value: this.form.location
          }
        }
      }
    },

    async removeTrail() {
      this.error = ''
      this.message = ''

      if (!this.canAddTrails || !this.id) {
        this.error = 'Vyžaduje sa prístup editora trás.'
        return
      }

      const confirmed = window.confirm(`Remove trail "${this.form.name || this.id}"?`)
      if (!confirmed) {
        return
      }

      this.saving = true
      this.savingStep = 'Odstraňujem trasu...'

      try {
        await this.withTimeout(
          removeAdminTrail({
            trailId: this.id,
            deletedBy: this.authUser?.email || null
          }),
          12000,
          'Odstránenie trasy trvá príliš dlho.'
        )
        this.message = 'Trasa bola odstránená.'
        this.$router.push('/admin/manage-trails')
      } catch (error) {
        this.error = error.message || 'Trasu sa nepodarilo odstrániť.'
      } finally {
        this.saving = false
        this.savingStep = ''
      }
    },
    async submitTrail() {
      this.error = ''
      this.message = ''

      if (!this.canAddTrails) {
        this.error = 'Vyžaduje sa prístup editora trás.'
        return
      }

      this.saving = true
      this.savingStep = 'Nahrávam fotku...'

      try {
        const photoUrl = await this.uploadPhoto()
        this.savingStep = 'Nahrávam GPX...'
        const gpx = await this.uploadGpx()
        this.savingStep = 'Ukladám trasu...'
        const trail = this.buildTrail(photoUrl, gpx)

        await this.withTimeout(
          saveAdminTrail(trail),
          12000,
          'Ukladanie trasy trvá príliš dlho.'
        )

        this.message = 'Trasa bola uložená.'
        this.$router.push('/admin/manage-trails')
      } catch (error) {
        this.error = error.message || 'Nepodarilo sa uložiť trasu.'
      } finally {
        this.saving = false
        this.savingStep = ''
      }
    },
    async loadTrailForEdit() {
      if (!this.id) {
        return
      }

      const trail = await getAdminTrailById(this.id)

      if (!trail) {
        this.error = 'Trasa sa nenašla.'
        return
      }

      const distanceValue = trail.distanceValue ?? String(trail.distance || '').replace(/[^\d.]/g, '')
      const durationMatch = String(trail.duration || '').match(/(\d+)\s*h\s*(\d+)?/)
      const elevationMatch = String(trail.elevation || '').match(/(\d[\d,.]*)\s*m.*?(\d[\d,.]*)\s*m/)

      const trailSport = trail.sport || 'cycling'
      this.form = {
        ...emptyForm(),
        ...trail,
        sport: trailSport,
        activityType: trail.activityType || trail.bikeType || defaultActivityType(trailSport),
        distanceKm: String(distanceValue || ''),
        durationHours: durationMatch?.[1] || '',
        durationMinutes: durationMatch?.[2] || '',
        elevationUp: elevationMatch?.[1]?.replace(/,/g, '') || '',
        elevationDown: elevationMatch?.[2]?.replace(/,/g, '') || ''
      }
      this.tagText = (trail.tags || []).join(', ')
      this.photoPreview = trail.previewImage || ''
      this.gpxFile = null
    }
  },
  mounted() {
    this.loadTrailForEdit()
  }
}
</script>
