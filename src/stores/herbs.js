import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, generateId, now } from '../db'

export const useHerbStore = defineStore('herbs', () => {
  // State
  const herbs = ref([])
  const loading = ref(false)
  
  // Getters
  const herbList = computed(() => herbs.value.sort((a, b) => a.name.localeCompare(b.name, 'zh')))
  
  const herbById = (id) => herbs.value.find(h => h.id === id)
  
  const herbExistsByName = (name) => {
    return herbs.value.some(h => h.name === name)
  }
  
  const searchHerbs = (keyword) => {
    if (!keyword) return herbList.value
    const lower = keyword.toLowerCase()
    return herbList.value.filter(h => 
      h.name.includes(keyword) || 
      h.pinyin?.includes(lower) ||
      h.category?.includes(keyword)
    )
  }
  
  const lowStockHerbs = computed(() => 
    herbs.value.filter(h => h.stock <= (h.minStock || 100))
  )
  
  // Actions
  const loadHerbs = async () => {
    loading.value = true
    try {
      const list = []
      await db.herbs.iterate((value) => {
        list.push(value)
      })
      herbs.value = list
    } finally {
      loading.value = false
    }
  }
  
  const addHerb = async (herbData) => {
    if (herbExistsByName(herbData.name)) {
      throw new Error(`药材「${herbData.name}」已存在`)
    }
    const herb = {
      id: generateId(),
      ...herbData,
      createdAt: now(),
      updatedAt: now()
    }
    await db.herbs.setItem(herb.id, herb)
    herbs.value.push(herb)
    return herb
  }
  
  const updateHerb = async (id, updates) => {
    const herb = await db.herbs.getItem(id)
    if (!herb) throw new Error('药材不存在')
    
    const updated = { ...herb, ...updates, updatedAt: now() }
    await db.herbs.setItem(id, updated)
    
    const index = herbs.value.findIndex(h => h.id === id)
    if (index !== -1) herbs.value[index] = updated
    return updated
  }
  
  const deleteHerb = async (id) => {
    await db.herbs.removeItem(id)
    herbs.value = herbs.value.filter(h => h.id !== id)
  }
  
  // 扣减库存
  const deductStock = async (id, amount) => {
    const herb = await db.herbs.getItem(id)
    if (!herb) throw new Error('药材不存在')
    if (herb.stock < amount) throw new Error(`${herb.name} 库存不足`)
    
    return updateHerb(id, { stock: herb.stock - amount })
  }
  
  // 增加库存
  const addStock = async (id, amount) => {
    const herb = await db.herbs.getItem(id)
    if (!herb) throw new Error('药材不存在')
    
    return updateHerb(id, { stock: herb.stock + amount })
  }
  
  // 批量导入
  const importHerbs = async (herbList) => {
    for (const data of herbList) {
      await addHerb(data)
    }
  }
  
  // 导出所有
  const exportHerbs = () => {
    return herbs.value
  }
  
  return {
    herbs,
    loading,
    herbList,
    herbById,
    herbExistsByName,
    searchHerbs,
    lowStockHerbs,
    loadHerbs,
    addHerb,
    updateHerb,
    deleteHerb,
    deductStock,
    addStock,
    importHerbs,
    exportHerbs
  }
})