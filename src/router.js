import { createRouter, createWebHistory } from 'vue-router'
import { api } from './api'
import { useAuth } from './store'

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('./layout/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('./views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'devices', name: 'devices', component: () => import('./views/Devices.vue'), meta: { title: '设备管理' } },
      { path: 'rallies', name: 'rallies', component: () => import('./views/Rallies.vue'), meta: { title: '集会管理' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({ history: createWebHistory('/admin/'), routes })

router.beforeEach(async (to) => {
  const auth = useAuth()
  if (to.meta.public) return true
  if (!auth.checked) {
    try {
      await api.overview()
      auth.setLoggedIn(true)
    } catch (e) {
      auth.setLoggedIn(false)
    }
  }
  if (!auth.loggedIn) return { name: 'login' }
  return true
})

export default router