import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { Loading } from 'quasar'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: 'profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: { requiresAuth: true }
      },
      // Chat Routes
      {
        path: 'chat',
        component: () => import('pages/ChatPage.vue'),
        meta: { requiresAuth: true }
      },
    ],
  },
  {
    path: '/callback',
    component: () => import('pages/CallbackPage.vue'),
  }
]

export default route(function () {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    if (!authStore.isReady) {
      Loading.show({
        message: 'Authenticating...',
        customClass: 'loader-bg'
      })

      await authStore.waitUntilReady() // Wait for auth store to be initialized

      Loading.hide()
    }

    if (to.meta.requiresAuth && !authStore.isSignedIn) {
      next('/') // Redirect to login if auth is required
    } else if (to.meta.requiresPlayerAdmin && !authStore.hasPlayerManagementAdminAccess) {
      next('/') // Redirect if player admin access is required but not available
    } else if (to.meta.requiresTeamManager && !authStore.hasPlayerManagementTeamManagerAccess) {
      next('/') // Redirect if team manager access is required but not available
    } else {
      next() // Proceed with navigation
    }
  })

  return router
})
