import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, generateId, now } from '../db'
import { useHerbStore } from './herbs'
import { usePatientStore } from './patients'

export const usePrescriptionStore = defineStore('prescriptions', () => {
  // State
  const prescriptions = ref([])
  const currentPrescription = ref(null)
  const loading = ref(false)
  
  // Getters
  const prescriptionList = computed(() => 
    prescriptions.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  )
  
  const prescriptionById = (id) => prescriptions.value.find(p => p.id === id)
  
  const todayPrescriptions = computed(() => {
    const today = new Date().toDateString()
    return prescriptions.value.filter(p => 
      new Date(p.createdAt).toDateString() === today
    )
  })
  
  const todayRevenue = computed(() => {
    return todayPrescriptions.value.reduce((sum, p) => 
      sum + ((p.finalTotal || 0) * (p.dosage || 1)), 0
    )
  })
  
  // 计算处方价格
  const calculatePrice = (items) => {
    let originalTotal = 0
    let finalTotal = 0
    let costTotal = 0
    
    const herbStore = useHerbStore()
    
    for (const item of items) {
      const herb = herbStore.herbById(item.herbId)
      if (!herb) continue
      
      const unitPrice = (herb.salePrice / 1000)
      const unitCost = (herb.costPrice || 0) / 1000
      const discount = herb.discount || 10
      
      originalTotal += (item.originalPrice || unitPrice * item.dosage)
      finalTotal += (item.finalPrice || unitPrice * item.dosage * (discount / 10))
      costTotal += unitCost * item.dosage
    }
    
    return {
      originalTotal: Math.round(originalTotal * 100) / 100,
      finalTotal: Math.round(finalTotal * 100) / 100,
      costTotal: Math.round(costTotal * 100) / 100,
      profit: Math.round((finalTotal - costTotal) * 100) / 100,
      items
    }
  }
  
  // Actions
  const loadPrescriptions = async () => {
    loading.value = true
    try {
      const list = []
      await db.prescriptions.iterate((value) => {
        list.push(value)
      })
      prescriptions.value = list
    } finally {
      loading.value = false
    }
  }
  
  const createPrescription = async (data) => {
    const herbStore = useHerbStore()
    const patientStore = usePatientStore()
    
    // 深拷贝 items 避免响应式对象问题
    const items = JSON.parse(JSON.stringify(data.items || []))
    
    // 计算价格
    const priceInfo = calculatePrice(items)
    
    const prescription = {
      id: generateId(),
      patientId: data.patientId,
      patientName: data.patientName,
      diagnosis: data.diagnosis,
      advice: data.advice,
      dosage: data.dosage || 1, // 剂数
      usage: data.usage,
      items: priceInfo.items,
      consultFee: data.consultFee || 0,
      herbTotal: priceInfo.finalTotal,
      originalTotal: priceInfo.originalTotal,
      finalTotal: priceInfo.finalTotal + (data.consultFee || 0),
      costTotal: priceInfo.costTotal,
      profit: priceInfo.profit,
      paymentMethod: data.paymentMethod || 'cash',
      paidAmount: data.paidAmount || (priceInfo.finalTotal + (data.consultFee || 0)),
      status: 'completed',
      createdAt: now(),
      updatedAt: now()
    }
    
    // 保存处方
    await db.prescriptions.setItem(prescription.id, prescription)
    prescriptions.value.unshift(prescription)
    
    // 扣减库存（跳过未匹配的药材）
    for (const item of items) {
      if (!item.herbId) continue
      const totalDosage = item.dosage * prescription.dosage
      const stockToDeduct = totalDosage / 1000
      try {
        await herbStore.deductStock(item.herbId, stockToDeduct)
      } catch (e) {
        console.error(`扣减库存失败: ${item.herbName}`, e)
      }
    }
    
    // 增加患者就诊次数
    if (data.patientId) {
      await patientStore.incrementVisit(data.patientId)
    }
    
    return prescription
  }
  
  const deletePrescription = async (id) => {
    // 注意：删除处方不退还库存，可根据需求调整
    await db.prescriptions.removeItem(id)
    prescriptions.value = prescriptions.value.filter(p => p.id !== id)
  }
  
  // 按日期筛选
  const filterByDate = (startDate, endDate) => {
    return prescriptions.value.filter(p => {
      const date = new Date(p.createdAt)
      return date >= startDate && date <= endDate
    })
  }
  
  // 统计
  const getStatistics = (startDate, endDate) => {
    const list = filterByDate(startDate, endDate)
    const total = list.reduce((sum, p) => sum + ((p.finalTotal || 0) * (p.dosage || 1)), 0)
    const profit = list.reduce((sum, p) => sum + ((p.profit || 0) * (p.dosage || 1)), 0)
    const count = list.length
    
    // 药材使用统计
    const herbUsage = {}
    for (const p of list) {
      for (const item of p.items) {
        if (!herbUsage[item.herbName]) {
          herbUsage[item.herbName] = { count: 0, totalDosage: 0 }
        }
        herbUsage[item.herbName].count++
        herbUsage[item.herbName].totalDosage += item.dosage * p.dosage
      }
    }
    
    const topHerbs = Object.entries(herbUsage)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }))
    
    return { total, profit, count, topHerbs }
  }
  
  return {
    prescriptions,
    currentPrescription,
    loading,
    prescriptionList,
    prescriptionById,
    todayPrescriptions,
    todayRevenue,
    calculatePrice,
    loadPrescriptions,
    createPrescription,
    deletePrescription,
    filterByDate,
    getStatistics
  }
})