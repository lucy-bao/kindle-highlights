import { parseClippings } from '../parser'

const DB_NAME = 'kindle-highlights'
const DB_STORE = 'files'
const LAST_FILE_KEY = 'last-file-handle'
const CACHE_KEY = 'kindle-highlights:file-cache'
const LEGACY_TEXT_KEY = 'kindle-highlights:last-text'

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

function saveTextCache({ fileName = '', text }) {
  // localStorage 只保留这一份最新解析文本缓存，再次导入会覆盖旧缓存。
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      fileName,
      text,
      updatedAt: Date.now(),
    }),
  )
  localStorage.removeItem(LEGACY_TEXT_KEY)
}

function readTextCache(message = '') {
  const cached = localStorage.getItem(CACHE_KEY)
  const legacyText = localStorage.getItem(LEGACY_TEXT_KEY)
  const payload = cached ? parseCachePayload(cached) : legacyText ? { text: legacyText } : null

  if (!payload?.text) return { message }

  const highlights = parseClippings(payload.text)
  if (!highlights.length) return { message }

  return {
    fileName: payload.fileName || '缓存文件',
    highlights,
    message,
  }
}

function parseCachePayload(value) {
  try {
    return JSON.parse(value)
  } catch {
    return { text: value }
  }
}

export function useClippingsStorage() {
  async function importBrowserFile(file) {
    const result = await parseTextFile(file)
    if (result.error || !result.highlights) return result

    // 普通 input/拖拽拿不到真实路径，直接覆盖唯一文本缓存。
    saveTextCache(result)
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
      saveTextCache(result)
      return result
    } catch (error) {
      if (error?.name === 'AbortError') return { cancelled: true }
      return { error: '读取文件失败，请重新选择 My Clippings.txt' }
    }
  }

  async function restoreLastFile() {
    const cached = readTextCache()
    if (cached.highlights) return cached

    return {}
  }

  return {
    importBrowserFile,
    pickFileWithAccessApi,
    restoreLastFile,
  }
}
