<template>
  <div class="new-prescription">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>新建处方</h2>
      <button class="save-btn" @click="savePrescription" :disabled="!canSave">
        保存
      </button>
    </div>
    
    <div class="content-area">
    <!-- 患者选择 -->
    <div class="section">
      <h3>患者信息</h3>
      <div v-if="selectedPatient" class="selected-patient">
        <div class="info">
          <span class="name">{{ selectedPatient.name }}</span>
          <span class="meta">{{ selectedPatient.gender }} {{ selectedPatient.age }}岁</span>
        </div>
        <button class="btn btn-sm btn-secondary" @click="selectedPatient = null">更换</button>
      </div>
      <div v-else class="patient-select">
        <input 
          v-model="patientSearch"
          type="text"
          class="form-input"
          placeholder="搜索患者姓名..."
          @focus="showPatientList = true"
        >
        <div v-if="showPatientList && filteredPatients.length > 0" class="patient-list">
          <div 
            v-for="p in filteredPatients" 
            :key="p.id"
            class="patient-item"
            @click="selectPatient(p)"
          >
            <span>{{ p.name }}</span>
            <span class="meta">{{ p.phone || p.gender }}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" @click="showAddPatient = true">
          + 新建患者
        </button>
      </div>
    </div>
    
    <!-- 诊断信息 -->
    <div class="section">
      <h3>诊断信息</h3>
      <div class="form-group">
        <input v-model="diagnosis" type="text" class="form-input" placeholder="诊断（如：风寒感冒）">
      </div>
      <div class="form-group">
        <textarea v-model="advice" class="form-input" rows="2" placeholder="医嘱"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">剂数</label>
          <input v-model.number="dosage" type="number" min="1" class="form-input" placeholder="几副药">
        </div>
        <div class="form-group">
          <label class="form-label">用法</label>
          <input v-model="usage" type="text" class="form-input" placeholder="如：水煎服，每日一剂">
        </div>
      </div>
    </div>
    
    <!-- 药材列表 -->
    <div class="section">
      <div class="section-header">
        <h3>药材 <span class="count"></span></h3>
        <button class="btn btn-primary btn-sm" @click="showAddHerb = true">+ 添加</button>
      </div>

        <div class="herb-import">
        <textarea
                v-model="herbTextImport"
                class="form-input"
                placeholder="复制药方文字自动识别，如：&#10;当归 10，枸杞 20&#10;射干 15"
                rows="3"
                @paste="handleHerbPaste"
                @blur="handleHerbImport"
        ></textarea>
            <button class="btn btn-secondary btn-sm" @click="handleHerbImport">识别</button>
        </div>
      
      <div v-if="items.length === 0" class="empty">
        点击"添加"或输入药方文字
      </div>
      
      <div v-else>
        <div class="herb-list-header">
          <span>药材 ({{ items.length }}味)</span>
          <button class="clear-all-btn" @click="clearAllHerbs" v-if="items.length > 0">
            清空全部
          </button>
        </div>
        
        <div class="herb-items">
        <div v-for="(item, index) in items" :key="index" class="herb-item">
          <div class="herb-info">
            <span class="name">{{ item.herbName }}</span>
            <span class="dosage">{{ item.dosage }}克</span>
          </div>
          <div class="herb-price">
            <span class="original" v-if="item.originalPrice !== item.finalPrice">
              ¥{{ fmtPrice(item.originalPrice) }}
            </span>
            <span class="final">¥{{ fmtPrice(item.finalPrice) }}</span>
          </div>
          <button class="delete-btn" @click="removeHerb(index)">×</button>
        </div>
      </div>
      </div>
      
      <!-- 价格汇总 -->
      <div v-if="items.length > 0" class="price-summary">
        <div class="row">
          <span>药材小计</span>
          <span>¥{{ fmtPrice(originalTotal) }}</span>
        </div>
        <div class="row discount" v-if="discountAmount > 0">
          <span>优惠金额</span>
          <span>-¥{{ fmtPrice(discountAmount) }}</span>
        </div>
      </div>
      
      <!-- 诊疗输入 -->
      <div class="consult-input">
        <label>诊疗</label>
        <input 
          v-model.number="consultFee" 
          type="number" 
          step="0.01"
          min="0"
          class="form-input"
          placeholder="0.00"
        >
      </div>
      
      <!-- 结算金额 -->
      <div v-if="items.length > 0" class="price-total">
        <div class="row">
          <span>药材费用</span>
          <span>¥{{ fmtPrice(finalTotal * dosage) }}</span>
        </div>
        <div class="row" v-if="consultFee > 0">
          <span>诊费</span>
          <span>¥{{ consultFee.toFixed(2) }}</span>
        </div>
        <div class="row total">
          <span>结算金额</span>
          <span class="amount">¥{{ fmtPrice(finalTotal * dosage + consultFee) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 结算信息 -->
    <div class="section">
      <h3>结算</h3>
      <div class="form-group">
        <label class="form-label">支付方式</label>
        <div class="payment-options">
          <button 
            v-for="method in paymentMethods" 
            :key="method.value"
            class="payment-btn"
            :class="{ active: paymentMethod === method.value }"
            @click="paymentMethod = method.value"
          >
            {{ method.label }}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">实收金额</label>
        <input 
          v-model.number="paidAmount" 
          type="number" 
          step="0.01"
          class="form-input" 
          :placeholder="`应收: ¥${fmtPrice(finalTotal * dosage + consultFee)}`"
        >
      </div>
      <div v-if="change > 0" class="change-info">
        找零: ¥{{ fmtPrice(change) }}
      </div>
    </div>
    
    <!-- 添加药材弹窗 -->
    <div v-if="showAddHerb" class="modal-overlay" @click="showAddHerb = false">
      <div class="modal" @click.stop>
        <h3>添加药材</h3>
        <input 
          v-model="herbSearch"
          type="text"
          class="form-input"
          placeholder="搜索药材名称..."
          ref="herbSearchInput"
        >
        <div class="herb-select-list">
          <div 
            v-for="herb in filteredHerbs" 
            :key="herb.id"
            class="herb-select-item"
            @click="selectHerb(herb)"
          >
            <div class="info">
              <span class="name">{{ herb.name }}</span>
              <span class="stock" :class="{ low: herb.stock < 0.05 }">库存: {{ herb.stock.toFixed(2) }}公斤</span>
            </div>
            <div class="price">
              <span>¥{{ (herb.salePrice / 1000).toFixed(4) }}/克</span>
              <span v-if="herb.discount && herb.discount !== 10" class="discount">{{ herb.discount }}折</span>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary btn-block" @click="showAddHerb = false">取消</button>
      </div>
    </div>
    
    <!-- 输入剂量弹窗 -->
    <div v-if="selectedHerbForAdd" class="modal-overlay" @click="cancelAddHerb">
      <div class="modal" @click.stop>
        <h3>{{ selectedHerbForAdd.name }}</h3>
        <div class="herb-detail">
          <div>售价: ¥{{ (selectedHerbForAdd.salePrice / 1000).toFixed(4) }}/克</div>
          <div v-if="selectedHerbForAdd.discount && selectedHerbForAdd.discount !== 10">
            折扣: {{ selectedHerbForAdd.discount }}折
          </div>
          <div>库存: {{ selectedHerbForAdd.stock.toFixed(2) }}公斤</div>
        </div>
        <div class="form-group">
          <label class="form-label">剂量 (g)</label>
          <input 
            v-model.number="herbDosage"
            type="number"
            class="form-input"
            placeholder="如: 10"
            autofocus
          >
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="cancelAddHerb">取消</button>
          <button class="btn btn-primary" @click="confirmAddHerb">确认</button>
        </div>
      </div>
    </div>
    
    <!-- 新建患者弹窗 -->
    <div v-if="showAddPatient" class="modal-overlay" @click="showAddPatient = false">
      <div class="modal" @click.stop>
        <h3>新建患者</h3>
        <div class="form-group">
          <label class="form-label">姓名 *</label>
          <input v-model="newPatient.name" type="text" class="form-input" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">性别</label>
            <select v-model="newPatient.gender" class="form-input">
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">年龄</label>
            <input v-model.number="newPatient.age" type="number" class="form-input">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">电话</label>
          <input v-model="newPatient.phone" type="tel" class="form-input">
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showAddPatient = false">取消</button>
          <button class="btn btn-primary" @click="createPatient">创建</button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHerbStore } from '../stores/herbs'
import { usePatientStore } from '../stores/patients'
import { usePrescriptionStore } from '../stores/prescriptions'
import { db } from '../db'
import { useFileStorage } from '../services/fileStorage'

const router = useRouter()
const route = useRoute()
const herbStore = useHerbStore()
const patientStore = usePatientStore()
const prescriptionStore = usePrescriptionStore()
const fileStorage = useFileStorage()

// 患者相关
const selectedPatient = ref(null)
const patientSearch = ref('')
const showPatientList = ref(false)
const showAddPatient = ref(false)
const newPatient = ref({ name: '', gender: '', age: null, phone: '' })

// 处方信息
const diagnosis = ref('')
const advice = ref('')
const dosage = ref(1)
const usage = ref('水煎服，每日一剂')

// 药材相关
const items = ref([])
const showAddHerb = ref(false)
const herbSearch = ref('')
const selectedHerbForAdd = ref(null)
const herbDosage = ref(10)
const herbTextImport = ref('')

// 结算
const consultFee = ref(0)
const paymentMethod = ref('cash')
const paidAmount = ref(null)

const paymentMethods = [
  { label: '现金', value: 'cash' },
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '其他', value: 'other' }
]

// 计算属性
const filteredPatients = computed(() => {
  return patientStore.searchPatients(patientSearch.value)
})

const filteredHerbs = computed(() => {
  return herbStore.searchHerbs(herbSearch.value)
})

const fmtPrice = (val) => {
  return (Math.round(val * 10000) / 10000).toString()
}

const originalTotal = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.originalPrice || 0), 0)
})

const finalTotal = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.finalPrice || 0), 0)
})

const discountAmount = computed(() => originalTotal.value - finalTotal.value)

const change = computed(() => {
  const total = finalTotal.value * dosage.value + consultFee.value
    return (paidAmount.value || 0) - total
})

const canSave = computed(() => {
  return items.value.length > 0 && diagnosis.value.trim()
})

// 方法
const goBack = () => router.back()

const selectPatient = (patient) => {
  selectedPatient.value = patient
  showPatientList.value = false
  patientSearch.value = ''
}

const createPatient = async () => {
  if (!newPatient.value.name.trim()) {
    alert('请输入患者姓名')
    return
  }
  try {
    const patient = await patientStore.addPatient(newPatient.value)
    selectedPatient.value = patient
    showAddPatient.value = false
    newPatient.value = { name: '', gender: '', age: null, phone: '' }
  } catch (e) {
    alert(e.message)
  }
}

const selectHerb = (herb) => {
  const exists = items.value.some(item => item.herbId === herb.id)
  if (exists) {
    alert(`「${herb.name}」已在处方中`)
    return
  }
  selectedHerbForAdd.value = herb
  herbDosage.value = 10
  showAddHerb.value = false
}

const cancelAddHerb = () => {
  selectedHerbForAdd.value = null
  showAddHerb.value = true
}

const confirmAddHerb = () => {
  if (!herbDosage.value || herbDosage.value <= 0) {
    alert('请输入有效剂量')
    return
  }
  
  const herb = selectedHerbForAdd.value
  const originalPrice = (herb.salePrice / 1000) * herbDosage.value
  const discount = herb.discount || 10
  const finalPrice = originalPrice * (discount / 10)
  
  items.value.push({
    herbId: herb.id,
    herbName: herb.name,
    dosage: herbDosage.value,
    originalPrice: Math.round(originalPrice * 10000) / 10000,
    finalPrice: Math.round(finalPrice * 10000) / 10000
  })
  
  selectedHerbForAdd.value = null
  herbDosage.value = 10
}

const removeHerb = (index) => {
  items.value.splice(index, 1)
}

const clearAllHerbs = () => {
  if (items.value.length === 0) return
  if (!confirm(`确定清空所有药材（共 ${items.value.length} 味）吗？`)) return
  items.value = []
}

const handleHerbPaste = (e) => {
  setTimeout(() => {
    handleHerbImport()
  }, 100)
}

const handleHerbImport = () => {
  const text = herbTextImport.value.trim()
  if (!text) return
  
  const herbPattern = /([\u4e00-\u9fa5]{2,8})(\d+\.?\d*)/g
  let match
  let importedCount = 0
  let notFoundList = []
  let duplicateList = []
  
  while ((match = herbPattern.exec(text)) !== null) {
    const herbName = match[1]
    const dosage = parseFloat(match[2])
    
    const existingItem = items.value.find(item => item.herbName === herbName)
    if (existingItem) {
      duplicateList.push(herbName)
      continue
    }
    
    const herb = herbStore.herbs.find(h => h.name === herbName)
    if (herb) {
      const originalPrice = (herb.salePrice / 1000) * dosage
      const discount = herb.discount || 10
      const finalPrice = originalPrice * (discount / 10)
      
      items.value.push({
        herbId: herb.id,
        herbName: herb.name,
        dosage: dosage,
        originalPrice: Math.round(originalPrice * 10000) / 10000,
        finalPrice: Math.round(finalPrice * 10000) / 10000
      })
      importedCount++
    } else {
      notFoundList.push(herbName)
    }
  }
  
  herbTextImport.value = ''
  
  let msg = ''
  if (importedCount > 0) {
    msg += `成功导入 ${importedCount} 味药材\n`
  }
  if (duplicateList.length > 0) {
    msg += `以下药材已在处方中，已跳过：${duplicateList.join('、')}\n`
  }
  if (notFoundList.length > 0) {
    msg += `以下药材未找到：${notFoundList.join('、')}`
  }
  
  if (msg) {
    alert(msg)
  } else {
    alert('未能识别到药材，请检查格式（如：当归10，枸杞20）')
  }
}

const savePrescription = async () => {
    const hasPath = await fileStorage.hasStoragePath()
    const setting = await db.settings.getItem('appSettings')
    // 如果开启了自动同步但没有设置保存路径，提示用户
    if (setting?.autoSync && !hasPath) {
        alert('自动同步已开启，请先在设置中设置数据保存位置')
        router.push('/settings')
        return
    }
  
  try {
    const prescription = await prescriptionStore.createPrescription({
      patientId: selectedPatient.value?.id || null,
      patientName: selectedPatient.value?.name || '未知患者',
      diagnosis: diagnosis.value,
      advice: advice.value,
      dosage: dosage.value,
      usage: usage.value,
      items: items.value,
      consultFee: consultFee.value,
      paymentMethod: paymentMethod.value,
      paidAmount: paidAmount.value || (finalTotal.value * dosage.value + consultFee.value)
    })
    
    const settingsData = await db.settings.getItem('appSettings')
    if (settingsData?.autoSync) {
      try {
        await herbStore.loadHerbs()
        await patientStore.loadPatients()
        await prescriptionStore.loadPrescriptions()
        
        const data = {
          version: '1.0.0',
          exportTime: new Date().toISOString(),
          herbs: herbStore.herbs,
          patients: patientStore.patients,
          prescriptions: prescriptionStore.prescriptions,
          settings: settingsData
        }
        
        await fileStorage.saveToFile(data)
      } catch (e) {
        console.warn('自动同步失败:', e)
      }
    }
    
    alert('处方保存成功！')
    router.push(`/history?id=${prescription.id}`)
  } catch (e) {
    alert(e.message)
  }
}

// 处理从模板或OCR传入的数据
const processRouteData = async () => {
  // 从模板导入
  if (route.query.template) {
    try {
      const template = JSON.parse(route.query.template)
      diagnosis.value = template.description || ''
      
      // 将模板药材名称匹配到实际药材
      for (const item of template.items) {
        const herb = herbStore.herbs.find(h => h.name === item.herbName)
        if (herb) {
          const originalPrice = (herb.salePrice / 1000) * item.dosage
          const discount = herb.discount || 10
          const finalPrice = originalPrice * (discount / 10)
          
          items.value.push({
            herbId: herb.id,
            herbName: herb.name,
            dosage: item.dosage,
            originalPrice: Math.round(originalPrice * 10000) / 10000,
            finalPrice: Math.round(finalPrice * 10000) / 10000
          })
        }
      }
    } catch (e) {
      console.error('解析模板失败:', e)
    }
  }
  
  // 从OCR导入
  if (route.query.ocrItems) {
    try {
      const ocrItems = JSON.parse(route.query.ocrItems)
      
      for (const item of ocrItems) {
        const herb = herbStore.herbs.find(h => h.name === item.herbName)
        if (herb) {
          const originalPrice = (herb.salePrice / 1000) * item.dosage
          const discount = herb.discount || 10
          const finalPrice = originalPrice * (discount / 10)
          
          items.value.push({
            herbId: herb.id,
            herbName: herb.name,
            dosage: item.dosage,
            originalPrice: Math.round(originalPrice * 10000) / 10000,
            finalPrice: Math.round(finalPrice * 10000) / 10000
          })
        } else {
          // 药材不存在，添加待确认项
          items.value.push({
            herbId: null,
            herbName: item.herbName + '(未匹配)',
            dosage: item.dosage,
            originalPrice: 0,
            finalPrice: 0
          })
        }
      }
    } catch (e) {
      console.error('解析OCR结果失败:', e)
    }
  }
}

onMounted(async () => {
  await herbStore.loadHerbs()
  await patientStore.loadPatients()
  await processRouteData()
})
</script>

<style scoped>
.new-prescription {
  padding: 16px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.save-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #5a9bd5) 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  transition: all 0.2s;
}

.save-btn:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: 0 1px 4px rgba(74, 144, 226, 0.2);
}

.save-btn:disabled {
  background: var(--text-secondary);
  box-shadow: none;
  cursor: not-allowed;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section h3 .count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: normal;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
}

.selected-patient {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--primary-light);
  border-radius: 8px;
}

.selected-patient .name {
  font-weight: 600;
  margin-right: 8px;
}

.selected-patient .meta {
  font-size: 14px;
  color: var(--text-secondary);
}

.patient-select {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.patient-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.patient-item:hover {
  background: var(--bg);
}

.patient-item .meta {
  font-size: 14px;
  color: var(--text-secondary);
}

.herb-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.herb-import {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.herb-import .form-input {
    flex: 1;
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
}

.herb-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.clear-all-btn {
  background: var(--danger);
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.herb-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.herb-item .herb-info {
  flex: 1;
  display: flex;
  gap: 12px;
}

.herb-item .name {
  font-weight: 500;
  min-width: 80px;
}

.herb-item .dosage {
  color: var(--text-secondary);
}

.herb-item .herb-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 12px;
}

.herb-item .original {
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.herb-item .final {
  font-weight: 600;
  color: var(--primary);
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--danger);
  color: white;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.price-summary .row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.price-summary .row.discount {
  color: var(--primary);
}

.price-summary .row.total {
  font-size: 16px;
  font-weight: 600;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.price-summary .row.total .amount {
  color: var(--primary);
  font-size: 20px;
}

.price-summary .row.dosage-total {
  font-size: 16px;
  font-weight: 600;
  color: var(--danger);
}

.consult-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.consult-input label {
  font-weight: 500;
  min-width: 50px;
}

.consult-input .form-input {
  flex: 1;
}

.price-total {
  margin-top: 12px;
  padding: 16px;
  background: var(--primary-light);
  border-radius: 8px;
}

.price-total .row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.price-total .row.total {
  font-size: 16px;
  font-weight: 600;
  padding-top: 8px;
  border-top: 1px solid var(--primary);
  margin-top: 8px;
}

.price-total .row.total .amount {
  color: var(--primary);
  font-size: 20px;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.payment-btn {
  padding: 10px;
  border: 1px solid var(--border);
  background: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.payment-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.change-info {
  text-align: right;
  color: var(--primary);
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
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
  padding: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: 16px;
}

.herb-select-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 12px 0;
}

.herb-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.herb-select-item:hover {
  background: var(--bg);
}

.herb-select-item .info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.herb-select-item .stock {
  font-size: 12px;
  color: var(--text-secondary);
}

.herb-select-item .stock.low {
  color: var(--danger);
}

.herb-select-item .price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.herb-select-item .discount {
  font-size: 12px;
  color: var(--primary);
}

.herb-detail {
  background: var(--bg);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.herb-detail div {
  margin-bottom: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.form-actions .btn {
  flex: 1;
}

.empty {
  text-align: center;
  padding: 3px;
  color: var(--text-secondary);
}
</style>