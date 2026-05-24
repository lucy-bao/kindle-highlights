<template>
  <main>
    <HomePage
      v-if="page === 'home'"
      :has-data="hasData"
      :query="query"
      :selected-book="selectedBook"
      :status-message="statusMessage"
      :summary-text="summaryText"
      :view-mode="viewMode"
      :visible-books="visibleBooks"
      :visible-highlights="visibleHighlights"
      :search-groups="searchGroups"
      @open-card="openCard"
      @open-import="openImport"
      @select-book="selectBook"
      @update:query="query = $event"
      @update:view-mode="viewMode = $event"
    />

    <ImportPage
      v-else
      :error="importError"
      @back="page = 'home'"
      @pick-file-access="pickFileWithSystemDialog"
      @upload-file="importFile"
    />

    <ExportCardModal v-if="cardItem" :item="cardItem" @close="cardItem = null" />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ExportCardModal from './components/ExportCardModal.vue'
import HomePage from './components/HomePage.vue'
import ImportPage from './components/ImportPage.vue'
import { useClippingsStorage } from './composables/useClippingsStorage'
import { groupByBook } from './parser'
import { clippingTimeValue } from './utils/formatters'

const { importBrowserFile, pickFileWithAccessApi, restoreLastFile } = useClippingsStorage()

const page = ref('home')
const query = ref('')
const highlights = ref([])
const viewMode = ref('books')
const selectedBook = ref(null)
const statusMessage = ref('')
const importError = ref('')
const cardItem = ref(null)

const books = computed(() => groupByBook(highlights.value))
const hasData = computed(() => highlights.value.length > 0)
const normalizedQuery = computed(() => query.value.toLowerCase())

// 首页列表数据：书架、划线列表、书籍详情都从同一份 highlights 派生。
const visibleHighlights = computed(() => {
  let source = highlights.value

  if (selectedBook.value && !query.value) {
    source = selectedBook.value.highlights
  }

  if (!normalizedQuery.value) return sortByClippingTime(source)

  return sortByClippingTime(
    source.filter((item) => {
      const haystack = `${item.content} ${item.title} ${item.author}`.toLowerCase()
      return haystack.includes(normalizedQuery.value)
    }),
  )
})

const visibleBooks = computed(() => {
  if (!normalizedQuery.value) return books.value

  const matchedBookIds = visibleHighlights.value.map((item) => `${item.title}__${item.author}`)
  return books.value.filter((book) => matchedBookIds.includes(book.id))
})

const searchGroups = computed(() => {
  if (!normalizedQuery.value) return []

  return groupByBook(visibleHighlights.value).map((book) => ({
    ...book,
    highlights: sortByClippingTime(book.highlights),
  }))
})

// 统计文案集中在这里，避免页面组件里混入业务判断。
const summaryText = computed(() => {
  if (!hasData.value) return '共解析出 0 本书籍，0 条划线'
  if (query.value) return `找到 ${visibleHighlights.value.length} 条相关划线`
  if (selectedBook.value) return `${selectedBook.value.author} · ${selectedBook.value.highlights.length} 条划线`
  return `共解析出 ${books.value.length} 本书籍，${highlights.value.length} 条划线`
})

onMounted(async () => {
  const result = await restoreLastFile()
  if (result?.highlights) applyHighlights(result.highlights)
  if (result?.message) showStatus(result.message)
})

function openImport() {
  importError.value = ''
  page.value = 'import'
}

function selectBook(book) {
  selectedBook.value = book
  query.value = ''
}

async function pickFileWithSystemDialog() {
  importError.value = ''
  const result = await pickFileWithAccessApi()
  applyImportResult(result)
}

async function importFile(file) {
  importError.value = ''
  const result = await importBrowserFile(file)
  applyImportResult(result)
}

function applyImportResult(result) {
  if (!result || result.cancelled) return

  if (result.error) {
    importError.value = result.error
    return
  }

  applyHighlights(result.highlights, `已导入 ${result.fileName}`)
  page.value = 'home'
}

// 每次导入或恢复文件后，都重置为书架默认浏览状态。
function applyHighlights(parsed, message = '') {
  highlights.value = parsed
  selectedBook.value = null
  viewMode.value = 'books'

  if (message) showStatus(message)
}

function showStatus(message) {
  statusMessage.value = message
  window.setTimeout(() => {
    if (statusMessage.value === message) statusMessage.value = ''
  }, 2400)
}

function openCard(item) {
  cardItem.value = item
}

function sortByClippingTime(items) {
  return [...items].sort((a, b) => clippingTimeValue(b) - clippingTimeValue(a))
}
</script>
