import { createRouter, createWebHistory } from 'vue-router'
// import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/tab1'
  },
  {
    path: '/tab1',
    name: 'Tab1Page',
    component: () => import('@/views/Tab1Page.vue')
  },
  // {
  //   path: '/auth/login',
  //   name: 'Login',
  //   component: () => import('@/views/LoginPage.vue')
  // },
  // {
  //   path: '/map',
  //   name: 'Map',
  //   component: () => import('@/views/MapPage.vue'),
  //   // meta: { requiresAuth: false }
  // },
  // {
  //   path: '/profile',
  //   name: 'Profile',
  //   component: () => import('@/views/ProfilePage.vue'),
  //   // meta: { requiresAuth: false }
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// // Navigation guard for authentication
// router.beforeEach((to, from, next) => {
//   console.log({to})
//   const authStore = useAuthStore()
//   console.log("authStore.isAuthenticated", authStore.isAuthenticated)
//   console.log("to.meta.requiresAuth", to.meta.requiresAuth)

//   if (to.meta.requiresAuth && !authStore.isAuthenticated) {
//     next('/auth/login')
//   } else if (to.name === 'Login' && authStore.isAuthenticated) {
//     next('/map')
//   } else {
//     next()
//   }
// })

export default router