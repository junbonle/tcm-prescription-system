<template>
  <div class="print-page">
    <div class="print-actions no-print">
      <button class="btn btn-secondary" @click="goBack">返回</button>
      <select v-model="format" class="format-select" @change="saveFormat">
        <option value="a4">A4 纸</option>
        <option value="receipt">小票纸</option>
      </select>
      <button class="btn btn-primary" @click="handlePrint">打印</button>
    </div>
    
    <!-- A4 打印模板 -->
    <div v-if="format === 'a4'" class="prescription-a4">
      <div class="clinic-header">
        <h1>{{ settings.clinicName || '中医诊所' }}</h1>
        <p>处方笺</p>
      </div>
      
      <div class="patient-section">
        <div class="row">
          <span>姓名：{{ prescription?.patientName || '未知' }}</span>
          <span>日期：{{ formatDate(prescription?.createdAt) }}</span>
        </div>
        <div class="row">
          <span>诊断：{{ prescription?.diagnosis || '-' }}</span>
        </div>
      </div>
      
      <div class="herb-section">
        <h3>RP：</h3>
        <div class="herb-list">
          <div v-for="(item, idx) in prescription?.items" :key="idx" class="herb-item">
            <span class="name">{{ item.herbName }}</span>
            <span class="dosage">{{ item.dosage }}克</span>
          </div>
        </div>
        
        <div class="usage-section">
          <p><strong>剂数：</strong>{{ prescription?.dosage }}剂</p>
          <p><strong>用法：</strong>{{ prescription?.usage || '水煎服，每日一剂' }}</p>
          <p v-if="prescription?.advice"><strong>医嘱：</strong>{{ prescription.advice }}</p>
        </div>
      </div>
      
      <div class="footer-section">
        <div class="price">
          <span>药费：¥{{ ((prescription?.finalTotal || 0) * (prescription?.dosage || 1)).toFixed(2) }}</span>
        </div>
        <div class="signature">
          <span>医师：{{ settings.doctorName || '____________' }}</span>
          <span>（签字盖章有效）</span>
        </div>
      </div>
    </div>
    
    <!-- 小票打印模板 -->
    <div v-else class="prescription-receipt">
      <div class="receipt-header">
        <h3>{{ settings.clinicName || '中医诊所' }}</h3>
        <p>处方单</p>
      </div>
      
      <div class="divider">--------------------------------</div>
      
      <div class="receipt-info">
        <p>患者：{{ prescription?.patientName || '未知' }}</p>
        <p>日期：{{ formatDate(prescription?.createdAt) }}</p>
        <p>诊断：{{ prescription?.diagnosis || '-' }}</p>
      </div>
      
      <div class="divider">--------------------------------</div>
      
      <div class="receipt-items">
        <div v-for="(item, idx) in prescription?.items" :key="idx" class="item">
          <span>{{ item.herbName }}</span>
          <span>{{ item.dosage }}克</span>
        </div>
      </div>
      
      <div class="divider">--------------------------------</div>
      
      <div class="receipt-total">
        <p>剂数：{{ prescription?.dosage }}剂</p>
        <p class="total">合计：¥{{ ((prescription?.finalTotal || 0) * (prescription?.dosage || 1)).toFixed(2) }}</p>
      </div>
      
      <div class="receipt-footer">
        <p>医师：{{ settings.doctorName || '' }}</p>
        <p>谢谢惠顾，祝您健康！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePrescriptionStore } from '../stores/prescriptions'
import { db } from '../db'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const prescriptionStore = usePrescriptionStore()

const prescription = ref(null)
const format = ref('a4')
const settings = ref({
  clinicName: '',
  doctorName: ''
})

const formatDate = (iso) => {
  if (!iso) return '-'
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

const goBack = () => router.back()

const handlePrint = () => {
  window.print()
}

const saveFormat = async () => {
  const savedSettings = await db.settings.getItem('appSettings') || {}
  savedSettings.printFormat = format.value
  await db.settings.setItem('appSettings', savedSettings)
}

onMounted(async () => {
  // 先加载设置
  const savedSettings = await db.settings.getItem('appSettings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...savedSettings }
    format.value = savedSettings.printFormat || 'a4'
  }
  
  const id = route.params.id
  if (!id) {
    router.push('/history')
    return
  }
  
  await prescriptionStore.loadPrescriptions()
  prescription.value = prescriptionStore.prescriptionById(id)
  
  if (!prescription.value) {
    alert('处方不存在')
    router.push('/history')
  }
})
</script>

<style scoped>
.print-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.print-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
  align-items: center;
}

.format-select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

/* A4 样式 */
.prescription-a4 {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 15mm 20mm;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.clinic-header {
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.clinic-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.clinic-header p {
  font-size: 18px;
  color: #666;
}

.patient-section {
  margin-bottom: 30px;
}

.patient-section .row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 16px;
}

.herb-section {
  font-size: 18px;
  margin-bottom: 16px;
  flex: 1;
}

.herb-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.herb-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dotted #ccc;
}

.usage-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ccc;
}

.usage-section p {
  margin-bottom: 12px;
  font-size: 16px;
}

.footer-section {
  margin-top: 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-shrink: 0;
}

.footer-section .price {
  font-size: 18px;
  font-weight: bold;
}

.footer-section .signature {
  text-align: right;
}

.footer-section .signature span {
  display: block;
  margin-bottom: 8px;
}

/* 小票样式 */
.prescription-receipt {
  width: 80mm;
  margin: 0 auto;
  padding: 10mm 5mm;
  background: white;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.receipt-header {
  text-align: center;
  margin-bottom: 10px;
}

.receipt-header h3 {
  font-size: 16px;
  font-weight: bold;
}

.divider {
  text-align: center;
  color: #999;
  margin: 8px 0;
}

.receipt-info p {
  margin-bottom: 4px;
}

.receipt-items .item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.receipt-total {
  margin-top: 10px;
}

.receipt-total .total {
  font-size: 14px;
  font-weight: bold;
  margin-top: 4px;
}

.receipt-footer {
  margin-top: 20px;
  text-align: center;
}

.receipt-footer p {
  margin-bottom: 4px;
}

/* 打印样式 */
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-page {
    background: white;
    padding: 0;
    margin: 0;
    min-height: auto;
  }
  
  .prescription-a4,
  .prescription-receipt {
    box-shadow: none;
    margin: 0;
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto;
    page-break-after: always;
    page-break-before: never;
    page-break-inside: avoid;
  }
  
  .prescription-a4 {
    padding: 10mm 15mm;
  }
  
  * {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .herb-section {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .herb-list {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .herb-item {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .footer-section {
    page-break-before: avoid !important;
    break-before: avoid !important;
  }
  
  @page {
    margin: 0;
    size: portrait;
  }
  
  html, body {
    height: auto !important;
    overflow: visible !important;
  }
  
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>