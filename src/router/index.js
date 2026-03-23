import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页', icon: '📊' }
  },
  {
    path: '/patients',
    name: 'Patients',
    component: () => import('../views/Patients.vue'),
    meta: { title: '患者' }
  },
  {
    path: '/herbs',
    name: 'Herbs',
    component: () => import('../views/Herbs.vue'),
    meta: { title: '药材' }
  },
  {
    path: '/prescription',
    name: 'Prescription',
    component: () => import('../views/Prescription.vue'),
    meta: { title: '开处方' }
  },
  {
    path: '/prescription/new',
    name: 'NewPrescription',
    component: () => import('../views/NewPrescription.vue'),
    meta: { title: '新建处方', hideTabBar: true }
  },
  {
    path: '/prescription/templates',
    name: 'Templates',
    component: () => import('../views/Templates.vue'),
    meta: { title: '处方模板', hideTabBar: true }
  },
  {
    path: '/prescription/ocr',
    name: 'OCR',
    component: () => import('../views/OCR.vue'),
    meta: { title: '图片识别', hideTabBar: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: { title: '历史', icon: '📋' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('../views/Statistics.vue'),
    meta: { title: '统计', icon: '📈' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '设置', icon: '⚙️' }
  },
  {
    path: '/print/:id',
    name: 'Print',
    component: () => import('../views/Print.vue'),
    meta: { title: '打印处方', hideTabBar: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router