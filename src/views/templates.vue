<template>
  <div class="templates-page">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>处方模板</h2>
    </div>
    
    <div class="template-list">
      <div 
        v-for="template in templates" 
        :key="template.id"
        class="template-card"
        @click="useTemplate(template)"
      >
        <div class="template-header">
          <h3>{{ template.name }}</h3>
          <span class="herb-count">{{ template.items.length }}味药</span>
        </div>
        <div class="template-desc">{{ template.description }}</div>
        <div class="herb-preview">
          <span v-for="(item, idx) in template.items.slice(0, 5)" :key="idx" class="herb-tag">
            {{ item.herbName }} {{ item.dosage }}g
          </span>
          <span v-if="template.items.length > 5" class="more">+{{ template.items.length - 5 }}</span>
        </div>
      </div>
    </div>
    
    <!-- 预览/使用模板弹窗 -->
    <div v-if="selectedTemplate" class="modal-overlay" @click="selectedTemplate = null">
      <div class="modal" @click.stop>
        <h3>{{ selectedTemplate.name }}</h3>
        <p class="desc">{{ selectedTemplate.description }}</p>
        
        <div class="herb-list">
          <div v-for="(item, idx) in selectedTemplate.items" :key="idx" class="herb-row">
            <span class="name">{{ item.herbName }}</span>
            <span class="dosage">{{ item.dosage }}g</span>
          </div>
        </div>
        
        <div class="template-actions">
          <button class="btn btn-secondary" @click="selectedTemplate = null">取消</button>
          <button class="btn btn-primary" @click="confirmUseTemplate">使用此模板</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 内置3种处方模板
const templates = ref([
  {
    id: 'template-1',
    name: '感冒发热方',
    description: '适用于风寒感冒，发热头痛，鼻塞流涕',
    items: [
      { herbName: '麻黄', dosage: 9 },
      { herbName: '桂枝', dosage: 6 },
      { herbName: '杏仁', dosage: 9 },
      { herbName: '甘草', dosage: 3 },
      { herbName: '生姜', dosage: 9 },
      { herbName: '大枣', dosage: 12 }
    ]
  },
  {
    id: 'template-2',
    name: '调理脾胃方',
    description: '适用于脾胃虚弱，食欲不振，腹胀便溏',
    items: [
      { herbName: '党参', dosage: 12 },
      { herbName: '白术', dosage: 9 },
      { herbName: '茯苓', dosage: 9 },
      { herbName: '甘草', dosage: 6 },
      { herbName: '陈皮', dosage: 6 },
      { herbName: '砂仁', dosage: 6 },
      { herbName: '山药', dosage: 12 }
    ]
  },
  {
    id: 'template-3',
    name: '安神助眠方',
    description: '适用于心悸失眠，多梦易醒，神经衰弱',
    items: [
      { herbName: '酸枣仁', dosage: 15 },
      { herbName: '知母', dosage: 9 },
      { herbName: '茯苓', dosage: 9 },
      { herbName: '川芎', dosage: 6 },
      { herbName: '甘草', dosage: 3 },
      { herbName: '柏子仁', dosage: 9 },
      { herbName: '远志', dosage: 6 }
    ]
  }
])

const selectedTemplate = ref(null)

const goBack = () => router.back()

const useTemplate = (template) => {
  selectedTemplate.value = template
}

const confirmUseTemplate = () => {
  // 将模板数据传递到新建处方页面
  router.push({
    path: '/prescription/new',
    query: { 
      template: JSON.stringify(selectedTemplate.value)
    }
  })
}
</script>

<style scoped>
.templates-page {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.template-card:active {
  transform: scale(0.98);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-header h3 {
  font-size: 18px;
  color: var(--primary);
}

.herb-count {
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 4px 8px;
  border-radius: 12px;
}

.template-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.herb-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.herb-tag {
  font-size: 12px;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 4px 8px;
  border-radius: 4px;
}

.more {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
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
  margin-bottom: 8px;
}

.modal .desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.herb-list {
  background: var(--bg);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.herb-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.herb-row:last-child {
  border-bottom: none;
}

.template-actions {
  display: flex;
  gap: 12px;
}

.template-actions .btn {
  flex: 1;
}
</style>