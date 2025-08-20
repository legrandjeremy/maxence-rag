import { type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
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
      }
    ],
  },
  {
    path: '/luna-streaming',
    component: () => import('layouts/LunaStreamingLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LunaStreamingPage.vue') }
    ]
  },
  {
    path: '/luna-offre',
    component: () => import('pages/LunaBDCPage.vue'),
    meta: { 
      title: 'Luna - Révélations Mystiques Illimitées',
      description: 'Découvrez les secrets de votre destinée avec Luna, votre guide mystique personnel.'
    }
  },
  {
    path: '/callback',
    component: () => import('pages/CallbackPage.vue'),
  },
  // Iframe chat route - no layout, no auth required for embedding
  {
    path: '/chat-iframe',
    component: () => import('pages/ChatIframePage.vue'),
    meta: { 
      iframe: true,
      requiresAuth: true // Still require auth for security
    }
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes; 