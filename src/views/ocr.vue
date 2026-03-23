<template>
  <div class="ocr-page">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>图片识别</h2>
    </div>
    
    <div class="upload-area" @click="selectImage" v-if="!selectedImage">
      <div class="upload-icon">📷</div>
      <div class="upload-text">点击选择图片</div>
      <div class="upload-hint">支持拍照或从相册选择</div>
      <input 
        ref="fileInput"
        type="file" 
        accept="image/*" 
        style="display: none"
        @change="handleFileChange"
      >
    </div>
    
    <div v-else class="preview-area">
      <img :src="selectedImage" class="preview-image">
      <div class="preview-actions">
        <button class="btn btn-secondary" @click="selectedImage = null; ocrResult = null">
          重新选择
        </button>
        <button class="btn btn-primary" @click="startOCR" :disabled="isProcessing">
          {{ isProcessing ? '识别中...' : '开始识别' }}
        </button>
      </div>
    </div>
    
    <!-- 识别结果 -->
    <div v-if="ocrResult" class="result-section">
      <h3>识别结果</h3>
      <div class="result-content">{{ ocrResult }}</div>
      <div class="result-actions">
        <button class="btn btn-secondary" @click="ocrResult = null">清除</button>
        <button class="btn btn-primary" @click="useResult">使用此结果</button>
      </div>
    </div>
    
    <!-- 网络提示 -->
    <div class="network-tip">
      <p>💡 提示：图片识别需要联网使用 OCR 服务</p>
      <p>识别失败时可手动录入药材</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fileInput = ref(null)
const selectedImage = ref(null)
const isProcessing = ref(false)
const ocrResult = ref(null)

const goBack = () => router.back()

const selectImage = () => {
  fileInput.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const startOCR = async () => {
  // 检查网络状态
  if (!navigator.onLine) {
    alert('当前无网络连接，图片识别需要联网。请连接网络后重试，或选择手动录入。')
    return
  }
  
  isProcessing.value = true
  
  try {
    // 这里需要接入实际的 OCR API
    // 示例：百度 OCR、腾讯 OCR、阿里 OCR 等
    // 由于需要 API Key，这里仅作演示
    
    alert('OCR 功能需要配置 API 密钥。\n\n请按以下步骤操作：\n1. 申请百度/腾讯/阿里 OCR API\n2. 在代码中配置 API Key\n3. 重新部署')
    
    // 模拟识别结果
    ocrResult.value = '麻黄 9g\n桂枝 6g\n杏仁 9g\n甘草 3g'
    
  } catch (e) {
    alert('识别失败：' + e.message)
  } finally {
    isProcessing.value = false
  }
}

const useResult = () => {
  // 解析识别结果并跳转到新建处方页面
  const lines = ocrResult.value.split('\n')
  const items = []
  
  for (const line of lines) {
    const match = line.match(/(.+?)\s*(\d+)\s*g/)
    if (match) {
      items.push({
        herbName: match[1].trim(),
        dosage: parseInt(match[2])
      })
    }
  }
  
  router.push({
    path: '/prescription/new',
    query: {
      ocrItems: JSON.stringify(items)
    }
  })
}
</script>

<style scoped>
.ocr-page {
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

.upload-area {
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:active {
  background: var(--bg);
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

.preview-area {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.result-section {
  margin-top: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.result-section h3 {
  margin-bottom: 12px;
}

.result-content {
  background: var(--bg);
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-actions .btn {
  flex: 1;
}

.network-tip {
  margin-top: 24px;
  padding: 16px;
  background: var(--primary-light);
  border-radius: 12px;
  font-size: 14px;
  color: var(--primary-dark);
}

.network-tip p {
  margin-bottom: 4px;
}
</style>