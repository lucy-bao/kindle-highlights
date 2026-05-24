<template>
  <section class="shell">
    <header class="topbar">
      <button class="brand" @click="$emit('select-book', null)">Kindle Clippings</button>
      <label class="search">
        <span aria-hidden="true">⌕</span>
        <input
          :value="query"
          type="search"
          placeholder="搜索内容、书名或作者"
          aria-label="搜索内容、书名或作者"
          @input="$emit('update:query', $event.target.value.trim())"
        />
      </label>
      <button class="import-link" @click="$emit('open-import')">导入文件</button>
    </header>

    <section class="content" :class="{ 'search-content': query }">
      <div v-if="!query && !selectedBook" class="section-title">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ summaryText }}</p>
        </div>

        <div v-if="showViewTabs" class="view-tabs" role="tablist" aria-label="切换视图">
          <button :class="{ active: viewMode === 'books' }" @click="$emit('update:view-mode', 'books')">▦ 书籍</button>
          <button :class="{ active: viewMode === 'highlights' }" @click="$emit('update:view-mode', 'highlights')">☰ 划线</button>
        </div>
      </div>

      <div v-if="statusMessage" class="notice">{{ statusMessage }}</div>

      <section v-if="query" class="search-results">
        <div class="search-heading">
          <h1>搜索结果</h1>
          <p>关键词: <strong>"{{ query }}"</strong></p>
        </div>

        <section v-if="searchGroups.length" class="search-groups">
          <article v-for="book in searchGroups" :key="book.id" class="search-group">
            <div class="search-book">
              <h2>
                <span v-for="(part, index) in highlightParts(book.title)" :key="index" :class="{ mark: part.hit }">
                  {{ part.text }}
                </span>
              </h2>
              <p>
                <span v-for="(part, index) in highlightParts(book.author)" :key="index" :class="{ mark: part.hit }">
                  {{ part.text }}
                </span>
              </p>
            </div>

            <div class="highlight-list search-highlight-list">
              <article
                v-for="item in book.highlights"
                :key="item.id"
                class="highlight-row"
                role="button"
                tabindex="0"
                @click="$emit('open-card', item)"
                @keydown.enter.prevent="$emit('open-card', item)"
                @keydown.space.prevent="$emit('open-card', item)"
              >
                <div class="highlight-main">
                  <p class="quote">
                    <span v-for="(part, index) in highlightParts(item.content)" :key="index" :class="{ mark: part.hit }">
                      {{ part.text }}
                    </span>
                  </p>
                  <p class="meta">
                    《<span v-for="(part, index) in highlightParts(item.title)" :key="index" :class="{ mark: part.hit }">
                      {{ part.text }}
                    </span>》
                    <span v-for="(part, index) in highlightParts(item.author)" :key="index" :class="{ mark: part.hit }">
                      {{ part.text }}
                    </span>
                  </p>
                </div>
                <div class="highlight-info">
                  <span>{{ pageText(item) }}</span>
                  <span>{{ clippingDateText(item) }}</span>
                </div>
              </article>
            </div>
          </article>
        </section>

        <section v-else class="empty search-empty">
          <h2>没有找到相关划线</h2>
          <p>换个关键词试试，例如书名、作者或划线中的短句。</p>
        </section>
      </section>

      <section v-else-if="!hasData" class="empty">
        <div class="empty-icon">▥</div>
        <h2>还没有导入划线</h2>
        <p>导入 Kindle 的 My Clippings.txt 后，书籍、划线和导出卡片会显示在这里。</p>
        <button @click="$emit('open-import')">导入文件</button>
      </section>

      <section v-else-if="selectedBook" class="book-detail">
        <button class="book-back" @click="$emit('select-book', null)">‹ 返回书架</button>

        <div class="book-detail-head">
          <div class="cover detail-cover">
            <strong>{{ compactTitle(selectedBook.title) }}</strong>
            <span>{{ selectedBook.highlights.length }}</span>
          </div>
          <div class="book-detail-meta">
            <h1>{{ selectedBook.title }}</h1>
            <p>{{ selectedBook.author }}</p>
          </div>
        </div>

        <section class="highlight-list book-detail-list">
          <article
            v-for="item in visibleHighlights"
            :key="item.id"
            class="highlight-row"
            role="button"
            tabindex="0"
            @click="$emit('open-card', item)"
            @keydown.enter.prevent="$emit('open-card', item)"
            @keydown.space.prevent="$emit('open-card', item)"
          >
            <div class="highlight-main">
              <p class="quote">{{ item.content }}</p>
              <p class="meta">《{{ item.title }}》 {{ item.author }}</p>
            </div>
            <div class="highlight-info">
              <span>{{ pageText(item) }}</span>
              <span>{{ clippingDateText(item) }}</span>
            </div>
          </article>
        </section>
      </section>

      <section v-else-if="viewMode === 'highlights'" class="highlight-list">
        <article
          v-for="item in visibleHighlights"
          :key="item.id"
          class="highlight-row"
          role="button"
          tabindex="0"
          @click="$emit('open-card', item)"
          @keydown.enter.prevent="$emit('open-card', item)"
          @keydown.space.prevent="$emit('open-card', item)"
        >
          <div class="highlight-main">
            <p class="quote">{{ item.content }}</p>
            <p class="meta">《{{ item.title }}》 {{ item.author }}</p>
          </div>
          <div class="highlight-info">
            <span>{{ pageText(item) }}</span>
            <span>{{ clippingDateText(item) }}</span>
          </div>
        </article>
      </section>

      <section v-else class="books-grid">
        <article v-for="book in visibleBooks" :key="book.id" class="book-card" @click="$emit('select-book', book)">
          <div class="cover">
            <strong>{{ compactTitle(book.title) }}</strong>
            <span>{{ book.highlights.length }}</span>
          </div>
          <h2>{{ book.title }}</h2>
          <p>{{ book.author }}</p>
        </article>
      </section>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { clippingDateText, compactTitle, pageText } from '../utils/formatters'

const props = defineProps({
  hasData: { type: Boolean, required: true },
  query: { type: String, required: true },
  selectedBook: { type: Object, default: null },
  searchGroups: { type: Array, required: true },
  statusMessage: { type: String, default: '' },
  summaryText: { type: String, required: true },
  viewMode: { type: String, required: true },
  visibleBooks: { type: Array, required: true },
  visibleHighlights: { type: Array, required: true },
})

defineEmits(['open-card', 'open-import', 'select-book', 'update:query', 'update:view-mode'])

const pageTitle = computed(() => {
  if (props.query) return '搜索结果'
  if (props.selectedBook) return props.selectedBook.title
  return '我的书架'
})

const showViewTabs = computed(() => props.hasData && !props.query && !props.selectedBook)

function highlightParts(text = '') {
  if (!props.query) return [{ text, hit: false }]

  const lowerText = text.toLowerCase()
  const lowerQuery = props.query.toLowerCase()
  const parts = []
  let cursor = 0
  let matchIndex = lowerText.indexOf(lowerQuery)

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push({ text: text.slice(cursor, matchIndex), hit: false })
    }

    const endIndex = matchIndex + props.query.length
    parts.push({ text: text.slice(matchIndex, endIndex), hit: true })
    cursor = endIndex
    matchIndex = lowerText.indexOf(lowerQuery, cursor)
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), hit: false })
  }

  return parts.length ? parts : [{ text, hit: false }]
}
</script>
