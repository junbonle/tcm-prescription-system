import localforage from 'localforage'

// 初始化数据库
const initDB = () => {
  // 药材库
  const herbStore = localforage.createInstance({
    name: 'TCM_Prescription',
    storeName: 'herbs'
  })
  
  // 患者库
  const patientStore = localforage.createInstance({
    name: 'TCM_Prescription',
    storeName: 'patients'
  })
  
  // 处方库
  const prescriptionStore = localforage.createInstance({
    name: 'TCM_Prescription',
    storeName: 'prescriptions'
  })
  
  // 设置库
  const settingStore = localforage.createInstance({
    name: 'TCM_Prescription',
    storeName: 'settings'
  })
  
  return {
    herbs: herbStore,
    patients: patientStore,
    prescriptions: prescriptionStore,
    settings: settingStore
  }
}

const db = initDB()

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取当前时间
const now = () => new Date().toISOString()

export { db, generateId, now }
export default db