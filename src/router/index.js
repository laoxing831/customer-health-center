import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('../views/Welcome.vue')
  },
  {
    path: '/customer',
    name: 'CustomerHealth',
    component: () => import('../views/CustomerHealth.vue')
  },
  {
    path: '/customer/:id',
    name: 'CustomerDetail',
    component: () => import('../views/CustomerDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router