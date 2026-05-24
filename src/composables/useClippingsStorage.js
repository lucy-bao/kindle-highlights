import { parseClippings } from '../parser'

const DB_NAME = 'kindle-highlights'
const DB_STORE = 'files'
const LAST_FILE_KEY = 'last-file-handle'
const FALLBACK_TEXT_KEY = 'kindle-highlights:last-text'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveHandle(handle) {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(handle, LAST_FILE_KEY)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function readHandle() {
  if (!window.showOpenFilePicker) return null

  try {
    const db = await openDatabase()

    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly')
      const request = tx.objectStore(DB_STORE).get(LAST_FILE_KEY)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

async function parseTextFile(file) {
  if (!file) return { cancelled: true }

  if (!file.name.toLowerCase().endsWith('.txt')) {
    return { error: '只能导入 .txt 文件' }
  }

  const text = await file.text()
  const highlights = parseClippings(text)

  if (!highlights.length) {
    return { error: '没有解析到有效的 Kindle 划线，请确认文件格式是否正确' }
  }

  return { fileName: file.name, highlights, text }
}

export function useClippingsStorage() {
  async function importBrowserFile(file) {
    const result = await parseTextFile(file)
    if (result.error || !result.highlights) return result

    // 普通 input/拖拽拿不到真实路径，保存文本副本作为兼容降级。
    localStorage.setItem(FALLBACK_TEXT_KEY, result.text)
    return result
  }

  async function pickFileWithAccessApi() {
    if (!window.showOpenFilePicker) return { error: '当前浏览器不支持直接记住文件，请使用上传按钮' }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }],
        excludeAcceptAllOption: true,
        multiple: false,
      })
      const result = await parseTextFile(await handle.getFile())
      if (result.error || !result.highlights) return result

      // 支持 File System Access API 时保存文件句柄，下次打开优先读取原文件。
      await saveHandle(handle)
      localStorage.setItem(FALLBACK_TEXT_KEY, result.text)
      return result
    } catch (error) {
      if (error?.name === 'AbortError') return { cancelled: true }
      return { error: '读取文件失败，请重新选择 My Clippings.txt' }
    }
  }

  async function restoreLastFile() {
    const handle = await readHandle()

    if (handle) {
      try {
        const permission = await handle.requestPermission?.({ mode: 'read' })

        if (!permission || permission === 'granted') {
          const result = await parseTextFile(await handle.getFile())
          if (result.highlights) return result
        }
      } catch {
        return restoreFallbackText('无法读取上次文件，已尝试使用浏览器缓存内容')
      }
    }

    return restoreFallbackText()
  }

  function restoreFallbackText(message = '') {
    const cachedText = localStorage.getItem(FALLBACK_TEXT_KEY)
    if (!cachedText) return { message }

    const highlights = parseClippings(cachedText)
    if (!highlights.length) return { message }

    return { highlights, message }
  }

  return {
    importBrowserFile,
    pickFileWithAccessApi,
    restoreLastFile,
  }
}
