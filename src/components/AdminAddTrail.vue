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

            <label class="form-field">
              <span>Typ cyklotrasy</span>
              <select v-model="form.bikeType">
                <option value="mtb">MTB trasa</option>
                <option value="cross-country">Cross-country / XC</option>
                <option value="enduro">Enduro</option>
                <option value="downhill">Zjazd</option>
                <option value="gravel">Gravel</option>
                <option value="road">Cestná cyklistika</option>
                <option value="trekking">Trek / turistická</option>
                <option value="e-bike">E-bike</option>
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

            <div class="form-field form-field-wide">
              <span>Fotka trasy</span>
              <label class="photo-dropzone">
                <input :required="!photoPreview" accept="image/*" type="file" @change="handlePhotoSelected" />
                <span>{{ photoFile ? photoFile.name : 'Vybrať fotku z počítača' }}</span>
              </label>
              <img v-if="photoPreview" :src="photoPreview" alt="Vybraná fotka trasy" class="photo-preview" />
            </div>

            <label class="form-field">
              <span>Štítky</span>
              <input v-model.trim="tagText" type="text" placeholder="cyklistika, narocne, trail" />
            </label>
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
            <button class="action-button primary" type="submit" :disabled="saving">
              {{ saving ? 'Ukladám...' : (isEditing ? 'Uložiť trasu' : 'Pridať trasu') }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script>
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getAllTracks } from '../data/tracks'
import { getAdminTrailById, saveAdminTrail, saveLocalAdminTrail } from '../data/customTrails'

const emptyForm = () => ({
  id: '',
  name: '',
  description: '',
  sport: 'cycling',
  bikeType: 'mtb',
  distanceKm: '',
  difficulty: 'moderate',
  location: 'Trenciansky kraj, Slovensko',
  locationRegion: 'slovakia',
  durationHours: '',
  durationMinutes: '',
  elevationUp: '',
  elevationDown: '',
  mapUrl: '',
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
      photoPreview: '',
      saving: false,
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
    }
  },
  methods: {
    goHome() {
      this.$router.push('/')
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
    readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
    },
    async uploadPhoto() {
      if (!this.photoFile && this.form.previewImage) {
        return this.form.previewImage
      }

      if (!this.photoFile) {
        throw new Error('Najprv vyber fotku trasy.')
      }

      if (!isSupabaseConfigured || !supabase) {
        return this.photoPreview || await this.readFileAsDataUrl(this.photoFile)
      }

      const extension = this.photoFile.name.split('.').pop() || 'jpg'
      const filePath = `${this.form.id || Date.now()}/preview-${Date.now()}.${extension}`
      const { error } = await this.withTimeout(
        supabase.storage
          .from('trail-photos')
          .upload(filePath, this.photoFile, {
            cacheControl: '3600',
            upsert: true
          }),
        12000,
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
    withTimeout(promise, timeoutMs, message) {
      let timeoutId
      const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
      })

      return Promise.race([promise, timeout]).finally(() => {
        window.clearTimeout(timeoutId)
      })
    },
    buildTrail(photoUrl) {
      const tags = this.tagText
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)

      return {
        ...this.form,
        previewImage: photoUrl,
        galleryImages: photoUrl ? [photoUrl] : [],
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
    saveLocalDraft(trail) {
      saveLocalAdminTrail(trail)
    },
    async submitTrail() {
      this.error = ''
      this.message = ''

      if (!this.canAddTrails) {
        this.error = 'Vyžaduje sa prístup editora trás.'
        return
      }

      this.saving = true
      let trail = null

      try {
        const photoUrl = await this.uploadPhoto()
        trail = this.buildTrail(photoUrl)

        if (isSupabaseConfigured && supabase) {
          await this.withTimeout(
            saveAdminTrail(trail),
            12000,
            'Ukladanie trasy trvá príliš dlho.'
          )
          this.message = 'Trasa bola odoslaná do Supabase.'
        } else {
          this.message = 'Trasa bola uložená ako lokálny rozpracovaný návrh. Supabase nie je nastavený.'
        }

        this.saveLocalDraft(trail)
        this.form = emptyForm()
        this.tagText = ''
        this.photoFile = null
        this.photoPreview = ''
      } catch (error) {
        const fallbackPhoto = this.photoPreview || ''
        trail = trail || this.buildTrail(fallbackPhoto)
        this.saveLocalDraft(trail)
        this.error = `${error.message || 'Nepodarilo sa uložiť do Supabase.'} Uložené ako lokálny rozpracovaný návrh.`
      } finally {
        this.saving = false
      }
    },
    async loadTrailForEdit() {
      if (!this.id) {
        return
      }

      const staticTrail = getAllTracks().find(track => track.id === this.id)
      const trail = await getAdminTrailById(this.id) || staticTrail

      if (!trail) {
        this.error = 'Trasa sa nenašla.'
        return
      }

      const distanceValue = trail.distanceValue ?? String(trail.distance || '').replace(/[^\d.]/g, '')
      const durationMatch = String(trail.duration || '').match(/(\d+)\s*h\s*(\d+)?/)
      const elevationMatch = String(trail.elevation || '').match(/(\d[\d,.]*)\s*m.*?(\d[\d,.]*)\s*m/)

      this.form = {
        ...emptyForm(),
        ...trail,
        distanceKm: String(distanceValue || ''),
        durationHours: durationMatch?.[1] || '',
        durationMinutes: durationMatch?.[2] || '',
        elevationUp: elevationMatch?.[1]?.replace(/,/g, '') || '',
        elevationDown: elevationMatch?.[2]?.replace(/,/g, '') || ''
      }
      this.tagText = (trail.tags || []).join(', ')
      this.photoPreview = trail.previewImage || ''
    }
  },
  mounted() {
    this.loadTrailForEdit()
  }
}
</script>
