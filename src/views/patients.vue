<template>
  <div class="patients-page">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>患者管理</h2>
      <button class="btn btn-primary btn-sm" @click="showAddModal = true">
        + 添加
      </button>
    </div>
    
    <div class="search-bar">
      <input 
        v-model="searchKey"
        type="text" 
        class="form-input"
        placeholder="搜索患者姓名、电话..."
      >
    </div>
    
    <div class="patient-list">
      <div v-if="filteredPatients.length === 0" class="empty">
        暂无患者
      </div>
      <div 
        v-for="patient in filteredPatients" 
        :key="patient.id"
        class="patient-card"
        @click="editPatient(patient)"
      >
        <div class="patient-header">
          <div class="info">
            <span class="name">{{ patient.name }}</span>
            <span class="meta">{{ patient.gender || '' }} {{ patient.age ? patient.age + '岁' : '' }}</span>
          </div>
          <div class="visit-count">
            就诊 {{ patient.visitCount || 0 }} 次
          </div>
        </div>
        <div class="patient-info">
          <div v-if="patient.phone" class="info-row">
            <span class="label">电话:</span>
            <span>{{ patient.phone }}</span>
          </div>
          <div v-if="patient.allergy" class="info-row">
            <span class="label">过敏史:</span>
            <span class="allergy">{{ patient.allergy }}</span>
          </div>
          <div v-if="patient.lastVisit" class="info-row">
            <span class="label">最近就诊:</span>
            <span>{{ formatDate(patient.lastVisit) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal || editingPatient" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingPatient ? '编辑患者' : '添加患者' }}</h3>
        <form @submit.prevent="savePatient">
          <div class="form-group">
            <label class="form-label">姓名 *</label>
            <input v-model="form.name" type="text" class="form-input" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">性别</label>
              <select v-model="form.gender" class="form-input">
                <option value="">请选择</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">年龄</label>
              <input v-model.number="form.age" type="number" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">电话</label>
            <input v-model="form.phone" type="tel" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">过敏史</label>
            <input v-model="form.allergy" type="text" class="form-input" placeholder="如无请留空">
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="form.remark" class="form-input" rows="2"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
            <button v-if="editingPatient" type="button" class="btn btn-danger" @click="deletePatient">删除</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore } from '../stores/patients'
import dayjs from 'dayjs'

const router = useRouter()

const goBack = () => router.back()

const patientStore = usePatientStore()

const searchKey = ref('')
const showAddModal = ref(false)
const editingPatient = ref(null)

const defaultForm = {
  name: '',
  gender: '',
  age: null,
  phone: '',
  allergy: '',
  remark: ''
}

const form = ref({ ...defaultForm })

const filteredPatients = computed(() => {
  return patientStore.searchPatients(searchKey.value)
})

const formatDate = (iso) => dayjs(iso).format('MM-DD HH:mm')

const editPatient = (patient) => {
  editingPatient.value = patient
  form.value = { ...patient }
}

const closeModal = () => {
  showAddModal.value = false
  editingPatient.value = null
  form.value = { ...defaultForm }
}

const savePatient = async () => {
  try {
    if (editingPatient.value) {
      await patientStore.updatePatient(editingPatient.value.id, form.value)
    } else {
      await patientStore.addPatient(form.value)
    }
    closeModal()
  } catch (e) {
    alert(e.message)
  }
}

const deletePatient = async () => {
  if (!confirm('确定删除该患者吗？相关历史处方将保留但无法关联患者信息。')) return
  try {
    await patientStore.deletePatient(editingPatient.value.id)
    closeModal()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(() => {
  patientStore.loadPatients()
})
</script>

<style scoped>
.patients-page {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.search-bar {
  margin-bottom: 16px;
}

.patient-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
}

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.patient-header .info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-header .name {
  font-size: 18px;
  font-weight: 600;
}

.patient-header .meta {
  font-size: 14px;
  color: var(--text-secondary);
}

.visit-count {
  font-size: 14px;
  color: var(--primary);
  background: var(--primary-light);
  padding: 4px 12px;
  border-radius: 12px;
}

.patient-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.info-row .label {
  color: var(--text-secondary);
  min-width: 70px;
}

.info-row .allergy {
  color: var(--danger);
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
  padding: 48px;
  color: var(--text-secondary);
}
</style>