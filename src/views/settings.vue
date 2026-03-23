<template>
  <div class="settings-page">
    <div class="header">
      <h2>设置</h2>
    </div>
    
    <div class="settings-list">
      <!-- 本地存储设置 -->
      <div class="setting-group">
        <div class="group-title">本地存储</div>
        
        <div class="setting-item" @click="selectStoragePath">
          <div class="item-icon">📁</div>
          <div class="item-content">
            <div class="item-title">数据保存位置</div>
            <div class="item-desc">{{ storagePath || '点击启用' }}</div>
          </div>
          <div class="item-arrow">→</div>
        </div>
        
        <div class="setting-item">
          <div class="item-icon">🔄</div>
          <div class="item-content">
            <div class="item-title">自动同步</div>
            <div class="item-desc">保存处方时自动同步到本地</div>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="autoSync" @change="saveSettings">
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="setting-item" @click="syncNow" v-if="storagePath">
          <div class="item-icon">💾</div>
          <div class="item-content">
            <div class="item-title">立即同步</div>
            <div class="item-desc">手动保存所有数据到本地</div>
          </div>
          <div class="item-arrow">→</div>
        </div>
      </div>
      
      <!-- 数据管理 -->
      <div class="setting-group">
        <div class="group-title">数据管理</div>
        
        <div class="setting-item" @click="exportData">
          <div class="item-icon">📤</div>
          <div class="item-content">
            <div class="item-title">导出数据</div>
            <div class="item-desc">将所有数据导出为 JSON 文件</div>
          </div>
          <div class="item-arrow">→</div>
        </div>
        
        <div class="setting-item" @click="openImportModal">
          <div class="item-icon">📥</div>
          <div class="item-content">
            <div class="item-title">导入数据</div>
            <div class="item-desc">从备份文件恢复数据</div>
          </div>
          <input 
            type="file" 
            accept=".json"
            style="display: none"
            ref="importFileInput"
            @change="handleImport"
          >
          <div class="item-arrow">→</div>
        </div>
        
        <div class="setting-item danger" @click="clearAllData">
          <div class="item-icon">🗑️</div>
          <div class="item-content">
            <div class="item-title">清空所有数据</div>
            <div class="item-desc">删除所有药材、患者和处方记录</div>
          </div>
          <div class="item-arrow">→</div>
        </div>
      </div>
      
      <!-- 打印设置 -->
      <div class="setting-group">
        <div class="group-title">打印设置</div>
        
        <div class="setting-item">
          <div class="item-icon">🖨️</div>
          <div class="item-content">
            <div class="item-title">默认打印格式</div>
          </div>
          <select v-model="settings.printFormat" class="item-select" @change="saveSettings">
            <option value="a4">A4 纸</option>
            <option value="receipt">小票纸 (80mm)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <div class="item-icon">🏥</div>
          <div class="item-content">
            <div class="item-title">诊所名称</div>
            <div class="item-desc">显示在处方单顶部</div>
          </div>
          <input 
            v-model="settings.clinicName" 
            type="text" 
            class="item-input"
            placeholder="输入诊所名称"
            @change="saveSettings"
          >
        </div>
        
        <div class="setting-item">
          <div class="item-icon">👨‍⚕️</div>
          <div class="item-content">
            <div class="item-title">医师姓名</div>
          </div>
          <input 
            v-model="settings.doctorName" 
            type="text" 
            class="item-input"
            placeholder="输入医师姓名"
            @change="saveSettings"
          >
        </div>
      </div>
      
      <!-- 系统信息 -->
      <div class="setting-group">
        <div class="group-title">系统信息</div>
        
        <div class="setting-item">
          <div class="item-icon">📱</div>
          <div class="item-content">
            <div class="item-title">应用版本</div>
          </div>
          <div class="item-value">v1.0.0</div>
        </div>
        
        <div class="setting-item">
          <div class="item-icon">💾</div>
          <div class="item-content">
            <div class="item-title">数据存储</div>
          </div>
          <div class="item-value">本地 + Documents</div>
        </div>
        
        <div class="setting-item">
          <div class="item-icon">📧</div>
          <div class="item-content">
            <div class="item-title">技术支持</div>
            <div class="item-desc">1451717463@qq.com</div>
          </div>
        </div>
      </div>
      
      <!-- 版权 -->
      <div class="copyright">
        <p>波波鱼版权所有</p>
      </div>
    </div>
    
    <!-- 导出数据弹窗 -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="modal" @click.stop>
        <h3>导出数据</h3>
        <p class="modal-desc">以下数据将被导出：</p>
        <ul class="export-list">
          <li>🌿 药材：{{ herbCount }} 种</li>
          <li>👤 患者：{{ patientCount }} 人</li>
          <li>📝 处方：{{ prescriptionCount }} 张</li>
        </ul>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showExportModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmExport">确认导出</button>
        </div>
      </div>
    </div>

    <!-- 导入数据弹窗 -->
    <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
      <div class="modal modal-lg" @click.stop>
        <h3>导入数据</h3>
        <p class="modal-desc">选择要导入的备份文件：</p>

        <div v-if="loadingBackups" class="loading-state">
          <p>正在加载备份文件...</p>
        </div>

        <div v-else-if="backupFiles.length === 0" class="empty-state">
          <p>未找到备份文件</p>
          <p class="hint">请先在「导出数据」中创建备份，或使用下方按钮选择本地文件</p>
        </div>

        <div v-else class="backup-list">
          <div 
            v-for="file in backupFiles" 
            :key="file.name"
            class="backup-item"
            :class="{ selected: selectedBackup === file.name }"
            @click="selectedBackup = file.name"
          >
            <div class="backup-info">
              <div class="backup-name">{{ file.name }}</div>
              <div class="backup-meta">
                {{ file.herbCount }} 药材 · {{ file.patientCount }} 患者 · {{ file.prescriptionCount }} 处方
              </div>
              <div class="backup-time">导出时间：{{ file.exportTime }}</div>
            </div>
            <div class="backup-check" v-if="selectedBackup === file.name">✓</div>
          </div>
        </div>

        <div class="import-actions">
          <button class="btn btn-secondary" @click="triggerImport">从本地选择文件</button>
          <button 
            class="btn btn-primary" 
            @click="importFromBackup"
            :disabled="!selectedBackup"
          >
            导入选中文件
          </button>
        </div>

        <button class="btn btn-text" @click="closeImportModal">取消</button>
      </div>
    </div>

    <!-- 导入确认弹窗 -->
    <div v-if="showImportConfirmModal" class="modal-overlay" @click="showImportConfirmModal = false">
      <div class="modal" @click.stop>
        <h3>确认导入</h3>
        <p class="modal-desc">导入数据将覆盖现有数据！</p>
        <ul class="export-list">
          <li>🌿 药材：{{ importPreview.herbCount }} 种</li>
          <li>👤 患者：{{ importPreview.patientCount }} 人</li>
          <li>📝 处方：{{ importPreview.prescriptionCount }} 张</li>
        </ul>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showImportConfirmModal = false">取消</button>
          <button class="btn btn-danger" @click="confirmImport">确认导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHerbStore } from '../stores/herbs'
import { usePatientStore } from '../stores/patients'
import { usePrescriptionStore } from '../stores/prescriptions'
import { db } from '../db'
import { useFileStorage } from '../services/fileStorage'
import { Filesystem, Directory } from '@capacitor/filesystem'
import dayjs from 'dayjs'


const herbStore = useHerbStore()
const patientStore = usePatientStore()
const prescriptionStore = usePrescriptionStore()
const fileStorage = useFileStorage()

const showExportModal = ref(false)
const showImportModal = ref(false)
const showImportConfirmModal = ref(false)
const herbCount = ref(0)
const patientCount = ref(0)
const prescriptionCount = ref(0)
const backupFiles = ref([])
const selectedBackup = ref('')
const loadingBackups = ref(false)
const importPreview = ref({ herbCount: 0, patientCount: 0, prescriptionCount: 0 })
const storagePath = ref('')
const autoSync = ref(false)
const importFileInput = ref(null)

const settings = ref({
  printFormat: 'a4',
  clinicName: '',
  doctorName: '',
  autoSync: false
})

const loadCounts = async () => {
    //加载药材
  await herbStore.loadHerbs()
    //加载患者
  await patientStore.loadPatients()
    //加载处方
  await prescriptionStore.loadPrescriptions()

  herbCount.value = herbStore.herbs.length
  patientCount.value = patientStore.patients.length
  prescriptionCount.value = prescriptionStore.prescriptions.length
}

const loadSettings = async () => {
  const saved = await db.settings.getItem('appSettings')
  if (saved) {
    settings.value = { ...settings.value, ...saved }
    autoSync.value = saved.autoSync || false
  }
    storagePath.value = await fileStorage.getStoragePath() || ''
}

const saveSettings = async () => {
  settings.value.autoSync = autoSync.value

  await db.settings.setItem('appSettings', JSON.parse(JSON.stringify(settings.value)))
}

const selectStoragePath = async () => {
  try {
    const success = await fileStorage.saveStoragePath()
    if (success) {
        storagePath.value = await fileStorage.getStoragePath()
        alert('保存位置设置成功！数据将保存到手机 Documents 目录。')
    } else {
      alert('设置失败')
    }
  } catch (e) {
    console.error('选择存储位置失败:', e)
    alert('设置失败: ' + e.message)
  }
}

  const syncNow = async () => {
    const hasPath = await fileStorage.hasStoragePath()
    if (!hasPath) {
      alert('请先设置数据保存位置')
      return
    }
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
        settings: settings.value
      }
      
      await fileStorage.saveToFile(data)
      alert('同步成功！')
    } catch (e) {
      const errorDetail = `错误类型: ${e.constructor?.name || 'Unknown'}\n错误信息: ${e.message}\n错误码: ${e.code || 'N/A'}`
      alert('同步失败: ' + errorDetail)
    }
  }

const exportData = async () => {
  await loadCounts()
  showExportModal.value = true
}

const confirmExport = async () => {
  try {
    const data = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      herbs: herbStore.exportHerbs(),
      patients: patientStore.patients,
      prescriptions: prescriptionStore.prescriptions,
      settings: settings.value
    }
    
    const filename = `tsmps_data_backup_${dayjs().format('YYYYMMDDHHmmss')}.json`
    
    await Filesystem.mkdir({
      path: 'tsmps',
      directory: Directory.Documents
    }).catch(() => {})
    
    await Filesystem.writeFile({
      path: `tsmps/${filename}`,
      data: JSON.stringify(data, null, 2),
      directory: Directory.Documents,
      encoding: 'utf8'
    })
    
    showExportModal.value = false
    alert('导出成功！文件已保存到应用存储目录')
  } catch (e) {
    console.error('导出失败:', e)
    showExportModal.value = false
    alert('导出失败：' + e.message)
  }
}

const openImportModal = async () => {
  showImportModal.value = true
  selectedBackup.value = ''
  backupFiles.value = []
  await loadBackupFiles()
}

const closeImportModal = () => {
  showImportModal.value = false
  showImportConfirmModal.value = false
  selectedBackup.value = ''
  backupFiles.value = []
}

const loadBackupFiles = async () => {
  loadingBackups.value = true
  try {
    const hasPath = await fileStorage.hasStoragePath()
    if (!hasPath) {
      loadingBackups.value = false
      return
    }

    const files = []
    const backupDir = 'tsmps'

    const list = await Filesystem.readdir({
      path: backupDir,
      directory: Directory.Documents
    })

    for (const file of list.files) {
      if (file.name.endsWith('.json')) {
        try {
          const content = await Filesystem.readFile({
            path: `${backupDir}/${file.name}`,
            directory: Directory.Documents,
            encoding: 'utf8'
          })
          const data = JSON.parse(content)
          files.push({
            name: file.name,
            herbCount: data.herbs?.length || 0,
            patientCount: data.patients?.length || 0,
            prescriptionCount: data.prescriptions?.length || 0,
            exportTime: data.exportTime ? dayjs(data.exportTime).format('YYYY-MM-DD HH:mm') : '未知',
            rawData: data
          })
        } catch (e) {
          console.warn(`读取文件失败: ${file.name}`, e)
        }
      }
    }

    files.sort((a, b) => b.name.localeCompare(a.name))
    backupFiles.value = files
  } catch (e) {
    console.warn('加载备份文件失败:', e)
    backupFiles.value = []
  } finally {
    loadingBackups.value = false
  }
}

const importFromBackup = () => {
  const file = backupFiles.value.find(f => f.name === selectedBackup.value)
  if (!file) return

  importPreview.value = {
    herbCount: file.herbCount,
    patientCount: file.patientCount,
    prescriptionCount: file.prescriptionCount
  }
  showImportConfirmModal.value = true
}

const confirmImport = async () => {
  const file = backupFiles.value.find(f => f.name === selectedBackup.value)
  if (!file) return

  try {
    await performImport(file.rawData)
    showImportConfirmModal.value = false
    closeImportModal()
    alert('导入成功！')
    window.location.reload()
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

const triggerImport = async () => {
  if (importFileInput.value) {
    importFileInput.value.click()
  }
}

const handleImport = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    importPreview.value = {
      herbCount: data.herbs?.length || 0,
      patientCount: data.patients?.length || 0,
      prescriptionCount: data.prescriptions?.length || 0
    }

    if (!confirm('导入数据将覆盖现有数据，是否继续？')) {
      e.target.value = ''
      return
    }

    await performImport(data)
    e.target.value = ''
    alert('导入成功！')
    window.location.reload()
  } catch (err) {
    e.target.value = ''
    alert('导入失败：' + err.message)
  }
}

const performImport = async (data) => {
  await db.herbs.clear()
  await db.patients.clear()
  await db.prescriptions.clear()

  if (data.herbs) {
    for (const herb of data.herbs) {
      await db.herbs.setItem(herb.id, herb)
    }
  }
  if (data.patients) {
    for (const patient of data.patients) {
      await db.patients.setItem(patient.id, patient)
    }
  }
  if (data.prescriptions) {
    for (const prescription of data.prescriptions) {
      await db.prescriptions.setItem(prescription.id, prescription)
    }
  }
  if (data.settings) {
    await db.settings.setItem('appSettings', data.settings)
  }
}

const clearAllData = async () => {
  if (!confirm('确定清空所有数据吗？此操作不可恢复！')) return
  if (!confirm('再次确认：将删除所有药材、患者和处方记录！')) return
  
  try {
    await db.herbs.clear()
    await db.patients.clear()
    await db.prescriptions.clear()
    alert('数据已清空')
    window.location.reload()
  } catch (err) {
    alert('操作失败：' + err.message)
  }
}

onMounted(() => {
  loadCounts()
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  font-size: 20px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.group-title {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg);
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger .item-title {
  color: var(--danger);
}

.item-icon {
  font-size: 24px;
  margin-right: 12px;
  width: 32px;
  text-align: center;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
}

.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.item-arrow {
  color: var(--text-secondary);
  font-size: 18px;
}

.item-value {
  font-size: 14px;
  color: var(--text-secondary);
}

.item-select {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.item-input {
  width: 120px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  text-align: right;
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
  max-width: 360px;
}

.modal h3 {
  margin-bottom: 12px;
}

.modal-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.export-list {
  list-style: none;
  margin-bottom: 20px;
}

.export-list li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.export-list li:last-child {
  border-bottom: none;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions .btn {
  flex: 1;
}

.copyright {
  text-align: center;
  padding: 30px 16px;
  color: var(--text-secondary);
  font-size: 12px;
}

.modal-lg {
  max-width: 420px;
}

.loading-state {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}

.empty-state .hint {
  font-size: 12px;
  margin-top: 8px;
}

.backup-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-item:hover {
  background: var(--bg);
}

.backup-item.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.backup-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.backup-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.backup-check {
  width: 24px;
  height: 24px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.import-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.import-actions .btn {
  flex: 1;
  font-size: 13px;
  padding: 10px 12px;
}

.btn-text {
  width: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 12px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
}
</style>