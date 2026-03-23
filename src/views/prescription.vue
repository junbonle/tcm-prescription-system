<template>
  <div class="prescription-page">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>开处方</h2>
    </div>
    
    <div class="options">
      <router-link to="/prescription/new" class="option-card primary">
        <div class="icon">📝</div>
        <div class="title">手动开方</div>
        <div class="desc">搜索药材，手动添加剂量</div>
      </router-link>
      
      <router-link to="/prescription/templates" class="option-card">
        <div class="icon">📋</div>
        <div class="title">模板开方</div>
        <div class="desc">选择常用处方模板快速开方</div>
      </router-link>
      
      <router-link to="/prescription/ocr" class="option-card">
        <div class="icon">📷</div>
        <div class="title">图片识别</div>
        <div class="desc">拍照或上传处方图片自动识别</div>
      </router-link>
    </div>
    
    <div class="recent-section">
      <h3>最近处方</h3>
      <div v-if="recentPrescriptions.length === 0" class="empty">
        暂无近期处方
      </div>
      <div v-else class="recent-list">
        <div 
          v-for="p in recentPrescriptions" 
          :key="p.id"
          class="recent-item"
          @click="viewDetail(p.id)"
        >
          <div class="info">
            <div class="name">{{ p.patientName || '未知患者' }}</div>
            <div class="meta">{{ formatDate(p.createdAt) }} · {{ p.items.length }}味药</div>
          </div>
          <div class="amount">¥{{ ((p.finalTotal || 0) * (p.dosage || 1)).toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrescriptionStore } from '../stores/prescriptions'
import dayjs from 'dayjs'

const router = useRouter()
const prescriptionStore = usePrescriptionStore()

const goBack = () => router.back()

const recentPrescriptions = computed(() => {
  return prescriptionStore.prescriptionList.slice(0, 5)
})

const formatDate = (iso) => dayjs(iso).format('MM-DD HH:mm')

const viewDetail = (id) => {
  router.push(`/history?id=${id}`)
}

onMounted(() => {
  prescriptionStore.loadPrescriptions()
})
</script>

<style scoped>
.prescription-page {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  font-size: 20px;
}

.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: white;
  border-radius: 16px;
  text-decoration: none;
  color: var(--text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}

.option-card:active {
  transform: scale(0.98);
}

.option-card.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.option-card .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.option-card .title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.option-card .desc {
  font-size: 14px;
  opacity: 0.8;
}

.recent-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.recent-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
  cursor: pointer;
}

.recent-item .name {
  font-weight: 500;
}

.recent-item .meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.recent-item .amount {
  font-weight: 600;
  color: var(--primary);
}

.empty {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}
</style>