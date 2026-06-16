import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomePage from './components/HomePage.vue'
import TrackDetail from './components/TrackDetail.vue'
import AdminAddTrail from './components/AdminAddTrail.vue'
import AdminManageTrails from './components/AdminManageTrails.vue'
import AdminRoles from './components/AdminRoles.vue'
import Terms from './components/Terms.vue'
import Privacy from './components/Privacy.vue'
import './style.css'

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/track/:id', name: 'TrackDetail', component: TrackDetail, props: true },
  { path: '/admin/trails/new', name: 'AdminAddTrail', component: AdminAddTrail },
  { path: '/admin/trails/:id/edit', name: 'AdminEditTrail', component: AdminAddTrail, props: true },
  { path: '/admin/manage-trails', name: 'AdminManageTrails', component: AdminManageTrails },
  { path: '/admin/roles', name: 'AdminRoles', component: AdminRoles },
  { path: '/terms', name: 'Terms', component: Terms },
  { path: '/privacy', name: 'Privacy', component: Privacy }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

const app = createApp(App).use(router)

// Handle initial track ID from static generation
router.beforeEach((to, from, next) => {
  // If we have an initial track ID from static generation, navigate to it
  if (window.__INITIAL_TRACK_ID__ && to.path === '/' && !from.name) {
    const trackId = window.__INITIAL_TRACK_ID__
    delete window.__INITIAL_TRACK_ID__ // Clean up
    next({ name: 'TrackDetail', params: { id: trackId } })
  } else {
    next()
  }
})

app.mount('#app')
