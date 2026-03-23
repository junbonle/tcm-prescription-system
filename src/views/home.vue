<template>
  <div class="home">
    <div class="header">
      <h1>中医开方系统</h1>
      <p class="date">{{ today }}</p>
    </div>
    
    <div class="quick-actions">
      <router-link to="/prescription/new" class="action-btn primary">
        <span class="icon">📝</span>
        <span>开处方</span>
      </router-link>
      <router-link to="/patients" class="action-btn">
        <span class="icon">👤</span>
        <span>患者</span>
      </router-link>
      <router-link to="/herbs" class="action-btn">
        <span class="icon">🌿</span>
        <span>药材</span>
      </router-link>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">¥{{ todayRevenue.toFixed(2) }}</div>
        <div class="stat-label">今日营收</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ todayCount }}</div>
        <div class="stat-label">今日处方</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ patientCount }}</div>
        <div class="stat-label">患者总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ herbCount }}</div>
        <div class="stat-label">药材种类</div>
      </div>
    </div>
    
    <div class="section">
      <h3>今日处方</h3>
      <div v-if="todayPrescriptions.length === 0" class="empty">
        今日暂无处方
      </div>
      <div v-else class="prescription-list">
        <div 
          v-for="p in todayPrescriptions.slice(0, 5)" 
          :key="p.id"
          class="prescription-item"
          @click="viewDetail(p.id)"
        >
          <div class="info">
            <div class="name">{{ p.patientName || '未知患者' }}</div>
            <div class="time">{{ formatTime(p.createdAt) }}</div>
          </div>
          <div class="amount">¥{{ ((p.finalTotal || 0) * (p.dosage || 1)).toFixed(2) }}</div>
        </div>
      </div>
      <router-link v-if="todayPrescriptions.length > 5" to="/history" class="more">
        查看更多 →
      </router-link>
    </div>
    
    <div v-if="lowStockHerbs.length > 0" class="section warning">
      <h3>⚠️ 库存预警</h3>
      <div class="herb-list">
        <div v-for="herb in lowStockHerbs.slice(0, 3)" :key="herb.id" class="herb-item">
          <span>{{ herb.name }}</span>
          <span class="stock">库存: {{ herb.stock.toFixed(2) }}公斤</span>
        </div>
      </div>
      <router-link to="/herbs" class="more">管理库存 →</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrescriptionStore } from '../stores/prescriptions'
import { usePatientStore } from '../stores/patients'
import { useHerbStore } from '../stores/herbs'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

const router = useRouter()
const prescriptionStore = usePrescriptionStore()
const patientStore = usePatientStore()
const herbStore = useHerbStore()
dayjs.locale('zh-cn')
const today = dayjs().format('YYYY年MM月DD日 dddd')

const todayRevenue = computed(() => prescriptionStore.todayRevenue)
const todayCount = computed(() => prescriptionStore.todayPrescriptions.length)
const todayPrescriptions = computed(() => prescriptionStore.todayPrescriptions)
const patientCount = computed(() => patientStore.patients.length)
const herbCount = computed(() => herbStore.herbs.length)
const lowStockHerbs = computed(() => herbStore.lowStockHerbs)

const formatTime = (iso) => dayjs(iso).format('HH:mm')

const viewDetail = (id) => {
  router.push(`/history?id=${id}`)
}

onMounted(() => {
  prescriptionStore.loadPrescriptions()
  patientStore.loadPatients()
  herbStore.loadHerbs()
})
</script>

<style scoped>
.home {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  color: var(--text);
}

.date {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.quick-actions {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  background: white;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.action-btn.primary {
  background: var(--primary);
  color: white;
}

.action-btn .icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.action-btn span:last-child {
  font-size: 14px;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section.warning {
  border-left: 4px solid var(--warning);
}

.section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text);
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 24px;
}

.prescription-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prescription-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
  cursor: pointer;
}

.prescription-item .name {
  font-weight: 500;
}

.prescription-item .time {
  font-size: 12px;
  color: var(--text-secondary);
}

.prescription-item .amount {
  font-weight: 600;
  color: var(--primary);
}

.herb-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.herb-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 6px;
}

.herb-item .stock {
  color: var(--danger);
  font-size: 14px;
}

.more {
  display: block;
  text-align: center;
  color: var(--primary);
  text-decoration: none;
  margin-top: 12px;
  font-size: 14px;
}
</style>