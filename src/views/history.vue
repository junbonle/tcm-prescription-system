<template>
  <div class="history-page">
    <div class="header">
      <h2>历史记录</h2>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input 
        v-model="searchKey"
        type="text"
        class="form-input"
        placeholder="搜索患者姓名..."
      >
      <select v-model="dateFilter" class="form-input">
        <option value="all">全部</option>
        <option value="today">今天</option>
        <option value="week">本周</option>
        <option value="month">本月</option>
      </select>
    </div>
    
    <!-- 统计概览 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="value">{{ filteredPrescriptions.length }}</span>
        <span class="label">处方数</span>
      </div>
      <div class="stat-item">
        <span class="value">¥{{ fmtPrice(filteredTotal) }}</span>
        <span class="label">总金额</span>
      </div>
    </div>
    
    <!-- 处方列表 -->
    <div class="prescription-list">
      <div v-if="filteredPrescriptions.length === 0" class="empty">
        暂无记录
      </div>
      <div 
        v-for="p in filteredPrescriptions" 
        :key="p.id"
        class="prescription-card"
        @click="viewDetail(p)"
      >
        <div class="card-header">
          <div class="patient-info">
            <span class="name">{{ p.patientName || '未知患者' }}</span>
            <span class="date">{{ formatDate(p.createdAt) }}</span>
          </div>
          <div class="amount">¥{{ fmtPrice(p.finalTotal || p.herbTotal || 0) }}</div>
        </div>
        <div class="card-body">
          <div class="diagnosis" v-if="p.diagnosis">
            <span class="label">诊断:</span>
            <span>{{ p.diagnosis }}</span>
          </div>
          <div class="herbs-preview">
            <span v-for="(item, idx) in p.items.slice(0, 4)" :key="idx" class="herb-tag">
              {{ item.herbName }}
            </span>
            <span v-if="p.items.length > 4" class="more">+{{ p.items.length - 4 }}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="payment">{{ formatPayment(p.paymentMethod) }}</span>
          <span class="dosage">{{ p.dosage }}剂</span>
          <button class="delete-btn" @click.stop="deletePrescription(p.id)">删除</button>
        </div>
      </div>
    </div>
    
    <!-- 详情弹窗 -->
    <div v-if="selectedPrescription" class="modal-overlay" @click="selectedPrescription = null">
      <div class="modal detail-modal" @click.stop>
        <div class="detail-header">
          <h3>处方详情</h3>
          <button class="close-btn" @click="selectedPrescription = null">×</button>
        </div>
        
        <div class="detail-content">
          <div class="detail-section">
            <div class="section-title">患者信息</div>
            <div class="info-row">
              <span class="label">姓名:</span>
              <span>{{ selectedPrescription.patientName || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="label">时间:</span>
              <span>{{ formatDateTime(selectedPrescription.createdAt) }}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">诊断信息</div>
            <div class="info-row">
              <span class="label">诊断:</span>
              <span>{{ selectedPrescription.diagnosis || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">医嘱:</span>
              <span>{{ selectedPrescription.advice || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">用法:</span>
              <span>{{ selectedPrescription.usage || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">剂数:</span>
              <span>{{ selectedPrescription.dosage }}剂</span>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">药材清单</div>
            <table class="herb-table">
              <thead>
                <tr>
                  <th>药材</th>
                  <th>剂量</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in selectedPrescription.items" :key="idx">
                  <td>{{ item.herbName }}</td>
                  <td>{{ item.dosage }}克</td>
                  <td>¥{{ fmtPrice(item.finalPrice / item.dosage) }}/克</td>
                  <td>¥{{ fmtPrice(item.finalPrice) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="detail-section">
            <div class="section-title">费用明细</div>
            <div class="price-row">
              <span>药材费用</span>
              <span>¥{{ fmtPrice(selectedPrescription.herbTotal || 0) }}</span>
            </div>
            <div class="price-row" v-if="selectedPrescription.consultFee > 0">
              <span>诊费</span>
              <span>¥{{ selectedPrescription.consultFee.toFixed(2) }}</span>
            </div>
            <div class="price-row total">
              <span>结算金额</span>
              <span class="amount">¥{{ fmtPrice(selectedPrescription.finalTotal || 0) }}</span>
            </div>
            <div class="price-row">
              <span>支付方式</span>
              <span>{{ formatPayment(selectedPrescription.paymentMethod) }}</span>
            </div>
            <div class="price-row">
              <span>实收金额</span>
              <span>¥{{ fmtPrice(selectedPrescription.paidAmount || selectedPrescription.finalTotal || 0) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-actions">
          <button class="btn btn-secondary" @click="selectedPrescription = null">关闭</button>
          <button class="btn btn-primary" @click="printPrescription">打印预览</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePrescriptionStore } from '../stores/prescriptions'
import dayjs from 'dayjs'

const route = useRoute()
const prescriptionStore = usePrescriptionStore()

const searchKey = ref('')
const dateFilter = ref('all')
const selectedPrescription = ref(null)

const filteredPrescriptions = computed(() => {
  let list = prescriptionStore.prescriptionList
  
  // 搜索筛选
  if (searchKey.value) {
    list = list.filter(p => 
      p.patientName?.includes(searchKey.value) ||
      p.diagnosis?.includes(searchKey.value)
    )
  }
  
  // 日期筛选
  const now = dayjs()
  switch (dateFilter.value) {
    case 'today':
      list = list.filter(p => dayjs(p.createdAt).isSame(now, 'day'))
      break
    case 'week':
      list = list.filter(p => dayjs(p.createdAt).isAfter(now.subtract(7, 'day')))
      break
    case 'month':
      list = list.filter(p => dayjs(p.createdAt).isAfter(now.subtract(30, 'day')))
      break
  }
  
  return list
})

const filteredTotal = computed(() => {
  return filteredPrescriptions.value.reduce((sum, p) => 
    sum + (p.finalTotal || p.herbTotal || 0), 0
  )
})

const formatDate = (iso) => dayjs(iso).format('MM-DD HH:mm')
const formatDateTime = (iso) => dayjs(iso).format('YYYY-MM-DD HH:mm')

const formatPayment = (method) => {
  const map = {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝',
    other: '其他'
  }
  return map[method] || method
}

const fmtPrice = (val) => {
  return (Math.round(val * 10000) / 10000).toString()
}

const viewDetail = (p) => {
  selectedPrescription.value = p
}

const deletePrescription = async (id) => {
  if (!id) {
    id = selectedPrescription.value?.id
  }
  if (!confirm('确定删除此处方记录吗？')) return
  try {
    await prescriptionStore.deletePrescription(id)
    if (selectedPrescription.value?.id === id) {
      selectedPrescription.value = null
    }
  } catch (e) {
    alert(e.message)
  }
}

const printPrescription = () => {
  // 跳转到打印页面
  window.open(`#/print/${selectedPrescription.value.id}`, '_blank')
}

onMounted(() => {
  prescriptionStore.loadPrescriptions()
  
  // 如果有传入ID，自动打开详情
  const id = route.query.id
  if (id) {
    const p = prescriptionStore.prescriptionById(id)
    if (p) selectedPrescription.value = p
  }
})
</script>

<style scoped>
.history-page {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  margin-bottom: 16px;
}

.header h2 {
  font-size: 20px;
}

.filter-bar {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.stats-bar {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary);
}

.stat-item .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.prescription-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prescription-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.patient-info {
  display: flex;
  flex-direction: column;
}

.patient-info .name {
  font-size: 16px;
  font-weight: 600;
}

.patient-info .date {
  font-size: 12px;
  color: var(--text-secondary);
}

.card-header .amount {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}

.card-body {
  margin-bottom: 12px;
}

.diagnosis {
  font-size: 14px;
  margin-bottom: 8px;
}

.diagnosis .label {
  color: var(--text-secondary);
}

.herbs-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.herb-tag {
  font-size: 12px;
  background: var(--bg);
  padding: 4px 8px;
  border-radius: 4px;
}

.more {
  font-size: 12px;
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.card-footer .delete-btn {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--danger);
  background: none;
  border: 1px solid var(--danger);
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-modal {
  max-height: 85vh;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.detail-header h3 {
  font-size: 18px;
}

.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--primary-light);
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row .label {
  min-width: 60px;
  color: var(--text-secondary);
}

.herb-table {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}

.herb-table th,
.herb-table td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid var(--border);
}

.herb-table th {
  color: var(--text-secondary);
  font-weight: 500;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.price-row.total {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  padding-top: 12px;
  border-top: 2px solid var(--border);
  margin-top: 8px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.detail-actions .btn {
  flex: 1;
}

.empty {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}
</style>