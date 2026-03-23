<template>
  <div class="herbs-page">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>药材管理</h2>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="showBatchModal = true">
          批量添加
        </button>
        <button class="btn btn-primary btn-sm" @click="showAddModal = true">
          + 添加
        </button>
      </div>
    </div>
    
    <div class="search-bar">
      <input 
        v-model="searchKey"
        type="text" 
        class="form-input"
        placeholder="搜索药材名称、拼音..."
      >
    </div>
    
    <div class="filter-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-btn"
        :class="{ active: currentTab === tab.value }"
        @click="currentTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="herb-list-container">
      <div class="herb-list">
        <div v-if="filteredHerbs.length === 0" class="empty">
  暂无药材
        </div>
      <div 
        v-for="herb in filteredHerbs" 
        :key="herb.id"
        class="herb-card"
        :class="{ 'low-stock': herb.stock <= (herb.minStock || 0.1) }"
        @click="editHerb(herb)"
      >
        <div class="herb-header">
          <span class="name">{{ herb.name }}</span>
          <span class="stock" :class="{ warning: herb.stock <= (herb.minStock || 0.1) }">
            库存: {{ herb.stock.toFixed(2) }}公斤
          </span>
        </div>
        <div class="herb-info">
          <div class="price-row">
            <span>成本: ¥{{ herb.costPrice }}/公斤</span>
            <span>售价: ¥{{ herb.salePrice }}/公斤</span>
            <span v-if="herb.discount && herb.discount !== 10" class="discount">
              {{ herb.discount }}折
            </span>
          </div>
          <div class="category">{{ herb.category || '未分类' }}</div>
        </div>
      </div>
    </div>
    
    <button v-if="filteredHerbs.length > 0" class="clear-all-herbs" @click="clearAllHerbs">
      清空全部药材
    </button>
    </div>
    
    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal || editingHerb" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingHerb ? '编辑药材' : '添加药材' }}</h3>
        <form @submit.prevent="saveHerb">
          <div class="form-group">
            <label class="form-label">药材名称 *</label>
            <input v-model="form.name" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">拼音</label>
            <input v-model="form.pinyin" type="text" class="form-input" placeholder="可选，用于搜索">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">成本价 (元/公斤) *</label>
              <input v-model.number="form.costPrice" type="number" step="0.01" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">销售价 (元/公斤) *</label>
              <input v-model.number="form.salePrice" type="number" step="0.01" class="form-input" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">库存 (公斤) *</label>
              <input v-model.number="form.stock" type="number" step="0.01" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">库存预警值</label>
              <input v-model.number="form.minStock" type="number" step="0.01" class="form-input" placeholder="默认0.1">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">折扣 (0-10)</label>
              <input v-model.number="form.discount" type="number" min="0" max="10" step="0.1" class="form-input" placeholder="10=无折扣">
            </div>
            <div class="form-group">
              <label class="form-label">分类</label>
              <select v-model="form.category" class="form-input">
                <option value="">请选择</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="form.remark" class="form-input" rows="2"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
            <button v-if="editingHerb" type="button" class="btn btn-danger" @click="deleteHerb">删除</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 库存调整弹窗 -->
    <div v-if="showStockModal" class="modal-overlay" @click="showStockModal = false">
      <div class="modal" @click.stop>
        <h3>调整库存 - {{ stockForm.herbName }}</h3>
        <div class="current-stock">当前库存: {{ stockForm.currentStock.toFixed(2) }}公斤</div>
        <div class="form-group">
          <label class="form-label">调整数量 (+增加 / -减少)</label>
          <input v-model.number="stockForm.amount" type="number" class="form-input" placeholder="如: 100 或 -50">
        </div>
        <div class="form-group">
          <label class="form-label">备注</label>
          <input v-model="stockForm.remark" type="text" class="form-input" placeholder="如: 进货、盘点损耗等">
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showStockModal = false">取消</button>
          <button class="btn btn-primary" @click="adjustStock">确认</button>
        </div>
      </div>
    </div>

    <!-- 批量添加弹窗 -->
    <div v-if="showBatchModal" class="modal-overlay" @click="closeBatchModal">
      <div class="modal modal-lg" @click.stop>
        <h3>批量添加药材</h3>
        <p class="modal-hint">格式：药材名称|成本价|库存（每行一条）</p>
        <div class="batch-example">
          <div class="example-title">示例：</div>
          <div class="example-text">当归|25|10</div>
          <div class="example-text">枸杞|30|5</div>
          <div class="example-text">黄芪|20|8</div>
        </div>
        <textarea 
          v-model="batchText" 
          class="form-input batch-textarea"
          placeholder="粘贴药材信息，如：&#10;当归|25|10&#10;枸杞|30|5&#10;黄芪|20|8"
          rows="8"
        ></textarea>
        
        <div class="batch-actions">
          <button class="btn btn-secondary" @click="parseBatchText">解析</button>
          <button class="btn btn-outline btn-sm" @click="clearBatchText">清空</button>
        </div>

        <div v-if="batchItems.length > 0" class="batch-preview">
          <div class="preview-header">
            <span>预览 ({{ batchItems.length }} 条)</span>
            <label class="select-all">
              <input type="checkbox" v-model="selectAllBatch" @change="toggleSelectAll">
              全选
            </label>
          </div>
          <div class="preview-list">
            <div 
              v-for="(item, index) in batchItems" 
              :key="index"
              class="preview-item"
              :class="{ 'not-selected': !item.selected, 'has-error': item.error }"
            >
              <label class="item-checkbox">
                <input type="checkbox" v-model="item.selected">
              </label>
              <div class="item-content">
                <div class="item-row">
                  <span class="item-label">名称</span>
                  <input v-model="item.name" class="item-input" placeholder="药材名称">
                </div>
                <div class="item-row-group">
                  <div class="item-row">
                    <span class="item-label">成本价</span>
                    <input v-model.number="item.costPrice" type="number" step="0.01" class="item-input small">
                  </div>
                  <div class="item-row">
                    <span class="item-label">销售价</span>
                    <input v-model.number="item.salePrice" type="number" step="0.01" class="item-input small">
                  </div>
                  <div class="item-row">
                    <span class="item-label">库存</span>
                    <input v-model.number="item.stock" type="number" step="0.01" class="item-input small">
                  </div>
                </div>
                <div v-if="item.error" class="item-error">{{ item.error }}</div>
              </div>
              <button class="item-remove" @click="removeBatchItem(index)">×</button>
            </div>
          </div>
        </div>

        <div v-if="batchItems.length > 0" class="batch-footer">
          <button class="btn btn-secondary" @click="closeBatchModal">取消</button>
          <button class="btn btn-primary" @click="confirmBatchImport" :disabled="selectedBatchCount === 0">
            添加选中 ({{ selectedBatchCount }} 条)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHerbStore } from '../stores/herbs'
import { db } from '../db'

const router = useRouter()

const goBack = () => router.back()

const herbStore = useHerbStore()

const searchKey = ref('')
const currentTab = ref('all')
const showAddModal = ref(false)
const showStockModal = ref(false)
const showBatchModal = ref(false)
const editingHerb = ref(null)
const batchText = ref('')
const batchItems = ref([])
const selectAllBatch = ref(true)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '库存预警', value: 'low' }
]

const categories = ['解表药', '清热药', '泻下药', '祛风湿药', '芳香化湿药', '利水渗湿药', '温里药', '理气药', '消食药', '驱虫药', '止血药', '活血化瘀药', '化痰止咳平喘药', '安神药', '平肝息风药', '开窍药', '补益药', '收涩药', '其他']

const defaultForm = {
  name: '',
  pinyin: '',
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  minStock: 0.1,
  discount: 10,
  category: '',
  remark: ''
}

const form = ref({ ...defaultForm })

const stockForm = ref({
  herbId: '',
  herbName: '',
  currentStock: 0,
  amount: 0,
  remark: ''
})

const filteredHerbs = computed(() => {
  let list = herbStore.searchHerbs(searchKey.value)
  
  if (currentTab.value === 'low') {
    list = list.filter(h => h.stock <= (h.minStock || 0.1))
  }
  
  return list
})

const editHerb = (herb) => {
  editingHerb.value = herb
  form.value = { ...herb }
}

const closeModal = () => {
  showAddModal.value = false
  editingHerb.value = null
  form.value = { ...defaultForm }
}

const saveHerb = async () => {
  try {
    if (editingHerb.value) {
      await herbStore.updateHerb(editingHerb.value.id, form.value)
    } else {
      await herbStore.addHerb(form.value)
    }
    closeModal()
  } catch (e) {
    alert(e.message)
  }
}

const deleteHerb = async () => {
  if (!confirm('确定删除该药材吗？')) return
  try {
    await herbStore.deleteHerb(editingHerb.value.id)
    closeModal()
  } catch (e) {
    alert(e.message)
  }
}

const adjustStock = async () => {
  try {
    if (stockForm.value.amount > 0) {
      await herbStore.addStock(stockForm.value.herbId, stockForm.value.amount)
    } else if (stockForm.value.amount < 0) {
      await herbStore.deductStock(stockForm.value.herbId, Math.abs(stockForm.value.amount))
    }
    showStockModal.value = false
  } catch (e) {
    alert(e.message)
  }
}

const closeBatchModal = () => {
  showBatchModal.value = false
  batchText.value = ''
  batchItems.value = []
}

const clearBatchText = () => {
  batchText.value = ''
  batchItems.value = []
}

const parseBatchText = () => {
  const text = batchText.value.trim()
  if (!text) {
    alert('请输入药材信息')
    return
  }

  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    alert('未识别到有效数据')
    return
  }

  const items = []
  const errors = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const parts = line.split('|').map(p => p.trim())

    if (parts.length < 3) {
      errors.push(`第 ${i + 1} 行：格式错误，需要 名称|成本价|库存`)
      continue
    }

    const name = parts[0]
    const costPrice = parseFloat(parts[1])
    const stock = parseFloat(parts[2])

    if (!name) {
      errors.push(`第 ${i + 1} 行：药材名称不能为空`)
      continue
    }
    if (isNaN(costPrice) || costPrice <= 0) {
      errors.push(`第 ${i + 1} 行：成本价必须是正数`)
      continue
    }
    if (isNaN(stock) || stock < 0) {
      errors.push(`第 ${i + 1} 行：库存必须是正数`)
      continue
    }

    items.push({
      name,
      costPrice,
      salePrice: costPrice,
      stock,
      minStock: 0.1,
      discount: 10,
      category: '',
      pinyin: '',
      remark: '',
      selected: true,
      error: ''
    })
  }

  if (errors.length > 0) {
    alert('解析完成，但有以下错误：\n' + errors.join('\n'))
  }

  batchItems.value = items
  selectAllBatch.value = true
}

const removeBatchItem = (index) => {
  batchItems.value.splice(index, 1)
}

const toggleSelectAll = () => {
  batchItems.value.forEach(item => {
    item.selected = selectAllBatch.value
  })
}

const selectedBatchCount = computed(() => {
  return batchItems.value.filter(item => item.selected).length
})

const confirmBatchImport = async () => {
  const selectedItems = batchItems.value.filter(item => item.selected)
  
  if (selectedItems.length === 0) {
    alert('请至少选择一条药材')
    return
  }

  let successCount = 0
  const duplicateNames = []
  const failedNames = []

  for (const item of selectedItems) {
    try {
      await herbStore.addHerb({
        name: item.name,
        costPrice: item.costPrice,
        salePrice: item.salePrice,
        stock: item.stock,
        minStock: item.minStock,
        discount: item.discount,
        category: item.category,
        pinyin: item.pinyin,
        remark: item.remark
      })
      successCount++
    } catch (e) {
      if (e.message.includes('已存在')) {
        duplicateNames.push(item.name)
      } else {
        failedNames.push(item.name)
      }
    }
  }

  let msg = ''
  if (successCount > 0) {
    msg += `成功添加 ${successCount} 条药材\n`
  }
  if (duplicateNames.length > 0) {
    msg += `以下药材已存在，已跳过：${duplicateNames.join('、')}`
  }
  if (failedNames.length > 0) {
    msg += `\n以下药材添加失败：${failedNames.join('、')}`
  }
  
  alert(msg || '没有添加任何药材')
  
  if (successCount > 0) {
    closeBatchModal()
  }
}

onMounted(() => {
  herbStore.loadHerbs()
})

const clearAllHerbs = async () => {
  if (!confirm('确定清空所有药材吗？此操作不可恢复！')) return
  if (!confirm('再次确认：将删除所有药材数据！')) return
  
  try {
    await db.herbs.clear()
    await herbStore.loadHerbs()
    alert('药材库已清空')
  } catch (e) {
    alert('清空失败：' + e.message)
  }
}
</script>

<style scoped>
.herbs-page {
  padding: 16px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
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
  margin-bottom: 12px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.herb-list-container {
  flex: 1;
  overflow-y: auto;
  margin: 12px 0;
}

.herb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.herb-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
}

.herb-card.low-stock {
  border-left: 4px solid var(--danger);
}

.herb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.herb-header .name {
  font-size: 18px;
  font-weight: 600;
}

.herb-header .stock {
  font-size: 14px;
  color: var(--text-secondary);
}

.herb-header .stock.warning {
  color: var(--danger);
  font-weight: 500;
}

.herb-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.price-row {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.price-row .discount {
  color: var(--primary);
  font-weight: 500;
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

.current-stock {
  text-align: center;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 500;
}

.empty {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}

.clear-all-herbs {
  width: 100%;
  padding: 12px;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-outline {
  background: white;
  border: 1px solid var(--primary);
  color: var(--primary);
}

.btn-outline:active {
  background: var(--primary-light);
}

.modal-lg {
  max-width: 440px;
}

.modal-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.batch-example {
  background: var(--bg);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 13px;
}

.example-title {
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.example-text {
  font-family: monospace;
  color: var(--text);
  margin-bottom: 2px;
}

.batch-textarea {
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.batch-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 16px;
}

.batch-preview {
  border-top: 1px solid var(--border);
  padding-top: 16px;
  margin-top: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.select-all input {
  cursor: pointer;
}

.preview-list {
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
}

.preview-item {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: var(--bg);
  border-radius: 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}

.preview-item.not-selected {
  opacity: 0.5;
}

.preview-item.has-error {
  border: 1px solid var(--danger);
}

.item-checkbox {
  padding-top: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.item-row-group {
  display: flex;
  gap: 6px;
}

.item-label {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 32px;
  flex-shrink: 0;
}

.item-input {
  flex: 1;
  min-width: 0;
  padding: 5px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
}

.item-input.small {
  flex: 0 0 40px;
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  text-align: center;
}

.item-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}

.item-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--text-secondary);
  color: white;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.batch-footer {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.batch-footer .btn {
  flex: 1;
}
</style>