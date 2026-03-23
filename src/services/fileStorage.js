import { Filesystem, Directory } from '@capacitor/filesystem'
import { db } from '../db'

const DATA_FILE = 'tsmps_data.json'
const SAVE_DIR = 'tsmps'

const useDirectory = Directory.Documents

const ensureDir = async () => {
  try {
    await Filesystem.readdir({
      path: SAVE_DIR,
      directory: useDirectory
    })
    return true
  } catch (e) {
    try {
      await Filesystem.mkdir({
        path: SAVE_DIR,
        directory: useDirectory
      })
      return true
    } catch (e2) {
      return false
    }
  }
}

export const useFileStorage = () => {
  const saveStoragePath = async () => {
    try {
      await db.settings.setItem('storagePath', 'granted')
      const ok = await ensureDir()
      if (!ok) {
        throw new Error('无法创建存储目录')
      }
      return true
    } catch (e) {
      console.error('设置存储路径失败:', e)
      throw new Error('设置失败: ' + e.message)
    }
  }

  const getStoragePath = async () => {
    const hasPermission = await db.settings.getItem('storagePath')
    if (hasPermission === 'granted') {
      return `Documents/${SAVE_DIR}/${DATA_FILE}`
    }
    return ''
  }

  const hasStoragePath = async () => {
    const path = await getStoragePath()
    return !!path && path !== ''
  }

  const saveToFile = async (dataToSave) => {
    const dirOk = await ensureDir()
    if (!dirOk) {
      throw new Error('存储目录不可用，请重新设置')
    }
    
    const data = dataToSave || {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      herbs: [],
      patients: [],
      prescriptions: [],
      settings: await db.settings.getItem('appSettings')
    }
    
    const jsonStr = JSON.stringify(data, null, 2)
    const filePath = `${SAVE_DIR}/${DATA_FILE}`

    try {
      await Filesystem.writeFile({
        path: filePath,
        data: jsonStr,
        directory: useDirectory,
        encoding: 'utf8'
      })
      return true
    } catch (e) {
      const errorMsg = e.message || String(e)
      throw new Error(`保存失败: ${errorMsg}`)
    }
  }

  const importFromFile = async () => {
    try {
      const content = await Filesystem.readFile({
        path: `${SAVE_DIR}/${DATA_FILE}`,
        directory: useDirectory,
        encoding: 'utf8'
      })

      const data = JSON.parse(content)

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

      return true
    } catch (e) {
      console.error('读取文件失败:', e)
      throw new Error('读取失败: ' + e.message)
    }
  }

  const autoSync = async () => {
    const hasPermission = await hasStoragePath()
    if (hasPermission) {
      try {
        await saveToFile()
      } catch (e) {
        console.warn('自动同步失败:', e)
      }
    }
  }

  return {
    saveStoragePath,
    getStoragePath,
    hasStoragePath,
    saveToFile,
    importFromFile,
    autoSync,
    ensureDir
  }
}

export default useFileStorage
