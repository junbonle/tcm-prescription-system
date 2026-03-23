import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, generateId, now } from '../db'

export const usePatientStore = defineStore('patients', () => {
  // State
  const patients = ref([])
  const loading = ref(false)
  
  // Getters
  const patientList = computed(() => 
    patients.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  )
  
  const patientById = (id) => patients.value.find(p => p.id === id)
  
  const searchPatients = (keyword) => {
    if (!keyword) return patientList.value
    return patientList.value.filter(p => 
      p.name.includes(keyword) || 
      p.phone?.includes(keyword)
    )
  }
  
  // Actions
  const loadPatients = async () => {
    loading.value = true
    try {
      const list = []
      await db.patients.iterate((value) => {
        list.push(value)
      })
      patients.value = list
    } finally {
      loading.value = false
    }
  }
  
  const addPatient = async (patientData) => {
    const patient = {
      id: generateId(),
      ...patientData,
      visitCount: 0,
      createdAt: now(),
      updatedAt: now()
    }
    await db.patients.setItem(patient.id, patient)
    patients.value.push(patient)
    return patient
  }
  
  const updatePatient = async (id, updates) => {
    const patient = await db.patients.getItem(id)
    if (!patient) throw new Error('患者不存在')
    
    const updated = { ...patient, ...updates, updatedAt: now() }
    await db.patients.setItem(id, updated)
    
    const index = patients.value.findIndex(p => p.id === id)
    if (index !== -1) patients.value[index] = updated
    return updated
  }
  
  const deletePatient = async (id) => {
    await db.patients.removeItem(id)
    patients.value = patients.value.filter(p => p.id !== id)
  }
  
  // 增加就诊次数
  const incrementVisit = async (id) => {
    const patient = await db.patients.getItem(id)
    if (!patient) return
    
    return updatePatient(id, { 
      visitCount: (patient.visitCount || 0) + 1,
      lastVisit: now()
    })
  }
  
  return {
    patients,
    loading,
    patientList,
    patientById,
    searchPatients,
    loadPatients,
    addPatient,
    updatePatient,
    deletePatient,
    incrementVisit
  }
})